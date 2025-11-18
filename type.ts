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
 * @description
 * Defines the different modes available for transcript processing and display.
 * Used to determine how transcription data should be handled and presented.
 *
 * @remarks
 * - All modes are string literals for easy serialization
 * - Modes determine the granularity of transcript processing
 * - TEXT should be used as a fallback for unrecognized modes
 *
 * Values include:
 * - TEXT: Plain text mode for simple transcript display
 * - WORD: Word-level processing with individual word tracking
 * - CHUNK: Chunk-based processing for grouped text segments
 * - UNKNOWN: Initial mode for unrecognized transcript types
 *
 * @since 1.6.0
 */
export enum TranscriptHelperMode {
  TEXT = 'text',
  WORD = 'word',
  CHUNK = 'chunk',
  UNKNOWN = 'unknown',
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
  // TOPIC = 'topic',
  // STORAGE = 'storage',
  // LOCK = 'lock',
  STATUS = 'status',
  // LINK_STATE = 'linkState',
  // TOKEN_PRIVILEGE_WILL_EXPIRE = 'tokenPrivilegeWillExpire',
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
 * Event types for the Agora Voice AI
 *
 * @description
 * Defines the event types that can be emitted by the Agora Voice AI.
 * Contains events for agent state changes, interruptions, metrics, errors, transcription updates, debug logs, and message receipt updates.
 *
 * @remarks
 * - All events are string literals and can be used with event listeners
 * - Events are case-sensitive
 *
 * Values include:
 * - AGENT_STATE_CHANGED: Agent state change events
 * - AGENT_INTERRUPTED: Agent interruption events
 * - AGENT_METRICS: Agent performance metrics
 * - AGENT_ERROR: Agent error events
 * - TRANSCRIPT_UPDATED: Transcription update events
 * - DEBUG_LOG: Debug logging events
 * - MESSAGE_RECEIPT_UPDATED: Message receipt update events
 * - MESSAGE_ERROR: Message error events
 *
 * @since 1.6.0
 */
export enum AgoraVoiceAIEvents {
  AGENT_STATE_CHANGED = 'agent-state-changed',
  AGENT_INTERRUPTED = 'agent-interrupted',
  AGENT_METRICS = 'agent-metrics',
  AGENT_ERROR = 'agent-error',
  TRANSCRIPT_UPDATED = 'transcript-updated',
  DEBUG_LOG = 'debug-log',
  MESSAGE_RECEIPT_UPDATED = 'message-receipt-updated',
  MESSAGE_ERROR = 'message-error',
  MESSAGE_SAL_STATUS = 'message-sal-status',
}

/**
 * Module type enumeration for AI capabilities
 *
 * Defines the different types of AI modules available in the system, including language models and text-to-speech
 *
 * @remarks
 * - Each enum value represents a distinct AI capability module
 * - Use these values to specify module type in API calls
 *
 * Values include:
 * - LLM: Language Learning Model
 * - MLLM: Multimodal Language Learning Model
 * - TTS: Text-to-Speech
 * - CONTEXT: Context management module
 * - UNKNOWN: Unknown module type
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

/**
 * Agent metrics statistics data type definition
 *
 * @description
 * Used to store metric data during AI agent runtime, including type, name, value and timestamp
 *
 * @param type - Metric module type {@link ModuleType}
 * @param name - Metric name
 * @param value - Metric value
 * @param timestamp - Data collection timestamp (milliseconds)
 *
 * @since 1.6.0
 */
export type AgentMetric = {
  type: ModuleType;
  name: string;
  value: number;
  timestamp: number;
};

/**
 * Message receipt type definition
 *
 * @description
 * Represents a message receipt from the AI module, including type, message content and turn ID
 *
 * @param moduleType - The module type that sent the message {@link ModuleType}
 * @param messageType - The type of the message {@link ChatMessageType}
 * @param message - The content of the message
 * @param turnId - Unique identifier for the conversation turn
 *
 * @since 1.7.0
 */
export type MessageReceipt = {
  moduleType: ModuleType;
  messageType: ChatMessageType;
  message: string;
  turnId: number;
};

/**
 * Module error type definition
 *
 * @description
 * Represents error information from different AI modules including error type, code,
 * message and timestamp. Used for error handling and debugging.
 *
 * @remarks
 * - Error codes are module-specific and should be documented by each module
 * - Timestamp is in Unix milliseconds format
 * - Error messages should be human readable and provide actionable information
 *
 * @param type - The module type where error occurred {@link ModuleType}
 * @param code - Error code specific to the module
 * @param message - Human readable error description
 * @param timestamp - Unix timestamp in milliseconds when error occurred
 *
 * @since 1.6.0
 */
export type ModuleError = {
  type: ModuleType;
  code: number;
  message: string;
  timestamp: number;
};

/**
 * Type definition for state change event
 *
 * Used to describe the information related to voice agent state changes, including current state, turn ID, timestamp and reason
 *
 * @param state Current state of the voice agent. See {@link AgentState}
 * @param turnID Unique identifier for the current conversation turn
 * @param timestamp Timestamp when the state change occurred (in milliseconds)
 * @param reason Reason description for the state change
 *
 * @since 1.6.0
 *
 * @remarks
 * - State change events are triggered when the voice agent's state changes
 * - timestamp uses UNIX timestamp (in milliseconds)
 */
export type StateChangeEvent = {
  state: AgentState;
  turnID: number;
  timestamp: number;
  reason: string;
};

/**
 * Event handlers interface for the Agora Voice AI module.
 *
 * @since 1.6.0
 *
 * Defines a set of event handlers that can be implemented to respond to various
 * events emitted by the Agora Voice AI system, including agent state changes,
 * interruptions, metrics, errors, and transcription updates.
 *
 * @remarks
 * - All handlers are required to be implemented when using this interface
 * - Events are emitted asynchronously and should be handled accordingly
 * - Event handlers should be lightweight to avoid blocking the event loop
 * - Error handling should be implemented within each handler to prevent crashes
 *
 * @example
 * ```typescript
 * const handlers: AgoraVoiceAIEventHandlers = {
 *   [AgoraVoiceAIEvents.AGENT_STATE_CHANGED]: (agentUserId, event) => {
 *     console.log(`Agent ${agentUserId} state changed:`, event);
 *   },
 *   // ... implement other handlers
 * };
 * ```
 *
 * @param agentUserId - The unique identifier of the AI agent
 * @param event - Event data specific to each event type
 * @param metrics - Performance metrics data for the agent
 * @param error - Error information when agent encounters issues
 * @param transcription - Array of transcription items containing user and agent dialogue
 * @param message - Debug log message string
 * @param messageReceipt - Updated message receipt information
 * @param messageError - Error information related to a specific message
 *
 * @see {@link AgoraVoiceAIEvents} for all available event types
 * @see {@link StateChangeEvent} for state change event structure
 * @see {@link AgentMetric} for agent metrics structure
 * @see {@link ModuleError} for error structure
 * @see {@link TranscriptHelperItem} for transcription item structure
 * @see {@link MessageReceipt} for message receipt structure
 * @see {@link ChatMessageType} for message type enumeration
 */
export interface AgoraVoiceAIEventHandlers {
  [AgoraVoiceAIEvents.AGENT_STATE_CHANGED]: (
    agentUserId: string,
    event: StateChangeEvent
  ) => void;
  [AgoraVoiceAIEvents.AGENT_INTERRUPTED]: (
    agentUserId: string,
    event: {
      turnID: number;
      timestamp: number;
    }
  ) => void;
  [AgoraVoiceAIEvents.AGENT_METRICS]: (
    agentUserId: string,
    metrics: AgentMetric
  ) => void;
  [AgoraVoiceAIEvents.AGENT_ERROR]: (
    agentUserId: string,
    error: ModuleError
  ) => void;
  [AgoraVoiceAIEvents.TRANSCRIPT_UPDATED]: (
    transcription: TranscriptHelperItem<
      Partial<UserTranscription | AgentTranscription>
    >[]
  ) => void;
  [AgoraVoiceAIEvents.DEBUG_LOG]: (message: string) => void;
  [AgoraVoiceAIEvents.MESSAGE_RECEIPT_UPDATED]: (
    agentUserId: string,
    messageReceipt: MessageReceipt
  ) => void;
  [AgoraVoiceAIEvents.MESSAGE_ERROR]: (
    agentUserId: string,
    error: {
      type: ChatMessageType;
      code: number;
      message: string;
      timestamp: number;
    }
  ) => void;
  [AgoraVoiceAIEvents.MESSAGE_SAL_STATUS]: (
    agentUserId: string,
    salStatus: MessageSalStatusData
  ) => void;
}

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

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

// --- Message ---
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
 * Represents the different states of a conversational AI agent, including idle, listening, thinking, speaking and silent states
 *
 * Detailed Description:
 * This enum is used to track and manage the current state of an AI agent in a conversational system.
 * The states help coordinate the interaction flow between the user and the AI agent.
 *
 * States include:
 * - IDLE: Agent is ready for new interaction
 * - LISTENING: Agent is receiving user input
 * - THINKING: Agent is processing received input
 * - SPEAKING: Agent is delivering response
 * - SILENT: Agent is intentionally not responding
 *
 * @remarks
 * - State transitions should be handled properly to avoid deadlocks
 * - The SILENT state is different from IDLE as it represents an intentional non-response
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
  object: MessageType.USER_TRANSCRIPTION; // "user.transcription"
  final: boolean;
}

