import { describe, it, expect, vi, afterEach } from 'vitest';
import { EventHelper, EventLogLevel } from '../../../src/core/events';

type TestEvents = {
  data: (value: string) => void;
  count: (n: number) => void;
};

function makeHelper() {
  return new EventHelper<TestEvents>();
}

describe('EventHelper', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── emit / handler errors ──────────────────────────────────────────────

  it('emit() swallows throwing handler — does not propagate', () => {
    const helper = makeHelper();
    helper.on('data', () => {
      throw new Error('handler boom');
    });
    expect(() => helper.emit('data', 'x')).not.toThrow();
  });

  it('emit() logs to console.error when handler throws and level is ERRORS', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const helper = makeHelper();
    helper.setLogLevel(EventLogLevel.ERRORS);
    helper.on('data', () => {
      throw new Error('boom');
    });
    helper.emit('data', 'x');
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain('data');
  });

  it('emit() does NOT log to console.error when level is NONE', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const helper = makeHelper();
    // default is NONE
    helper.on('data', () => {
      throw new Error('boom');
    });
    helper.emit('data', 'x');
    expect(spy).not.toHaveBeenCalled();
  });

  it('emit() logs to console.debug after dispatch when level is DEBUG', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const helper = makeHelper();
    helper.setLogLevel(EventLogLevel.DEBUG);
    helper.emit('data', 'hello');
    expect(spy).toHaveBeenCalled();
    const calls = spy.mock.calls.map((c) => String(c[c.length - 1]));
    expect(calls.some((s) => s.includes('data'))).toBe(true);
  });

  // ── on / off debug logging ─────────────────────────────────────────────

  it('on() logs to console.debug when level is DEBUG', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const helper = makeHelper();
    helper.setLogLevel(EventLogLevel.DEBUG);
    helper.on('data', () => {});
    expect(spy).toHaveBeenCalled();
  });

  it('off() logs to console.debug when level is DEBUG', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const helper = makeHelper();
    helper.setLogLevel(EventLogLevel.DEBUG);
    const cb = () => {};
    helper.on('data', cb);
    spy.mockClear();
    helper.off('data', cb);
    expect(spy).toHaveBeenCalled();
  });

  it('removeAllEventListeners() logs to console.debug when level is DEBUG', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const helper = makeHelper();
    helper.setLogLevel(EventLogLevel.DEBUG);
    helper.on('data', () => {});
    spy.mockClear();
    helper.removeAllEventListeners();
    expect(spy).toHaveBeenCalled();
  });

  // ── once ───────────────────────────────────────────────────────────────

  it('once() handler fires exactly once', () => {
    const helper = makeHelper();
    const cb = vi.fn();
    helper.once('data', cb);
    helper.emit('data', 'a');
    helper.emit('data', 'b');
    expect(cb).toHaveBeenCalledOnce();
    expect(cb).toHaveBeenCalledWith('a');
  });

  it('once() handler can be removed before it fires', () => {
    const helper = makeHelper();
    const cb = vi.fn();
    helper.once('data', cb);
    helper.off('data', cb);
    helper.emit('data', 'x');
    expect(cb).not.toHaveBeenCalled();
  });

  // ── listener counts ────────────────────────────────────────────────────

  it('getListenerCounts() returns counts per event', () => {
    const helper = makeHelper();
    helper.on('data', () => {});
    helper.on('data', () => {});
    helper.on('count', () => {});
    const counts = helper.getListenerCounts();
    expect(counts['data']).toBe(2);
    expect(counts['count']).toBe(1);
  });

  it('getListenerCounts() decrements after off()', () => {
    const helper = makeHelper();
    const cb = vi.fn();
    helper.on('data', cb);
    helper.off('data', cb);
    const counts = helper.getListenerCounts();
    expect(counts['data'] ?? 0).toBe(0);
  });

  // ── listener leak warning ──────────────────────────────────────────────

  it('warns once when listeners exceed setMaxListeners threshold', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const helper = makeHelper();
    helper.setMaxListeners(2);
    helper.on('data', () => {});
    helper.on('data', () => {});
    helper.on('data', () => {}); // exceeds max
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain('listener leak');
    // Second excess listener does not re-warn for the same event
    helper.on('data', () => {});
    expect(spy).toHaveBeenCalledOnce();
  });

  it('setMaxListeners(0) disables the leak warning', () => {
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const helper = makeHelper();
    helper.setMaxListeners(0);
    for (let i = 0; i < 20; i++) helper.on('data', () => {});
    expect(spy).not.toHaveBeenCalled();
  });

  // ── removeAllEventListeners ────────────────────────────────────────────

  it('removeAllEventListeners() prevents all handlers from firing', () => {
    const helper = makeHelper();
    const cb = vi.fn();
    helper.on('data', cb);
    helper.on('count', cb);
    helper.removeAllEventListeners();
    helper.emit('data', 'x');
    helper.emit('count', 1);
    expect(cb).not.toHaveBeenCalled();
  });
});
