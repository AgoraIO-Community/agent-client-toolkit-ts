import type { AgoraVoiceAIConfig, RTCEngine, RTMEngine } from '../../../src';

declare const foreignRtcClient: {
  on(eventName: string, listener: (...args: any[]) => void): void;
  off(eventName: string, listener: (...args: any[]) => void): void;
};

declare const foreignRtmClient: {
  publish(
    channelName: string,
    message: string | Uint8Array,
    options?: { channelType?: string; customType?: string }
  ): Promise<{ code: number }>;
  addEventListener(eventName: string, listener: (...args: any[]) => void): void;
  removeEventListener(eventName: string, listener: (...args: any[]) => void): void;
};

function acceptsRtcEngine(engine: RTCEngine) {
  return engine;
}

function acceptsRtmEngine(engine: RTMEngine) {
  return engine;
}

const rtcEngine = acceptsRtcEngine(foreignRtcClient);
const rtmEngine = acceptsRtmEngine(foreignRtmClient);

const config: AgoraVoiceAIConfig = {
  rtcEngine,
  rtmConfig: {
    rtmEngine,
  },
};

void config;
