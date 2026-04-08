import { describe, expect, it, vi } from 'vitest';
import { SubRenderQueue } from '../../../src/rendering/sub-render-queue';
import { TurnStatus, type DataChunkMessageWord } from '../../../src/core/types';
import { ELoggerType } from '../../../src/utils/debug';

function createQueue() {
  const callMessagePrint = vi.fn<(type: ELoggerType, ...args: unknown[]) => void>();
  const mutateChatHistory = vi.fn<() => void>();
  return new SubRenderQueue(callMessagePrint, mutateChatHistory);
}

describe('SubRenderQueue.sortWordsWithStatus', () => {
  it('returns empty list for final turns with no words', () => {
    const queue = createQueue();
    expect(() => queue.sortWordsWithStatus([], TurnStatus.END)).not.toThrow();
    expect(queue.sortWordsWithStatus([], TurnStatus.END)).toEqual([]);
  });

  it('sorts and deduplicates by start_ms', () => {
    const queue = createQueue();
    const words: DataChunkMessageWord[] = [
      { word: 'b', start_ms: 200, duration_ms: 50, stable: true },
      { word: 'a', start_ms: 100, duration_ms: 50, stable: true },
      { word: 'dup', start_ms: 100, duration_ms: 50, stable: true },
    ];

    const result = queue.sortWordsWithStatus(words, TurnStatus.IN_PROGRESS);
    expect(result).toHaveLength(2);
    expect(result.map((w) => w.word)).toEqual(['a', 'b']);
    expect(result.every((w) => w.word_status === TurnStatus.IN_PROGRESS)).toBe(true);
  });

  it('marks only the last word as final when turn is complete', () => {
    const queue = createQueue();
    const words: DataChunkMessageWord[] = [
      { word: 'a', start_ms: 100, duration_ms: 50, stable: true },
      { word: 'b', start_ms: 200, duration_ms: 50, stable: true },
    ];

    const result = queue.sortWordsWithStatus(words, TurnStatus.END);
    expect(result).toHaveLength(2);
    expect(result[0].word_status).toBe(TurnStatus.IN_PROGRESS);
    expect(result[1].word_status).toBe(TurnStatus.END);
  });
});
