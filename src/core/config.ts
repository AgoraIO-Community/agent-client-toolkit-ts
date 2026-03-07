import type { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import type { RTMClient } from 'agora-rtm';
import { TranscriptHelperMode } from './types';

export interface RTMConfig {
  /** Pre-initialized RTM client. Required if using RTM. */
  rtmEngine: RTMClient;
}

export interface AgoraVoiceAIConfig {
  /** Pre-initialized Agora RTC client. Always required. */
  rtcEngine: IAgoraRTCClient;

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
