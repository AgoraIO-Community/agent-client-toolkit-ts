import type {
  ConnectionDisconnectedReason,
  ConnectionState,
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  NetworkQuality,
  UID,
} from 'agora-rtc-sdk-ng';
import type { RTMEvents } from 'agora-rtm';

/**
 * Transcript modes for the Conversational AI API
 *
 * @since 1.6.0
 */
export enum TranscriptHelperMode {
  TEXT = 'text',
  WORD = 'word',
  CHUNK = 'chunk',
  UNKNOWN = 'unknown',
  AUTO = 'auto',
}

export enum MessageType {
  USER_TRANSCRIPTION = 'user.transcription',
  AGENT_TRANSCRIPTION = 'assistant.transcription',
  MSG_INTERRUPTED = 'message.interrupt',
  MSG_METRICS = 'message.metrics',
  MSG_ERROR = 'message.error',
  /** @deprecated */
  MSG_STATE = 'message.state',
  IMAGE_UPLOAD = 'image.upload',
  MESSAGE_INFO = 'message.info',
  MESSAGE_SAL_STATUS = 'message.sal_status',
}

export enum RTMEventType {
  MESSAGE = 'message',
  PRESENCE = 'presence',
  STATUS = 'status',
}

export enum RTCEventType {
  NETWORK_QUALITY = 'network-quality',
  USER_PUBLISHED = 'user-published',
  USER_UNPUBLISHED = 'user-unpublished',
  STREAM_MESSAGE = 'stream-message',
  USER_JOINED = 'user-joined',
  USER_LEFT = 'user-left',
  CONNECTION_STATE_CHANGE = 'connection-state-change',
  // AUDIO_METADATA = 'audio-metadata',
  AUDIO_PTS = 'audio-pts',
}

export enum RTCCustomEventType {
  MICROPHONE_CHANGED = 'microphone-changed',
  REMOTE_USER_CHANGED = 'remote-user-changed',
  REMOTE_USER_JOINED = 'remote-user-joined',
  REMOTE_USER_LEFT = 'remote-user-left',
  LOCAL_TRACKS_CHANGED = 'local-tracks-changed',
}

/**
 * Module type enumeration for AI capabilities
 *
 * @since 1.6.0
 */
export enum ModuleType {
  LLM = 'llm',
  MLLM = 'mllm',
  TTS = 'tts',
  CONTEXT = 'context',
  UNKNOWN = 'unknown',
}

export type AgentMetric = {
  type: ModuleType;
  name: string;
  value: number;
  timestamp: number;
};

export type MessageReceipt = {
  moduleType: ModuleType;
  messageType: ChatMessageType;
  message: string;
  turnId: number;
};

export type ModuleError = {
  type: ModuleType;
  code: number;
  message: string;
  timestamp: number;
};

export type StateChangeEvent = {
  state: AgentState;
  turnID: number;
  timestamp: number;
  reason: string;
};

export interface HelperRTMEvents {
  [RTMEventType.MESSAGE]: (message: RTMEvents.MessageEvent) => void;
  [RTMEventType.PRESENCE]: (presence: RTMEvents.PresenceEvent) => void;
  [RTMEventType.STATUS]: (
    status:
      | RTMEvents.RTMConnectionStatusChangeEvent
      | RTMEvents.StreamChannelConnectionStatusChangeEvent
  ) => void;
}

export interface HelperRTCEvents {
  [RTCEventType.NETWORK_QUALITY]: (quality: NetworkQuality) => void;
  [RTCEventType.USER_PUBLISHED]: (
    user: IAgoraRTCRemoteUser,
    mediaType: 'audio' | 'video'
  ) => void;
  [RTCEventType.USER_UNPUBLISHED]: (
    user: IAgoraRTCRemoteUser,
    mediaType: 'audio' | 'video'
  ) => void;
  [RTCEventType.USER_JOINED]: (user: IAgoraRTCRemoteUser) => void;
  [RTCEventType.USER_LEFT]: (
    user: IAgoraRTCRemoteUser,
    reason?: string
  ) => void;
  [RTCEventType.CONNECTION_STATE_CHANGE]: (data: {
    curState: ConnectionState;
    revState: ConnectionState;
    reason?: ConnectionDisconnectedReason;
    channel: string;
  }) => void;
  // [RTCEventType.AUDIO_METADATA]: (metadata: Uint8Array) => void @deprecated
  [RTCEventType.AUDIO_PTS]: (pts: number) => void;
  [RTCEventType.STREAM_MESSAGE]: (uid: UID, stream: Uint8Array) => void;
}

export class ConversationalAIError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConversationalAIError';
  }
}

export class NotInitializedError extends ConversationalAIError {
  constructor() {
    super('AgoraVoiceAI is not initialized. Call await AgoraVoiceAI.init(config) before using getInstance().');
    this.name = 'NotInitializedError';
  }
}

