import type {
  AgoraVoiceAIConfig,
  RTCEngine,
  RTMEngine,
} from '../../../src';

declare const foreignRtcClient: {
  on(eventName: 'audio-pts', listener: (pts: number) => void): void;
  on(
    eventName: 'stream-message',
    listener: (uid: string | number, stream: Uint8Array) => void
  ): void;
  on(eventName: string, listener: (...args: unknown[]) => void): void;
  off(eventName: 'audio-pts', listener: (pts: number) => void): void;
  off(
    eventName: 'stream-message',
    listener: (uid: string | number, stream: Uint8Array) => void
  ): void;
  off(eventName: string, listener: (...args: unknown[]) => void): void;
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

declare const strictRtcEngine: RTCEngine;
strictRtcEngine.on('audio-pts', (pts) => {
  const n: number = pts;
  void n;
});
strictRtcEngine.on('stream-message', (uid, stream) => {
  const id: string | number = uid;
  const bytes: Uint8Array = stream;
  void id;
  void bytes;
});
strictRtcEngine.on('some-other-event', (...args) => {
  const received: unknown[] = args;
  void received;
});

// @ts-expect-error wrong listener signature for audio-pts
strictRtcEngine.on('audio-pts', (uid: string) => {
  void uid;
});
// @ts-expect-error wrong listener signature for stream-message
strictRtcEngine.on('stream-message', (pts: number) => {
  void pts;
});

void config;