export interface AgentTranscription extends TranscriptionBase {
  object: MessageType.AGENT_TRANSCRIPTION; // "assistant.transcription"
  quiet: boolean;
  turn_seq_id: number;
  turn_status: TurnStatus;
}

export interface MessageInterrupt {
  object: MessageType.MSG_INTERRUPTED; // "message.interrupt"
  message_id: string;
  data_type: 'message';
  turn_id: number;
  start_ms: number;
  send_ts: number;
}

export interface MessageMetrics {
  object: MessageType.MSG_METRICS; // "message.metrics"
  module: ModuleType;
  metric_name: string;
  turn_id: number;
  latency_ms: number;
  send_ts: number;
}

export interface MessageError {
  object: MessageType.MSG_ERROR; // "message.error"
  module: ModuleType;
  code: number;
  message: string;
  turn_id: number;
  send_ts: number;
  [x: string]: unknown; // Allow additional properties
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

/**
 * Interface for transcript helper item
 *
 * Defines the data structure for a single transcript item in the transcript system. Contains basic transcript information such as user ID, stream ID, turn ID, timestamp, text content, status, and metadata.
 *
 * @remarks
 * - This interface supports generics, allowing different types of metadata as needed
 * - Status value must be a valid value defined in {@link TurnStatus}
 *
 * @param T - Type of metadata
 * @param uid - Unique identifier for the user
 * @param stream_id - Stream identifier
 * @param turn_id - Turn identifier in the conversation
 * @param _time - Timestamp of the transcript (in milliseconds)
 * @param text - Transcript text content
 * @param status - Current status of the transcript item
 * @param metadata - Additional metadata information
 *
 * @since 1.6.0
 */
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

/**
 * Enumeration defining chat message priority levels for handling message processing.
 *
 * Specifies how incoming chat messages should be handled when they arrive during
 * ongoing conversation processing, providing control over message queue behavior
 * and user experience during real-time interactions.
 *
 * @remarks
 * Values include:
 * - INTERRUPTED: Interrupt current processing and handle immediately
 * - APPEND: Add to processing queue for sequential handling
 * - IGNORE: Discard the message without processing
 *
 * @enum {string}
 *
 * @since 1.7.0
 */
export enum ChatMessagePriority {
  INTERRUPTED = 'interrupted',
  APPEND = 'append',
  IGNORE = 'ignore',
}

/**
 * Enumeration defining the different types of chat messages supported in the conversational AI system.
 *
 * @remarks
 * Values include:
 * - TEXT: Text-based message
 * - IMAGE: Image-based message
 * - UNKNOWN: Unknown message type
 *
 * @enum {string}
 *
 * @since 1.7.0
 */
export enum ChatMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  UNKNOWN = 'unknown',
}

