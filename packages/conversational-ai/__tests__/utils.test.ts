import { describe, it, expect, vi, afterEach } from 'vitest';
import { factoryFormatLog, logger, decodeStreamMessage } from '../../../src/utils/debug';
import {
  ConsoleMetricsReporter,
  AgoraMetricsReporter,
} from '../../../src/utils/metrics';
import { ConversationalAIError } from '../../../src/core/types';

// ── decodeStreamMessage ───────────────────────────────────────────────────

describe('decodeStreamMessage', () => {
  it('decodes a Uint8Array to string', () => {
    const encoded = new TextEncoder().encode('hello world');
    expect(decodeStreamMessage(encoded)).toBe('hello world');
  });
});

// ── LogManager (logger singleton) ─────────────────────────────────────────

describe('logger', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('logger.info() does not throw', () => {
    expect(() => logger.info('test', { key: 'value' })).not.toThrow();
  });

  it('logger.log() does not throw', () => {
    expect(() => logger.log('test')).not.toThrow();
  });

  it('logger.debug() does not throw', () => {
    expect(() => logger.debug('test')).not.toThrow();
  });

  it('logger.error() does not throw', () => {
    expect(() => logger.error('test', new Error('boom'))).not.toThrow();
  });

  it('logger.warn() does not throw', () => {
    expect(() => logger.warn('test')).not.toThrow();
  });

  it('downloadLogs() returns a zip File', async () => {
    logger.info('log entry for download test');
    const file = await logger.downloadLogs();
    expect(file).toBeInstanceOf(File);
    expect(file?.name).toBe('logs.zip');
    expect(file?.type).toBe('application/zip');
  });
});

// ── factoryFormatLog / safeStringify ──────────────────────────────────────

describe('factoryFormatLog', () => {
  it('formats a string arg', () => {
    const fmt = factoryFormatLog({ tag: 'SDK' });
    expect(fmt('hello')).toBe('[SDK] hello');
  });

  it('formats multiple args joined by space', () => {
    const fmt = factoryFormatLog({ tag: 'SDK' });
    expect(fmt('hello', 'world')).toBe('[SDK] hello world');
  });

  it('serializes plain objects to JSON', () => {
    const fmt = factoryFormatLog({ tag: 'SDK' });
    expect(fmt({ key: 'value' })).toBe('[SDK] {"key":"value"}');
  });

  it('falls back to String() for circular references instead of throwing', () => {
    const fmt = factoryFormatLog({ tag: 'SDK' });
    const circ: Record<string, unknown> = {};
    circ.self = circ;
    expect(() => fmt(circ)).not.toThrow();
    const result = fmt(circ);
    expect(result.startsWith('[SDK]')).toBe(true);
  });

  it('uses the provided tag in the prefix', () => {
    const fmt = factoryFormatLog({ tag: 'MY-TAG' });
    expect(fmt('test')).toBe('[MY-TAG] test');
  });
});

// ── ConversationalAIError cause ───────────────────────────────────────────

describe('ConversationalAIError', () => {
  it('cause is undefined when not provided', () => {
    const err = new ConversationalAIError('msg');
    expect(err.cause).toBeUndefined();
  });

  it('cause is set when provided', () => {
    const inner = new Error('inner');
    const err = new ConversationalAIError('msg', { cause: inner });
    expect(err.cause).toBe(inner);
  });

  it('cause accepts non-Error values', () => {
    const err = new ConversationalAIError('msg', { cause: 42 });
    expect(err.cause).toBe(42);
  });
});

// ── ConsoleMetricsReporter ────────────────────────────────────────────────

describe('ConsoleMetricsReporter', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('report() calls console.debug with event and data', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const reporter = new ConsoleMetricsReporter();
    reporter.report('test-event', { foo: 'bar' });
    expect(spy).toHaveBeenCalledOnce();
    expect(spy.mock.calls[0][0]).toContain('test-event');
    expect(spy.mock.calls[0][1]).toEqual({ foo: 'bar' });
  });
});

// ── AgoraMetricsReporter ──────────────────────────────────────────────────

// Control the @agora-js/report dynamic import per test via this ref.
// The factory reads the current value at import time.
let mockReportDefault: unknown;
vi.mock('@agora-js/report', () => ({
  get default() {
    return mockReportDefault;
  },
}));

describe('AgoraMetricsReporter', () => {
  afterEach(() => {
    mockReportDefault = undefined;
    vi.restoreAllMocks();
  });

  it('report() before init() falls back to console.debug', () => {
    const spy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const reporter = new AgoraMetricsReporter();
    reporter.report('evt', { value: 1 });
    expect(spy).toHaveBeenCalledWith('[ConversationalAI:metrics] evt', { value: 1 });
  });

  it('init() with non-function default export warns and leaves reporter null', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    mockReportDefault = 'not-a-constructor';
    const reporter = new AgoraMetricsReporter();
    await reporter.init();
    expect(warnSpy).toHaveBeenCalledOnce();
    expect(warnSpy.mock.calls[0][0]).toContain('not a constructor');
    // reporter still null — falls back to console.debug
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    reporter.report('evt', {});
    expect(debugSpy).toHaveBeenCalled();
  });

  it('init() success — report() delegates to the AgoraReport instance', async () => {
    const mockReportFn = vi.fn();
    mockReportDefault = class MockAgoraReport {
      report = mockReportFn;
    };
    const debugSpy = vi.spyOn(console, 'debug').mockImplementation(() => {});
    const reporter = new AgoraMetricsReporter();
    await reporter.init();
    reporter.report('evt', { x: 1 });
    expect(mockReportFn).toHaveBeenCalledWith('evt', { x: 1 });
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it('init() with a throwing constructor logs error and falls back', async () => {
    const errSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockReportDefault = class BadReport {
      constructor() {
        throw new TypeError('init failed');
      }
    };
    const reporter = new AgoraMetricsReporter();
    await reporter.init();
    expect(errSpy).toHaveBeenCalledOnce();
    expect(errSpy.mock.calls[0][0]).toContain('Failed to initialize');
  });
});
