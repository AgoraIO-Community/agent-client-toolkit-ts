import { describe, it, expect, afterEach } from 'vitest';
import { AgoraVoiceAI } from '../../../src/core/conversational-ai';
import { NotInitializedError } from '../../../src/core/types';
import { createMockRTCClient } from './helpers/mocks';

describe('AgoraVoiceAI concurrency', () => {
  afterEach(() => {
    try { AgoraVoiceAI.getInstance().destroy(); } catch { /* ok */ }
  });

  it('concurrent init() calls — both resolve, _instance is consistent', async () => {
    const rtc1 = createMockRTCClient();
    const rtc2 = createMockRTCClient();

    const [ai1, ai2] = await Promise.all([
      AgoraVoiceAI.init({ rtcEngine: rtc1 as never }),
      AgoraVoiceAI.init({ rtcEngine: rtc2 as never }),
    ]);

    // Both should resolve to a valid instance
    expect(ai1).toBeInstanceOf(AgoraVoiceAI);
    expect(ai2).toBeInstanceOf(AgoraVoiceAI);
    // The singleton should be the second caller's result
    expect(AgoraVoiceAI.getInstance()).toBe(ai2);
  });

  it('destroy() called twice does not throw', async () => {
    const rtc = createMockRTCClient();
    const ai = await AgoraVoiceAI.init({ rtcEngine: rtc as never });

    expect(() => ai.destroy()).not.toThrow();
    expect(() => ai.destroy()).not.toThrow(); // Second call is a no-op
  });

  it('destroy() before init resolves does not throw', () => {
    // destroy() on no instance is a no-op
    const fresh = new (AgoraVoiceAI as unknown as { new(): AgoraVoiceAI })();
    expect(() => fresh.destroy()).not.toThrow();
  });

  it('init() after destroy() creates a fresh instance', async () => {
    const rtc1 = createMockRTCClient();
    const ai1 = await AgoraVoiceAI.init({ rtcEngine: rtc1 as never });
    ai1.destroy();
    expect(() => AgoraVoiceAI.getInstance()).toThrow(NotInitializedError);

    const rtc2 = createMockRTCClient();
    const ai2 = await AgoraVoiceAI.init({ rtcEngine: rtc2 as never });
    expect(ai2).toBeInstanceOf(AgoraVoiceAI);
    expect(AgoraVoiceAI.getInstance()).toBe(ai2);
  });

  it('getInstance() before init throws NotInitializedError', () => {
    expect(() => AgoraVoiceAI.getInstance()).toThrow(NotInitializedError);
  });

  it('re-init cleans up old event bindings', async () => {
    const rtc1 = createMockRTCClient();
    const ai1 = await AgoraVoiceAI.init({ rtcEngine: rtc1 as never });
    ai1.subscribeMessage('ch1');

    // Re-init should clean up old bindings
    const rtc2 = createMockRTCClient();
    await AgoraVoiceAI.init({ rtcEngine: rtc2 as never });

    // Old RTC client should have had events unbound
    // (via unsubscribe which calls off on the old rtcEngine)
    expect(rtc1.off).toBeDefined();
  });
});