/**
 * Base interface for chat messages containing the fundamental message type property.
 * This interface serves as the foundation for all chat message types in the system.
 *
 * @since 1.7.0
 */
export interface ChatMessageBase {
  messageType: ChatMessageType;
}

/**
 * Represents a text-based chat message with priority and interruption settings.
 *
 * @interface ChatMessageText
 * @extends ChatMessageBase
 *
 * @property messageType - The type of message, must be TEXT
 * @property priority - The priority level of the chat message
 * @property responseInterruptable - Whether the response can be interrupted
 * @property text - The optional text content of the message
 *
 * @since 1.7.0
 */
export interface ChatMessageText extends ChatMessageBase {
  messageType: ChatMessageType.TEXT;
  priority: ChatMessagePriority;
  responseInterruptable: boolean;
  text?: string;
}

/**
 * Represents an image-based chat message that can contain either a URL or base64 encoded image data.
 *
 * @interface ChatMessageImage
 * @extends ChatMessageBase
 *
 * @property messageType - The type of message, must be IMAGE
 * @property uuid - Unique identifier for the image message
 * @property url - Optional URL pointing to the image resource
 * @property base64 - Optional base64 encoded image data
 */
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
  object: MessageType.MESSAGE_SAL_STATUS; // "message.sal_status"
  status: MessageSalStatus;
  timestamp: number;
  data_type: string;
  message_id: string;
  send_ts: number;
}
