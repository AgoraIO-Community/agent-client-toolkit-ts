import { describe, it, expect, beforeEach } from 'vitest';
import { ChunkedMessageAssembler } from '../../../src/messaging/chunked';

// Helper: encode a payload as base64 (jsdom provides btoa globally)
function encode(payload: unknown): string {
  return btoa(JSON.stringify(payload));
}

function chunk(msgId: string, partIdx: number, partSum: number | '???', data: string): string {
  return `${msgId}|${partIdx}|${partSum}|${data}`;
}

describe('ChunkedMessageAssembler', () => {
  let assembler: ChunkedMessageAssembler;

  beforeEach(() => {
    assembler = new ChunkedMessageAssembler();
  });

  it('1. single chunk — returns decoded object immediately', () => {
    const payload = { object: 'test', value: 42 };
    const raw = chunk('msg1', 0, 1, encode(payload));
    const result = assembler.assemble(raw);
    expect(result).toEqual(payload);
  });

  it('2. multi-chunk in order — returns null until last chunk', () => {
    const payload = { text: 'hello world' };
    const full = encode(payload);
    // Split base64 string into 3 roughly equal parts
    const third = Math.ceil(full.length / 3);
    const p0 = full.slice(0, third);
    const p1 = full.slice(third, third * 2);
    const p2 = full.slice(third * 2);

    expect(assembler.assemble(chunk('msg2', 0, 3, p0))).toBeNull();
    expect(assembler.assemble(chunk('msg2', 1, 3, p1))).toBeNull();
    const result = assembler.assemble(chunk('msg2', 2, 3, p2));
    expect(result).toEqual(payload);
  });

  it('3. multi-chunk out of order — assembles correctly on last arrival', () => {
    const payload = { order: 'test' };
    const full = encode(payload);
    const third = Math.ceil(full.length / 3);
    const p0 = full.slice(0, third);
    const p1 = full.slice(third, third * 2);
    const p2 = full.slice(third * 2);

    expect(assembler.assemble(chunk('msg3', 2, 3, p2))).toBeNull();
    expect(assembler.assemble(chunk('msg3', 0, 3, p0))).toBeNull();
    const result = assembler.assemble(chunk('msg3', 1, 3, p1));
    expect(result).toEqual(payload);
  });

  it('4. deduplication — duplicate part_idx ignored, assembly still completes', () => {
    const payload = { dup: true };
    const full = encode(payload);
    const half = Math.ceil(full.length / 2);
    const p0 = full.slice(0, half);
    const p1 = full.slice(half);

    assembler.assemble(chunk('msg4', 0, 2, p0));
    // Send chunk 0 again — should be ignored
    expect(assembler.assemble(chunk('msg4', 0, 2, p0))).toBeNull();
    // Now send chunk 1 — assembly should complete
    const result = assembler.assemble(chunk('msg4', 1, 2, p1));
    expect(result).toEqual(payload);
  });

  it('5. unknown total (???) — never assembles, always returns null', () => {
    const payload = { unknown: true };
    const data = encode(payload);

    expect(assembler.assemble(chunk('msg5', 0, '???', data))).toBeNull();
    expect(assembler.assemble(chunk('msg5', 1, '???', data))).toBeNull();
    expect(assembler.assemble(chunk('msg5', 2, '???', data))).toBeNull();
  });

  it('6. wrong pipe count — returns null immediately', () => {
    expect(assembler.assemble('only|three|parts')).toBeNull();
    expect(assembler.assemble('too|many|pipe|delimited|parts')).toBeNull();
    expect(assembler.assemble('')).toBeNull();
  });

  it('7. malformed base64 — returns null, does not throw', () => {
    const raw = chunk('msg7', 0, 1, '!!!not-valid-base64!!!');
    expect(() => assembler.assemble(raw)).not.toThrow();
    expect(assembler.assemble(raw)).toBeNull();
  });

  it('8. invalid JSON after decode — returns null, does not throw', () => {
    const notJson = btoa('this is not json {{{');
    const raw = chunk('msg8', 0, 1, notJson);
    expect(() => assembler.assemble(raw)).not.toThrow();
    expect(assembler.assemble(raw)).toBeNull();
  });

  it('9. multiple concurrent message IDs — each assembles independently', () => {
    const payloadA = { id: 'A' };
    const payloadB = { id: 'B' };
    const fullA = encode(payloadA);
    const fullB = encode(payloadB);
    const halfA = Math.ceil(fullA.length / 2);
    const halfB = Math.ceil(fullB.length / 2);

    // Interleave chunks from two different messages
    assembler.assemble(chunk('msgA', 0, 2, fullA.slice(0, halfA)));
    assembler.assemble(chunk('msgB', 0, 2, fullB.slice(0, halfB)));

    const resultA = assembler.assemble(chunk('msgA', 1, 2, fullA.slice(halfA)));
    const resultB = assembler.assemble(chunk('msgB', 1, 2, fullB.slice(halfB)));

    expect(resultA).toEqual(payloadA);
    expect(resultB).toEqual(payloadB);
  });

  it('10. clear() discards in-progress state', () => {
    const payload = { clear: true };
    const full = encode(payload);
    const half = Math.ceil(full.length / 2);

    // Send first chunk of a 2-part message
    assembler.assemble(chunk('msg10', 0, 2, full.slice(0, half)));

    // Clear all state
    assembler.clear();

    // The second chunk now arrives but the first is gone — cannot complete
    const result = assembler.assemble(chunk('msg10', 1, 2, full.slice(half)));
    expect(result).toBeNull();
  });
});