export class RTMRequiredError extends ConversationalAIError {
  constructor(method: string) {
    super(
      `[AgoraVoiceAI] ${method}() requires RTM. Pass rtmConfig: { rtmEngine } when calling AgoraVoiceAI.init().`
    );
    this.name = 'RTMRequiredError';
  }
}

/** @deprecated Use NotInitializedError instead. Kept for backward compatibility. */
export const NotFoundError = NotInitializedError;

/** Snapshot of SDK state returned by `AgoraVoiceAI.getState()`. */
export type AgoraVoiceAIState = {
  initialized: boolean;
  channel: string | null;
  hasRtm: boolean;
  renderMode: TranscriptHelperMode;
  listenerCounts: Record<string, number>;
};

// --- Message wire types ---
export type DataChunkMessageWord = {
  word: string;
  start_ms: number;
  duration_ms: number;
  stable: boolean;
};

export type TranscriptHelperObjectWord = DataChunkMessageWord & {
  word_status?: TurnStatus;
};

export enum TurnStatus {
  IN_PROGRESS = 0,
  END = 1,
  INTERRUPTED = 2,
}

/**
 * Agent state enumeration
 *
 * @since 1.6.0
 */
export enum AgentState {
  IDLE = 'idle',
  LISTENING = 'listening',
  THINKING = 'thinking',
  SPEAKING = 'speaking',
  SILENT = 'silent',
}

export interface TranscriptionBase {
  object: MessageType;
  text: string;
  start_ms: number;
  duration_ms: number;
  language: string;
  turn_id: number;
  stream_id: number;
  user_id: string;
  words: DataChunkMessageWord[] | null;
}

export interface UserTranscription extends TranscriptionBase {
  object: MessageType.USER_TRANSCRIPTION;
  final: boolean;
}

export interface AgentTranscription extends TranscriptionBase {
  object: MessageType.AGENT_TRANSCRIPTION;
  quiet: boolean;
  turn_seq_id: number;
  turn_status: TurnStatus;
}

export interface MessageInterrupt {
  object: MessageType.MSG_INTERRUPTED;
  message_id: string;
  data_type: 'message';
  turn_id: number;
  start_ms: number;
  send_ts: number;
}

export interface MessageMetrics {
  object: MessageType.MSG_METRICS;
  module: ModuleType;
  metric_name: string;
  turn_id: number;
  latency_ms: number;
  send_ts: number;
}

export interface MessageError {
  object: MessageType.MSG_ERROR;
  module: ModuleType;
  code: number;
  message: string;
  turn_id: number;
  send_ts: number;
  [x: string]: unknown;
}

export interface PresenceState
  extends Omit<RTMEvents.PresenceEvent, 'stateChanged'> {
  stateChanged: {
    state: AgentState;
    turn_id: string;
  };
}

export type QueueItem = {
  turn_id: number;
  text: string;
  words: TranscriptHelperObjectWord[];
  status: TurnStatus;
  stream_id: number;
  uid: string;
};

export interface TranscriptHelperItem<T> {
  uid: string;
  stream_id: number;
  turn_id: number;
  _time: number;
  text: string;
  status: TurnStatus;
  metadata: T | null;
}

// --- rtc ---
export interface UserTracks {
  videoTrack?: ICameraVideoTrack;
  audioTrack?: IMicrophoneAudioTrack;
}

// --- rtm ---
export enum ChatMessagePriority {
  INTERRUPTED = 'interrupted',
  APPEND = 'append',
  IGNORE = 'ignore',
}

export enum ChatMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  UNKNOWN = 'unknown',
}

export interface ChatMessageBase {
  messageType: ChatMessageType;
}

export interface ChatMessageText extends ChatMessageBase {
  messageType: ChatMessageType.TEXT;
  priority: ChatMessagePriority;
  responseInterruptable: boolean;
  text?: string;
}

export interface ChatMessageImage extends ChatMessageBase {
  messageType: ChatMessageType.IMAGE;
  uuid: string;
  url?: string;
  base64?: string;
}

// --- local ---
export enum LocalTranscriptStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
}

export interface LocalTranscriptionBase {
  id: string;
  uid: string;
  _time: number;
  status: LocalTranscriptStatus;
}

export interface LocalImageTranscription extends LocalTranscriptionBase {
  localImage: File;
  imageDimensions: {
    width: number;
    height: number;
  };
  image_url?: string;
}

export enum MessageSalStatus {
  VP_DISABLED = 'VP_DISABLED',
  VP_UNREGISTER = 'VP_UNREGISTER',
  VP_REGISTERING = 'VP_REGISTERING',
  VP_REGISTER_SUCCESS = 'VP_REGISTER_SUCCESS',
  VP_REGISTER_FAIL = 'VP_REGISTER_FAIL',
  VP_REGISTER_DUPLICATE = 'VP_REGISTER_DUPLICATE',
}

export interface MessageSalStatusData {
  object: MessageType.MESSAGE_SAL_STATUS;
  status: MessageSalStatus;
  timestamp: number;
  data_type: string;
  message_id: string;
  send_ts: number;
}
