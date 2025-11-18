import { logger as agoraLogger } from '@agora-js/report';
import type { IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import type { ChannelType, RTMClient, RTMEvents } from 'agora-rtm';

import {
  type AgentState,
  ChatMessagePriority,
  ChatMessageType,
  AgoraVoiceAIEvents,
  MessageType,
  RTCEventType,
  RTMEventType,
  TranscriptHelperMode,
  ModuleType,
  TurnStatus,
  LocalTranscriptStatus,
  MessageSalStatus,
  type AgentTranscription,
  type ChatMessageImage,
  type ChatMessageText,
  type AgoraVoiceAIEventHandlers,
  type MessageSalStatusData,
  type TranscriptHelperItem,
  type UserTranscription,
  type AgentMetric,
  type MessageReceipt,
  type ModuleError,
  type StateChangeEvent,
  type HelperRTCEvents,
  type HelperRTMEvents,
  type DataChunkMessageWord,
  type TranscriptHelperObjectWord,
  type TranscriptionBase,
  type MessageInterrupt,
  type MessageMetrics,
  type MessageError,
  type PresenceState,
  type QueueItem,
  type UserTracks,
  type ChatMessageBase,
  type LocalTranscriptionBase,
  type LocalImageTranscription,
  NotFoundError,
} from './type';
import { factoryFormatLog } from './utils/index';
import { EventHelper } from './utils/event';
import { CovSubRenderController } from './utils/sub-render';
import { ELoggerType, logger } from './lib/logger';
import { genTranceID } from './lib/utils';

const TAG = 'AgoraVoiceAI';
// const CONSOLE_LOG_PREFIX = `[${TAG}]`
const VERSION = '1.8.0';

const formatLog = factoryFormatLog({ tag: TAG });

export interface AgoraVoiceAIConfig {
  rtcEngine: IAgoraRTCClient;
  rtmEngine: RTMClient;
  renderMode?: TranscriptHelperMode;
  enableLog?: boolean;
}

/**
 * A class that manages conversational AI interactions through Agora's RTC and RTM services.
 *
 * Provides functionality to handle real-time communication between users and AI agents,
 * including message processing, state management, and event handling. It integrates with
 * Agora's RTC client for audio streaming and RTM client for messaging.
 *
 * Key features
 * - Singleton instance management
 * - RTC and RTM event handling
 * - Chat history and transcription management
 * - Agent state monitoring
 * - Debug logging
 * - Event subscription and management through EventHelper
 *
 * @remarks
 * - Must be initialized with {@link AgoraVoiceAIConfig} before use
 * - Only one instance can exist at a time
 * - Requires both RTC and RTM engines to be properly configured
 * - Events are emitted for state changes, transcriptions, and errors
 * - Extends EventHelper to provide event subscription capabilities
 *
 * @example
 * Basic initialization and usage:
 * ```typescript
 * const api = AgoraVoiceAI.init({
 *   rtcEngine: rtcClient,
 *   rtmEngine: rtmClient,
 *   renderMode: TranscriptHelperMode.REALTIME
 * });
 *
 * // Subscribe to a channel
 * api.subscribeMessage('channel-id');
 * ```
 *
 * @example
 * Event handling with EventHelper methods:
 * ```typescript
 * const agoraVoiceAI = AgoraVoiceAI.getInstance();
 *
 * // Subscribe to all events using on() method
 * agoraVoiceAI.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, (agentUserId, event) => {
 *   console.log(`Agent ${agentUserId} state changed to:`, event.state);
 * });
 *
 * agoraVoiceAI.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (transcription) => {
 *   console.log('Transcription updated:', transcription);
 * });
 *
 * agoraVoiceAI.on(AgoraVoiceAIEvents.AGENT_INTERRUPTED, (agentUserId, event) => {
 *   console.log(`Agent ${agentUserId} interrupted:`, event);
 * });
 *
 * agoraVoiceAI.on(AgoraVoiceAIEvents.AGENT_METRICS, (agentUserId, metrics) => {
 *   console.log(`Agent ${agentUserId} metrics:`, metrics);
 * });
 *
 * agoraVoiceAI.on(AgoraVoiceAIEvents.AGENT_ERROR, (agentUserId, error) => {
 *   console.error(`Agent ${agentUserId} error:`, error.message);
 * });
 *
 * agoraVoiceAI.on(AgoraVoiceAIEvents.DEBUG_LOG, (message) => {
 *   console.debug('Debug log:', message);
 * });
 *
 * agoraVoiceAI.on(AgoraVoiceAIEvents.MESSAGE_RECEIPT_UPDATED, (agentUserId, messageReceipt) => {
 *  console.log(`Message receipt updated for agent ${agentUserId}:`, messageReceipt);
 * });
 *
 * agoraVoiceAI.on(AgoraVoiceAIEvents.MESSAGE_ERROR, (agentUserId, error) => {
 *  console.error(`Message error for agent ${agentUserId}:`, error);
 * });
 *
 * // Unsubscribe from events using off() method
 * agoraVoiceAI.off(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, handleAgentStateChanged);
 * agoraVoiceAI.off(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, handleTranscriptionUpdated);
 * agoraVoiceAI.off(AgoraVoiceAIEvents.AGENT_INTERRUPTED, handleAgentInterrupted);
 * agoraVoiceAI.off(AgoraVoiceAIEvents.AGENT_METRICS, handleAgentMetrics);
 * agoraVoiceAI.off(AgoraVoiceAIEvents.AGENT_ERROR, handleAgentError);
 * agoraVoiceAI.off(AgoraVoiceAIEvents.DEBUG_LOG, handleDebugLog);
 * agoraVoiceAI.off(AgoraVoiceAIEvents.MESSAGE_RECEIPT_UPDATED, handleMessageReceiptUpdated);
 * agoraVoiceAI.off(AgoraVoiceAIEvents.MESSAGE_ERROR, handleMessageError);
 * ```
 *
 * @fires {@link AgoraVoiceAIEvents.TRANSCRIPT_UPDATED} When chat history is updated
 * @fires {@link AgoraVoiceAIEvents.AGENT_STATE_CHANGED} When agent state changes
 * @fires {@link AgoraVoiceAIEvents.AGENT_INTERRUPTED} When agent is interrupted
 * @fires {@link AgoraVoiceAIEvents.AGENT_METRICS} When agent metrics are received
 * @fires {@link AgoraVoiceAIEvents.AGENT_ERROR} When an error occurs
 * @fires {@link AgoraVoiceAIEvents.DEBUG_LOG} When debug logs are generated
 * @fires {@link AgoraVoiceAIEvents.MESSAGE_RECEIPT_UPDATED} When message receipt is updated
 * @fires {@link AgoraVoiceAIEvents.MESSAGE_ERROR} When message error occurs
 *
 * @since 1.7.0
 */
export class AgoraVoiceAI extends EventHelper<AgoraVoiceAIEventHandlers> {
  private static NAME = TAG;
  private static VERSION = VERSION;
  private static _instance: AgoraVoiceAI | null = null;
  private callMessagePrint: (type: ELoggerType, ...args: unknown[]) => void;

  protected rtcEngine: IAgoraRTCClient | null = null;
  protected rtmEngine: RTMClient | null = null;
  protected renderMode: TranscriptHelperMode = TranscriptHelperMode.UNKNOWN;
  protected channel: string | null = null;
  protected covSubRenderController: CovSubRenderController;
  protected enableLog: boolean = false;

  constructor() {
    super();

    this.callMessagePrint = (
      type: ELoggerType = ELoggerType.debug,
      ...args: unknown[]
    ) => {
      if (!this.enableLog) {
        return;
      }
      logger[type](formatLog(...args));
      this.onDebugLog?.(`[${type}] ${formatLog(...args)}`);
      agoraLogger[type](...args);
    };
    this.callMessagePrint(
      ELoggerType.debug,
      `${AgoraVoiceAI.NAME} initialized, version: ${AgoraVoiceAI.VERSION}`
    );

    this.covSubRenderController = new CovSubRenderController({
      onChatHistoryUpdated: this.onChatHistoryUpdated.bind(this),
      onAgentStateChanged: this.onAgentStateChanged.bind(this),
      onAgentInterrupted: this.onAgentInterrupted.bind(this),
      onDebugLog: this.onDebugLog.bind(this),
      onAgentMetrics: this.onAgentMetrics.bind(this),
      onAgentError: this.onAgentError.bind(this),
      onMessageReceipt: this.onMessageReceiptUpdated.bind(this),
      onMessageError: this.onMessageError.bind(this),
      onMessageSalStatus: this.onMessageSalStatus.bind(this),
    });
  }

  /**
   * Gets the singleton instance of AgoraVoiceAI.
   *
   * Retrieves the singleton instance of the AgoraVoiceAI class. This method
   * ensures that only one instance of AgoraVoiceAI exists throughout the
   * application lifecycle.
   *
   * @remarks
   * - Must call {@link init} before using this method
   * - Throws error if instance is not initialized
   *
   * @returns The singleton instance of AgoraVoiceAI
   * @throws {@link NotFoundError} When AgoraVoiceAI is not initialized
   * @since 1.6.0
   */
  public static getInstance() {
    if (!AgoraVoiceAI._instance) {
      throw new NotFoundError('AgoraVoiceAI is not initialized');
    }
    return AgoraVoiceAI._instance;
  }

  public getCfg() {
    if (!this.rtcEngine || !this.rtmEngine) {
      throw new NotFoundError('AgoraVoiceAI is not initialized');
    }
    return {
      rtcEngine: this.rtcEngine,
      rtmEngine: this.rtmEngine,
      renderMode: this.renderMode,
      channel: this.channel,
      enableLog: this.enableLog,
    };
  }

  /**
   * Initializes the AgoraVoiceAI singleton instance.
   *
   * This method sets up the RTC and RTM engines, render mode, and logging options.
   * It must be called before any other methods of AgoraVoiceAI can be used.
   *
   * @remarks
   * - Only one instance can be initialized at a time
   * - Throws error if already initialized
   *
   * @param cfg - Configuration object for initializing the API
   * @returns The initialized instance of AgoraVoiceAI
   * @throws {@link Error} If AgoraVoiceAI is already initialized
   * @since 1.6.0
   */
  public static init(cfg: AgoraVoiceAIConfig) {
    if (!AgoraVoiceAI._instance) {
      AgoraVoiceAI._instance = new AgoraVoiceAI();
    }
    AgoraVoiceAI._instance.rtcEngine = cfg.rtcEngine;
    AgoraVoiceAI._instance.rtmEngine = cfg.rtmEngine;
    AgoraVoiceAI._instance.renderMode =
      cfg.renderMode ?? TranscriptHelperMode.UNKNOWN;
    AgoraVoiceAI._instance.enableLog = cfg.enableLog ?? false;

    return AgoraVoiceAI._instance;
  }

  /**
   * Subscribes to a message channel for real-time updates.
   *
   * This method binds the necessary RTC and RTM events, sets the channel,
   * and starts the CovSubRenderController to handle incoming messages.
   *
   * @remarks
   * - Must call {@link init} before using this method
   * - Throws error if not initialized
   *
   * @param channel - The channel to subscribe to for messages
   * @since 1.6.0
   */
  public subscribeMessage(channel: string) {
    this.bindRtcEvents();
    this.bindRtmEvents();

    this.channel = channel;
    this.covSubRenderController.setMode(this.renderMode);
    this.covSubRenderController.run();
  }

  /**
   * Unsubscribes from the message channel and cleans up resources.
   *
   * This method unbinds the RTC and RTM events, clears the channel,
   * and cleans up the CovSubRenderController.
   *
   * @remarks
   * - Must call {@link subscribeMessage} before using this method
   * - Throws error if not initialized
   *
   * @since 1.6.0
   */
  public unsubscribe() {
    this.unbindRtcEvents();
    this.unbindRtmEvents();

    this.channel = null;
    this.covSubRenderController.cleanup();
  }

  /**
   * Destroys the AgoraVoiceAI instance and cleans up resources.
   *
   * This method unbinds all RTC and RTM events, clears the channel,
   * and cleans up the CovSubRenderController.
   *
   * @remarks
   * - Must call {@link unsubscribe} before using this method
   * - Throws error if not initialized
   *
   * @since 1.6.0
   */
  public destroy() {
    const instance = AgoraVoiceAI.getInstance();
    if (instance) {
      instance?.rtcEngine?.removeAllListeners();
      instance.rtcEngine = null;
      instance?.rtmEngine?.removeAllListeners();
      instance.rtmEngine = null;
      instance.renderMode = TranscriptHelperMode.UNKNOWN;
      instance.channel = null;
      instance.removeAllEventListeners();
      AgoraVoiceAI._instance = null;
    }
    this.callMessagePrint(ELoggerType.debug, `${AgoraVoiceAI.NAME} destroyed`);
  }

  /**
   * Sends a chat message to the conversational AI agent.
   *
   * @param agentUserId - The unique identifier of the agent user
   * @param message - The chat message to send, can be either text or image type
   * @returns A promise that resolves with the result of sending the message
   * @throws {Error} When an unsupported chat message type is provided
   *
   * @since 1.7.0
   *
   * @example
   * ```typescript
   * // Send a text message
   * const textMessage: IChatMessageText = {
   *   messageType: ChatMessageType.TEXT,
   *   priority: ChatMessagePriority.HIGH,
   *   responseInterruptable: true,
   *   text: "Hello, how are you?"
   * };
   * await api.chat("user123", textMessage);
   *
   * // Send an image message
   * const imageMessage: IChatMessageImage = {
   *   messageType: ChatMessageType.IMAGE,
   *   uuid: "msg-456",
   *   url: "https://example.com/image.jpg"
   * };
   * await api.chat("user123", imageMessage);
   * ```
   */
  public async chat(
    agentUserId: string,
    message: ChatMessageText | ChatMessageImage
  ) {
    switch (message.messageType) {
      case ChatMessageType.TEXT:
        return this.sendText(agentUserId, message as ChatMessageText);
      case ChatMessageType.IMAGE:
        return this.sendImage(agentUserId, message as ChatMessageImage);
      default:
        throw new Error('Unsupported chat message type');
    }
  }

  /**
   * Sends a text message to the specified agent user through RTM engine.
   *
   * @param agentUserId - The unique identifier of the agent user to send the message to
   * @param message - The chat message object containing text content and optional settings
   * @param message.priority - Optional priority level for the message (defaults to INTERRUPTED)
   * @param message.responseInterruptable - Optional flag indicating if the response can be interrupted (defaults to true)
   * @param message.text - The actual text content of the message
   *
   * @returns Promise that resolves when the message is successfully sent
   *
   * @throws {Error} Throws an error with message "failed to send chat message" if the RTM publish operation fails
   *
   * @since 1.7.0
   *
   * @example
   * ```typescript
   * await api.sendText('user123', {
   *   text: 'Hello, how can I help you?',
   *   priority: ChatMessagePriority.HIGH,
   *   responseInterruptable: false
   * });
   * ```
   */
  public async sendText(agentUserId: string, message: ChatMessageText) {
    const traceId = genTranceID();
    this.callMessagePrint(
      ELoggerType.debug,
      `>>> [trancID:${traceId}] [chat] ${agentUserId}`,
      message
    );

    const { rtmEngine } = this.getCfg();

    const payload = {
      priority: message.priority ?? ChatMessagePriority.INTERRUPTED,
      interruptable: message.responseInterruptable ?? true,
      message: message.text ?? '',
    };

    try {
      const payloadStr = JSON.stringify(payload);
      const options = {
        channelType: 'USER' as ChannelType,
        customType: MessageType.USER_TRANSCRIPTION,
      };

      this.callMessagePrint(
        ELoggerType.debug,
        `msg: [traceID: ${traceId}] rtm publish`,
        payloadStr
      );

      const result = await rtmEngine.publish(agentUserId, payloadStr, options);

      this.callMessagePrint(
        ELoggerType.debug,
        `>>> [trancID:${traceId}] [chat]`,
        'sucessfully sent chat message',
        result
      );
    } catch (error: unknown) {
      this.callMessagePrint(
        ELoggerType.error,
        `>>> [trancID:${traceId}] [chat]`,
        'failed to send chat message',
        error
      );
      throw new Error('failed to send chat message');
    }
  }

  /**
   * Sends an image message to a specific agent user through RTM (Real-Time Messaging).
   *
   * @param agentUserId - The unique identifier of the agent user to send the image to
   * @param message - The image message object containing UUID and either URL or base64 data
   * @param message.uuid - Unique identifier for the message
   * @param message.url - Optional URL of the image to send
   * @param message.base64 - Optional base64 encoded image data
   *
   * @throws {Error} Throws an error with message "failed to send chat message" if the RTM publish operation fails
   *
   * @returns Promise that resolves when the image message is successfully sent
   *
   * @since 1.7.0
   *
   * @example
   * ```typescript
   * await sendImage('user123', {
   *   uuid: 'msg-456',
   *   url: 'https://example.com/image.jpg'
   * });
   * ```
   */
  public async sendImage(agentUserId: string, message: ChatMessageImage) {
    const traceId = genTranceID();
    this.callMessagePrint(
      ELoggerType.debug,
      `>>> [trancID:${traceId}] [chat] ${agentUserId}`,
      message
    );

    const { rtmEngine } = this.getCfg();

    const payload = {
      uuid: message.uuid,
      image_url: message?.url || '',
      image_base64: message?.base64 || '',
    };

    try {
      const payloadStr = JSON.stringify(payload);
      const options = {
        channelType: 'USER' as ChannelType,
        customType: MessageType.IMAGE_UPLOAD,
      };

      this.callMessagePrint(
        ELoggerType.debug,
        `msg: [traceID: ${traceId}] rtm publish`,
        payloadStr
      );

      const result = await rtmEngine.publish(agentUserId, payloadStr, options);

      this.callMessagePrint(
        ELoggerType.debug,
        `>>> [trancID:${traceId}] [chat]`,
        'sucessfully sent chat message',
        result
      );
    } catch (error: unknown) {
      this.callMessagePrint(
        ELoggerType.error,
        `>>> [trancID:${traceId}] [chat]`,
        'failed to send chat message',
        error
      );
      throw new Error('failed to send chat message');
    }
  }

  /**
   * Sends an interrupt message to the specified agent user.
   *
   * This method publishes an interrupt message to the RTM channel of the specified agent user.
   * It is used to signal that the current interaction should be interrupted.
   *
   * @remarks
   * - Must call {@link init} before using this method
   * - Throws error if not initialized or if sending fails
   *
   * @param agentUserId - The user ID of the agent to interrupt
   * @since 1.6.0
   */
  public async interrupt(agentUserId: string) {
    const traceId = genTranceID();
    this.callMessagePrint(
      ELoggerType.debug,
      `>>> [trancID:${traceId}] [interrupt]`,
      agentUserId
    );

    const { rtmEngine } = this.getCfg();

    const options = {
      channelType: 'USER' as ChannelType,
      customType: MessageType.MSG_INTERRUPTED,
    };
    const messageStr = JSON.stringify({
      customType: MessageType.MSG_INTERRUPTED,
    });

    try {
      const result = await rtmEngine.publish(agentUserId, messageStr, options);
      this.callMessagePrint(
        ELoggerType.debug,
        `>>> [trancID:${traceId}] [interrupt]`,
        'sucessfully sent interrupt message',
        result
      );
    } catch (error: unknown) {
      this.callMessagePrint(
        ELoggerType.error,
        `>>> [trancID:${traceId}] [interrupt]`,
        'failed to send interrupt message',
        error
      );
      throw new Error('failed to send interrupt message');
    }
  }

  private onChatHistoryUpdated(
    chatHistory: TranscriptHelperItem<
      Partial<UserTranscription | AgentTranscription>
    >[]
  ) {
    this.callMessagePrint(
      ELoggerType.debug,
      `>>> ${AgoraVoiceAIEvents.TRANSCRIPT_UPDATED}`,
      chatHistory
    );
    this.emit(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, chatHistory);
  }
  private onAgentStateChanged(agentUserId: string, event: StateChangeEvent) {
    this.callMessagePrint(
      ELoggerType.debug,
      `>>> ${AgoraVoiceAIEvents.AGENT_STATE_CHANGED}`,
      agentUserId,
      event
    );
    this.emit(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, agentUserId, event);
  }
  private onAgentInterrupted(
    agentUserId: string,
    event: { turnID: number; timestamp: number }
  ) {
    this.callMessagePrint(
      ELoggerType.debug,
      `>>> ${AgoraVoiceAIEvents.AGENT_INTERRUPTED}`,
      agentUserId,
      event
    );
    this.emit(AgoraVoiceAIEvents.AGENT_INTERRUPTED, agentUserId, event);
  }
  private onDebugLog(message: string) {
    this.emit(AgoraVoiceAIEvents.DEBUG_LOG, message);
  }
  private onAgentMetrics(agentUserId: string, metrics: AgentMetric) {
    this.callMessagePrint(
      ELoggerType.debug,
      `>>> ${AgoraVoiceAIEvents.AGENT_METRICS}`,
      agentUserId,
      metrics
    );
    this.emit(AgoraVoiceAIEvents.AGENT_METRICS, agentUserId, metrics);
  }
  private onAgentError(agentUserId: string, error: ModuleError) {
    this.callMessagePrint(
      ELoggerType.error,
      `>>> ${AgoraVoiceAIEvents.AGENT_ERROR}`,
      agentUserId,
      error
    );
    this.emit(AgoraVoiceAIEvents.AGENT_ERROR, agentUserId, error);
  }
  private onMessageReceiptUpdated(
    agentUserId: string,
    messageReceipt: MessageReceipt
  ) {
    this.callMessagePrint(
      ELoggerType.error,
      `>>> ${AgoraVoiceAIEvents.MESSAGE_RECEIPT_UPDATED}`,
      agentUserId,
      messageReceipt
    );
    this.emit(
      AgoraVoiceAIEvents.MESSAGE_RECEIPT_UPDATED,
      agentUserId,
      messageReceipt
    );
  }
  private onMessageError(
    agentUserId: string,
    error: {
      type: ChatMessageType;
      code: number;
      message: string;
      timestamp: number;
    }
  ) {
    this.callMessagePrint(
      ELoggerType.error,
      `>>> ${AgoraVoiceAIEvents.MESSAGE_ERROR}`,
      agentUserId,
      error
    );
    this.emit(AgoraVoiceAIEvents.MESSAGE_ERROR, agentUserId, error);
  }

  private onMessageSalStatus(
    agentUserId: string,
    message: MessageSalStatusData
  ) {
    this.callMessagePrint(
      ELoggerType.debug,
      `>>> ${AgoraVoiceAIEvents.MESSAGE_SAL_STATUS}`,
      agentUserId,
      message
    );
    this.emit(AgoraVoiceAIEvents.MESSAGE_SAL_STATUS, agentUserId, message);
  }

  private bindRtcEvents() {
    // this.getCfg().rtcEngine.on(
    //   RTCEventType.AUDIO_METADATA,
    //   this._handleRtcAudioMetadata.bind(this)
    // )
    this.getCfg().rtcEngine.on(
      RTCEventType.AUDIO_PTS,
      this._handleRtcAudioPTS.bind(this)
    );
  }
  private unbindRtcEvents() {
    // this.getCfg().rtcEngine.off(
    //   RTCEventType.AUDIO_METADATA,
    //   this._handleRtcAudioMetadata.bind(this)
    // )
    this.getCfg().rtcEngine.off(
      RTCEventType.AUDIO_PTS,
      this._handleRtcAudioPTS.bind(this)
    );
  }
  private bindRtmEvents() {
    // - message
    this.getCfg().rtmEngine.addEventListener(
      RTMEventType.MESSAGE,
      this._handleRtmMessage.bind(this)
    );
    // - presence
    this.getCfg().rtmEngine.addEventListener(
      RTMEventType.PRESENCE,
      this._handleRtmPresence.bind(this)
    );
    // - status
    this.getCfg().rtmEngine.addEventListener(
      RTMEventType.STATUS,
      this._handleRtmStatus.bind(this)
    );
  }
  private unbindRtmEvents() {
    // - message
    this.getCfg().rtmEngine.removeEventListener(
      RTMEventType.MESSAGE,
      this._handleRtmMessage.bind(this)
    );
    // - presence
    this.getCfg().rtmEngine.removeEventListener(
      RTMEventType.PRESENCE,
      this._handleRtmPresence.bind(this)
    );
    // - status
    this.getCfg().rtmEngine.removeEventListener(
      RTMEventType.STATUS,
      this._handleRtmStatus.bind(this)
    );
  }

  // private _handleRtcAudioMetadata(metadata: Uint8Array) {
  //   try {
  //     const pts64 = Number(new DataView(metadata.buffer).getBigUint64(0, true))
  //     this.callMessagePrint(
  //       ELoggerType.debug,
  //       `<<< ${RTCEventType.AUDIO_METADATA}`,
  //       pts64
  //     )
  //     this.covSubRenderController.setPts(pts64)
  //   } catch (error) {
  //     this.callMessagePrint(
  //       ELoggerType.error,
  //       `<<< ${RTCEventType.AUDIO_METADATA}`,
  //       metadata,
  //       error
  //     )
  //   }
  // }

  private _handleRtcAudioPTS(pts: number) {
    try {
      this.callMessagePrint(
        ELoggerType.debug,
        `<<< ${RTCEventType.AUDIO_PTS}`,
        pts
      );
      this.covSubRenderController.setPts(pts);
    } catch (error) {
      this.callMessagePrint(
        ELoggerType.error,
        `<<< ${RTCEventType.AUDIO_PTS}`,
        pts,
        error
      );
    }
  }

  private _handleRtmMessage(message: RTMEvents.MessageEvent) {
    const traceId = genTranceID();
    this.callMessagePrint(
      ELoggerType.debug,
      `>>> [trancID:${traceId}] ${RTMEventType.MESSAGE}`,
      `Publisher: ${message.publisher}, type: ${message.messageType}`
    );
    // Handle the message
    try {
      const messageData = message.message;
      // if string, parse it
      if (typeof messageData === 'string') {
        const parsedMessage = JSON.parse(messageData);
        this.callMessagePrint(
          ELoggerType.debug,
          `>>> [trancID:${traceId}] ${RTMEventType.MESSAGE}`,
          parsedMessage
        );
        this.covSubRenderController.handleMessage(parsedMessage, {
          publisher: message.publisher,
        });
        return;
      }
      // if Uint8Array, convert to string
      if (messageData instanceof Uint8Array) {
        const decoder = new TextDecoder('utf-8');
        const messageString = decoder.decode(messageData);
        const parsedMessage = JSON.parse(messageString);
        this.callMessagePrint(
          ELoggerType.debug,
          `>>> [trancID:${traceId}] ${RTMEventType.MESSAGE}`,
          parsedMessage
        );
        this.covSubRenderController.handleMessage(parsedMessage, {
          publisher: message.publisher,
        });
        return;
      }
      this.callMessagePrint(
        ELoggerType.warn,
        `>>> [trancID:${traceId}] ${RTMEventType.MESSAGE}`,
        'Unsupported message type received'
      );
    } catch (error) {
      this.callMessagePrint(
        ELoggerType.error,
        `>>> [trancID:${traceId}] ${RTMEventType.MESSAGE}`,
        'Failed to parse message',
        error
      );
    }
  }
  private _handleRtmPresence(presence: RTMEvents.PresenceEvent) {
    const traceId = genTranceID();
    this.callMessagePrint(
      ELoggerType.debug,
      `>>> [trancID:${traceId}] ${RTMEventType.PRESENCE}`,
      `Publisher: ${presence.publisher}`
    );
    // Handle the presence event
    const stateChanged = presence.stateChanged;
    if (stateChanged?.state && stateChanged?.turn_id) {
      this.callMessagePrint(
        ELoggerType.debug,
        `>>> [trancID:${traceId}] ${RTMEventType.PRESENCE}`,
        `State changed: ${stateChanged.state}, Turn ID: ${stateChanged.turn_id}, timestamp: ${presence.timestamp}`
      );
      this.covSubRenderController.handleAgentStatus(
        presence as Omit<RTMEvents.PresenceEvent, 'stateChanged'> & {
          stateChanged: {
            state: AgentState;
            turn_id: string;
          };
        }
      );
    }
    this.callMessagePrint(
      ELoggerType.debug,
      `>>> [trancID:${traceId}] ${RTMEventType.PRESENCE}`,
      'No state change detected, skipping handling presence event'
    );
  }
  private _handleRtmStatus(
    status:
      | RTMEvents.RTMConnectionStatusChangeEvent
      | RTMEvents.StreamChannelConnectionStatusChangeEvent
  ) {
    const traceId = genTranceID();
    this.callMessagePrint(
      ELoggerType.debug,
      `>>> [trancID:${traceId}] ${RTMEventType.STATUS}`,
      status
    );
  }
}

// Export all types, enums, and interfaces
export {
  // Enums
  TranscriptHelperMode,
  MessageType,
  RTMEventType,
  RTCEventType,
  AgoraVoiceAIEvents,
  ModuleType,
  TurnStatus,
  AgentState,
  ChatMessagePriority,
  ChatMessageType,
  LocalTranscriptStatus,
  MessageSalStatus,
  // Types
  type AgentMetric,
  type MessageReceipt,
  type ModuleError,
  type StateChangeEvent,
  type AgoraVoiceAIEventHandlers,
  type HelperRTCEvents,
  type HelperRTMEvents,
  type DataChunkMessageWord,
  type TranscriptHelperObjectWord,
  type TranscriptionBase,
  type UserTranscription,
  type AgentTranscription,
  type MessageInterrupt,
  type MessageMetrics,
  type MessageError,
  type PresenceState,
  type QueueItem,
  type TranscriptHelperItem,
  type UserTracks,
  type ChatMessageBase,
  type ChatMessageText,
  type ChatMessageImage,
  type LocalTranscriptionBase,
  type LocalImageTranscription,
  type MessageSalStatusData,
  // Error classes
  NotFoundError,
};
