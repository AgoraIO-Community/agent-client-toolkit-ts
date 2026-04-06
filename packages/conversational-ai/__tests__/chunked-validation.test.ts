import { describe, it, expect, beforeEach } from 'vitest';
import { ChunkedMessageAssembler } from '../../../src/messaging/chunked';

function encode(payload: unknown): string {
  return btoa(JSON.stringify(payload));
}

function chunk(msgId: string, partIdx: number | string, partSum: number | string, data: string): string {
  return `${msgId}|${partIdx}|${partSum}|${data}`;
}

describe('ChunkedMessageAssembler validation', () => {
  let assembler: ChunkedMessageAssembler;

  beforeEach(() => {
    assembler = new ChunkedMessageAssembler();
  });

  it('NaN part_idx returns null', () => {
    const result = assembler.assemble(chunk('msg', 'abc', '5', encode({ test: true })));
    expect(result).toBeNull();
  });

  it('NaN part_sum returns null', () => {
    const result = assembler.assemble(chunk('msg', '1', 'xyz', encode({ test: true })));
    expect(result).toBeNull();
  });

  it('negative part_idx returns null', () => {
    const result = assembler.assemble(chunk('msg', '-1', '5', encode({ test: true })));
    expect(result).toBeNull();
  });

  it('zero part_idx returns null', () => {
    const result = assembler.assemble(chunk('msg', '0', '5', encode({ test: true })));
    expect(result).toBeNull();
  });

  it('part_idx >= part_sum returns null', () => {
    const result = assembler.assemble(chunk('msg', '7', '5', encode({ test: true })));
    expect(result).toBeNull();
  });

  it('part_idx === part_sum returns null', () => {
    const result = assembler.assemble(chunk('msg', '5', '5', encode({ test: true })));
    expect(result).toBeNull();
  });

  it('part_sum === 0 returns null', () => {
    const result = assembler.assemble(chunk('msg', '1', '0', encode({ test: true })));
    expect(result).toBeNull();
  });

  it('negative part_sum returns null', () => {
    const result = assembler.assemble(chunk('msg', '1', '-3', encode({ test: true })));
    expect(result).toBeNull();
  });

  it('cache size cap — oldest entry evicted when maxCacheSize exceeded', () => {
    const small = new ChunkedMessageAssembler(30_000, 2);

    // Add two incomplete messages
    small.assemble(chunk('old', '1', '3', encode({ a: 1 })));
    small.assemble(chunk('newer', '1', '3', encode({ b: 2 })));

    // Third message should evict 'old'
    small.assemble(chunk('newest', '1', '3', encode({ c: 3 })));

    // 'old' should be evicted — sending remaining parts should not complete it
    const resultOld = small.assemble(chunk('old', '2', '3', encode({ a: 1 })));
    expect(resultOld).toBeNull();
  });

  it('valid single chunk still assembles correctly after validation changes', () => {
    const payload = { validated: true };
    const raw = chunk('valid', '1', '1', encode(payload));
    const result = assembler.assemble(raw);
    expect(result).toEqual(payload);
  });

  it('??? as part_sum still treated as unknown total', () => {
    const result = assembler.assemble(chunk('unk', '1', '???', encode({ test: true })));
    expect(result).toBeNull(); // Unknown total — never completes
  });
});
