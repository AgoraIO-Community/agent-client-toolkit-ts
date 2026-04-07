import { TranscriptHelperMode } from './types';

export type RTCStreamMessagePublisher = string | number;
export type RTCAudioPtsListener = (pts: number) => void;
export type RTCStreamMessageListener = (
  uid: RTCStreamMessagePublisher,
  stream: Uint8Array
) => void;
export type RTCFallbackListener = (...args: unknown[]) => void;

/** Structural contract for the RTC client consumed by AgoraVoiceAI. */
export interface RTCEngine {
  on(eventName: 'audio-pts', listener: RTCAudioPtsListener): void;
  on(eventName: 'stream-message', listener: RTCStreamMessageListener): void;
  on(eventName: string, listener: RTCFallbackListener): void;

  off(eventName: 'audio-pts', listener: RTCAudioPtsListener): void;
  off(eventName: 'stream-message', listener: RTCStreamMessageListener): void;
  off(eventName: string, listener: RTCFallbackListener): void;
}

/** Structural contract for the RTM client consumed by AgoraVoiceAI. */
export interface RTMEngine {
  publish(
    channelName: string,
    message: string | Uint8Array,
    options?: { channelType?: string; customType?: string }
  ): Promise<unknown>;
  addEventListener(eventName: string, listener: (...args: any[]) => void): void;
  removeEventListener(eventName: string, listener: (...args: any[]) => void): void;
}

export interface RTMConfig {
  /** Pre-initialized RTM client. Required if using RTM. */
  rtmEngine: RTMEngine;
}

export interface AgoraVoiceAIConfig {
  /** Pre-initialized Agora RTC client. Always required. */
  rtcEngine: RTCEngine;

  /**
   * Optional RTM configuration. When absent, the toolkit operates on
   * RTC stream-messages only. RTM-dependent features (sendText, sendImage,
   * interrupt, agent state events) are unavailable and will throw if called.
   */
  rtmConfig?: RTMConfig;

  renderMode?: TranscriptHelperMode;
  enableLog?: boolean;

  /**
   * When true, loads `@agora-js/report` dynamically and routes metrics events
   * through it. Defaults to false (console.debug fallback, zero bundle cost).
   * Requires `@agora-js/report` to be installed as an optional dependency.
   */
  enableAgoraMetrics?: boolean;
}
