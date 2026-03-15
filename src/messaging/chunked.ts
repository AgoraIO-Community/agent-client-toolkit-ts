/**
 * Assembles multi-part stream messages using the Trulience chunked format.
 *
 * Wire format: message_id|part_idx|part_sum|base64_data
 *
 * Where:
 *   message_id  — unique string identifier for this logical message
 *   part_idx    — 1-based index of this chunk (normalized to 0-based internally)
 *   part_sum    — total number of chunks ("???" if unknown, treated as -1)
 *   base64_data — Base64-encoded portion of the complete message payload
 *
 * When all chunks for a message_id are received, the base64 parts are
 * concatenated, decoded, and JSON-parsed to yield the complete message object.
 *
 * Key differences from the original reference implementation:
 *   - Extracted into a standalone, testable class.
 *   - Added deduplication by part_idx (Ben's version deduplicated only at the
 *     message level after full assembly).
 *   - TTL-based eviction for incomplete messages (30s default).
 *   - Input validation on part_idx/part_sum (NaN, negative, out-of-bounds).
 *   - Cache size cap to prevent unbounded memory growth.
 */
export class ChunkedMessageAssembler {
  private cache: Map<string, Array<{ part_idx: number; part_sum: number; content: string }>> =
    new Map();
  private timestamps: Map<string, number> = new Map();
  private readonly ttlMs: number;
  private readonly maxCacheSize: number;
  private readonly enableLog: boolean;

  /**
   * @param ttlMs - Time-to-live in milliseconds for incomplete messages.
   *   Cache entries older than this are evicted on the next `assemble()` call.
   *   Defaults to 30 000 ms (30 seconds).
   * @param maxCacheSize - Maximum number of in-flight message assemblies.
   *   When exceeded, the oldest entry is evicted. Defaults to 1000.
   * @param enableLog - Whether to log discarded chunks for debugging.
   */
  constructor(ttlMs: number = 30_000, maxCacheSize: number = 1000, enableLog: boolean = false) {
    this.ttlMs = ttlMs;
    this.maxCacheSize = maxCacheSize;
    this.enableLog = enableLog;
  }

  /**
   * Process one pipe-delimited chunk string.
   *
   * @param raw - The raw stream text in "message_id|part_idx|part_sum|data" format
   * @returns The assembled and parsed message object when complete, or null if incomplete
   */
  assemble(raw: string): unknown | null {
    this.evictStale();

    const parts = raw.split('|');
    if (parts.length !== 4) return null;

    const [msgId, partIdxStr, partSumStr, partData] = parts;
    const part_idx = parseInt(partIdxStr, 10) - 1; // normalize 1-based wire format to 0-based
    const part_sum = partSumStr === '???' ? -1 : parseInt(partSumStr, 10);

    // Input validation
    if (isNaN(part_idx) || (part_sum !== -1 && isNaN(part_sum))) {
      if (this.enableLog) {
        console.warn('[ChunkedMessageAssembler] Non-numeric part index/sum', { msgId });
      }
      return null;
    }
    if (part_idx < 0) {
      if (this.enableLog) {
        console.warn('[ChunkedMessageAssembler] Negative part index', { msgId });
      }
      return null;
    }
    if (part_sum !== -1 && part_sum <= 0) {
      if (this.enableLog) {
        console.warn('[ChunkedMessageAssembler] Invalid part_sum', { msgId, part_sum });
      }
      return null;
    }
    if (part_sum !== -1 && part_idx >= part_sum) {
      if (this.enableLog) {
        console.warn('[ChunkedMessageAssembler] part_idx >= part_sum', {
          msgId,
          part_idx,
          part_sum,
        });
      }
      return null;
    }

    // Cache size cap: evict oldest entry when at capacity
    if (!this.cache.has(msgId) && this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.findOldestKey();
      if (oldestKey) {
        this.cache.delete(oldestKey);
        this.timestamps.delete(oldestKey);
      }
    }

    if (!this.cache.has(msgId)) {
      this.cache.set(msgId, []);
      this.timestamps.set(msgId, Date.now());
    }

    const cached = this.cache.get(msgId)!;

    // Deduplication: skip if this part_idx was already received
    if (cached.some((c) => c.part_idx === part_idx)) {
      return null;
    }

    cached.push({ part_idx, part_sum, content: partData });
    cached.sort((a, b) => a.part_idx - b.part_idx);

    // Completeness check: known total and all parts received
    if (part_sum !== -1 && cached.length === part_sum) {
      const base64 = cached.map((c) => c.content).join('');
      this.cache.delete(msgId);
      this.timestamps.delete(msgId);

      try {
        const decoded = atob(base64);
        return JSON.parse(decoded);
      } catch {
        if (this.enableLog) {
          console.warn('[ChunkedMessageAssembler] Failed to decode chunk payload', { msgId });
        }
        return null;
      }
    }

    return null;
  }

  /**
   * Clear all in-progress message assemblies.
   * Call on session cleanup to prevent stale state across reconnections.
   */
  clear(): void {
    this.cache.clear();
    this.timestamps.clear();
  }

  /** Remove cache entries that have exceeded the TTL. */
  private evictStale(): void {
    const now = Date.now();
    for (const [msgId, ts] of this.timestamps) {
      if (now - ts > this.ttlMs) {
        this.cache.delete(msgId);
        this.timestamps.delete(msgId);
      }
    }
  }

  /** Find the cache entry with the oldest timestamp. */
  private findOldestKey(): string | undefined {
    let oldest: string | undefined;
    let oldestTs = Infinity;
    for (const [key, ts] of this.timestamps) {
      if (ts < oldestTs) {
        oldestTs = ts;
        oldest = key;
      }
    }
    return oldest;
  }
}
