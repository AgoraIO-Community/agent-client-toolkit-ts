import type {
  AgentTranscription,
  DataChunkMessageWord,
  QueueItem,
  TranscriptHelperItem,
  TranscriptHelperObjectWord,
  UserTranscription,
} from '../core/types';
import { TurnStatus, TranscriptHelperMode } from '../core/types';
import { ELoggerType } from '../utils/debug';

type CallMessagePrint = (type: ELoggerType, ...args: unknown[]) => void;
type MutateChatHistoryFn = () => void;

const SELF_USER_ID = 0;

/**
 * SubRenderQueue manages the queue data structure, chatHistory, and all methods
 * that operate on transcript queue state — including text/word/chunk message handling.
 *
 * Extracted from CovSubRenderController to isolate queue processing logic.
 */
export class SubRenderQueue {
  public static self_uid = SELF_USER_ID;

  public queue: QueueItem[] = [];
  public lastPoppedQueueItem: QueueItem | null | undefined = null;
  public chatHistory: TranscriptHelperItem<
    Partial<UserTranscription | AgentTranscription>
  >[] = [];

  // Chunk mode state — owned here because it is pending queue content
  public transcriptChunk: {
    index: number;
    data: AgentTranscription;
    uid: string;
  } | null = null;

  private callMessagePrint: CallMessagePrint;
  private mutateChatHistory: MutateChatHistoryFn;

  constructor(
    callMessagePrint: CallMessagePrint,
    mutateChatHistory: MutateChatHistoryFn
  ) {
    this.callMessagePrint = callMessagePrint;
    this.mutateChatHistory = mutateChatHistory;
  }

  // -----------------------------------------------------------------------
  // Queue processing (called from SubRenderPTS interval)
  // -----------------------------------------------------------------------

  public processQueue(curPTS: number) {
    const queueLength = this.queue.length;
    // empty queue, skip
    if (queueLength === 0) {
      return;
    }
    // only one item, update chatHistory with queueItem
    if (queueLength === 1) {
      const queueItem = this.queue[0];
      this._handleTurnObj(queueItem, curPTS);
      this.mutateChatHistory();
      return;
    }
    if (queueLength > 2) {
      this.callMessagePrint(
        ELoggerType.error,
        'Queue length is greater than 2, but it should not happen'
      );
    }
    // assume the queueLength is 2
    if (queueLength > 1) {
      this.queue = this.queue.sort((a, b) => a.turn_id - b.turn_id);
      const nextItem = this.queue[this.queue.length - 1];
      const lastItem = this.queue[this.queue.length - 2];
      // check if nextItem is started
      const firstWordOfNextItem = nextItem.words[0];
      // if firstWordOfNextItem.start_ms > curPTS, work on lastItem
      if (firstWordOfNextItem.start_ms > curPTS) {
        this._handleTurnObj(lastItem, curPTS);
        this.mutateChatHistory();
        return;
      }
      // if firstWordOfNextItem.start_ms <= curPTS, work on nextItem, assume lastItem is interrupted(and drop it)
      const lastItemCorrespondingChatHistoryItem = this.chatHistory.find(
        (item) =>
          item.turn_id === lastItem.turn_id &&
          item.stream_id === lastItem.stream_id
      );
      if (!lastItemCorrespondingChatHistoryItem) {
        this.callMessagePrint(
          ELoggerType.warn,
          'No corresponding chatHistory item found',
          lastItem
        );
        return;
      }
      lastItemCorrespondingChatHistoryItem.status = TurnStatus.INTERRUPTED;
      this.lastPoppedQueueItem = this.queue.shift();
      // handle nextItem
      this._handleTurnObj(nextItem, curPTS);
      this.mutateChatHistory();
      return;
    }
  }

  private _handleTurnObj(queueItem: QueueItem, curPTS: number) {
    let correspondingChatHistoryItem = this.chatHistory.find(
      (item) =>
        item.turn_id === queueItem.turn_id &&
        item.stream_id === queueItem.stream_id
    );
    this.callMessagePrint(
      ELoggerType.debug,
      'handleTurnObj',
      queueItem,
      'correspondingChatHistoryItem',
      correspondingChatHistoryItem
    );
    if (!correspondingChatHistoryItem) {
      this.callMessagePrint(
        ELoggerType.debug,
        'handleTurnObj',
        'No corresponding chatHistory item found',
        'push to chatHistory'
      );
      correspondingChatHistoryItem = {
        turn_id: queueItem.turn_id,
        uid: queueItem.uid,
        stream_id: queueItem.stream_id,
        _time: new Date().getTime(),
        text: '',
        status: queueItem.status,
        metadata: queueItem,
      };
      this.appendChatHistory(correspondingChatHistoryItem);
    }
    // update correspondingChatHistoryItem._time for chatHistory auto-scroll
    correspondingChatHistoryItem._time = new Date().getTime();
    // update correspondingChatHistoryItem.metadata
    correspondingChatHistoryItem.metadata = queueItem;
    // update correspondingChatHistoryItem.status if queueItem.status is interrupted(from message.interrupt event)
    if (queueItem.status === TurnStatus.INTERRUPTED) {
      correspondingChatHistoryItem.status = TurnStatus.INTERRUPTED;
    }
    // pop all valid word items(those word.start_ms <= curPTS) in queueItem
    const validWords: TranscriptHelperObjectWord[] = [];
    const restWords: TranscriptHelperObjectWord[] = [];
    for (const word of queueItem.words) {
      if (word.start_ms <= curPTS) {
        validWords.push(word);
      } else {
        restWords.push(word);
      }
    }
    // check if restWords is empty
    const isRestWordsEmpty = restWords.length === 0;
    // check if validWords last word is final
    const isLastWordFinal =
      validWords[validWords.length - 1]?.word_status !== TurnStatus.IN_PROGRESS;
    // if restWords is empty and validWords last word is final, this turn is ended
    if (isRestWordsEmpty && isLastWordFinal) {
      // update chatHistory with queueItem
      correspondingChatHistoryItem.text = queueItem.text;
      correspondingChatHistoryItem.status = queueItem.status;
      // pop queueItem
      this.lastPoppedQueueItem = this.queue.shift();
      return;
    }
    // if restWords is not empty, update correspondingChatHistoryItem.text
    const validWordsText = validWords
      .filter((word) => word.start_ms <= curPTS)
      .map((word) => word.word)
      .join('');
    correspondingChatHistoryItem.text = validWordsText;
    // if validWords last word is interrupted, this turn is ended
    const isLastWordInterrupted =
      validWords[validWords.length - 1]?.word_status === TurnStatus.INTERRUPTED;
    if (isLastWordInterrupted) {
      // pop queueItem
      this.lastPoppedQueueItem = this.queue.shift();
      return;
    }
    return;
  }

  public appendChatHistory(
    item: TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>
  ) {
    // if item.turn_id is 0, append to the front of chatHistory(greeting message)
    if (item.turn_id === 0) {
      this.chatHistory = [item, ...this.chatHistory];
    } else {
      this.chatHistory.push(item);
    }
  }

  public interruptQueue(options: { turn_id: number; start_ms: number }) {
    const turn_id = options.turn_id;
    const start_ms = options.start_ms;
    const correspondingQueueItem = this.queue.find(
      (item) => item.turn_id === turn_id
    );
    this.callMessagePrint(
      ELoggerType.debug,
      'interruptQueue',
      `turn_id: ${turn_id}, start_ms: ${start_ms}, correspondingQueueItem: ${correspondingQueueItem}`
    );
    if (!correspondingQueueItem) {
      return;
    }
    // if correspondingQueueItem exists, update its status to interrupted
    correspondingQueueItem.status = TurnStatus.INTERRUPTED;
    // split words into two parts, set left one word and all right words to interrupted
    const leftWords = correspondingQueueItem.words.filter(
      (word) => word.start_ms <= start_ms
    );
    const rightWords = correspondingQueueItem.words.filter(
      (word) => word.start_ms > start_ms
    );
    // check if leftWords is empty
    const isLeftWordsEmpty = leftWords.length === 0;
    if (isLeftWordsEmpty) {
      // if leftWords is empty, set all words to interrupted
      correspondingQueueItem.words.forEach((word) => {
        word.word_status = TurnStatus.INTERRUPTED;
      });
    } else {
      // if leftWords is not empty, set leftWords[leftWords.length - 1].word_status to interrupted
      leftWords[leftWords.length - 1].word_status = TurnStatus.INTERRUPTED;
      // workaround: pts < interrupt.start_ms, and interrupt will be ignored
      if (leftWords?.[leftWords.length - 2]) {
        leftWords[leftWords.length - 2].word_status = TurnStatus.INTERRUPTED;
      }
      // and all right words to interrupted
      rightWords.forEach((word) => {
        word.word_status = TurnStatus.INTERRUPTED;
      });
      // update words
      correspondingQueueItem.words = [...leftWords, ...rightWords];
    }
  }

  public pushToQueue(data: {
    turn_id: number;
    words: TranscriptHelperObjectWord[];
    text: string;
    status: TurnStatus;
    stream_id: number;
    uid: string;
  }) {
    const targetQueueItem = this.queue.find(
      (item) => item.turn_id === data.turn_id
    );
    const latestTurnId = this.queue.reduce((max, item) => {
      return Math.max(max, item.turn_id);
    }, 0);
    // if not found, push to queue or drop if turn_id is less than latestTurnId
    if (!targetQueueItem) {
      // drop if turn_id is less than latestTurnId
      if (data.turn_id < latestTurnId) {
        this.callMessagePrint(
          ELoggerType.debug,
          `[Word Mode]`,
          `[${data.uid}]`,
          'Drop message with turn_id less than latestTurnId',
          `turn_id: ${data.turn_id}, latest turn_id: ${latestTurnId}`,
          data
        );
        return;
      }
      const newQueueItem = {
        turn_id: data.turn_id,
        text: data.text,
        words: this.sortWordsWithStatus(data.words, data.status),
        status: data.status,
        stream_id: data.stream_id,
        uid: data.uid,
      };
      this.callMessagePrint(
        ELoggerType.debug,
        `[Word Mode]`,
        `[${data.uid}]`,
        'push to queue',
        newQueueItem
      );
      // push to queue
      this.queue.push(newQueueItem);
      return;
    }
    // if found, update text, words(sorted with status) and turn_status
    this.callMessagePrint(
      ELoggerType.debug,
      `[Word Mode]`,
      `[${data.uid}]`,
      'update queue item',
      targetQueueItem,
      data
    );
    targetQueueItem.text = data.text;
    targetQueueItem.words = this.sortWordsWithStatus(
      [...targetQueueItem.words, ...data.words],
      data.status
    );
    // if targetQueueItem.status is end, and data.status is in_progress, skip status update (unexpected case)
    if (
      targetQueueItem.status !== TurnStatus.IN_PROGRESS &&
      data.status === TurnStatus.IN_PROGRESS
    ) {
      return;
    }
    targetQueueItem.status = data.status;
  }

  public sortWordsWithStatus(
    words: DataChunkMessageWord[],
    turn_status: TurnStatus
  ) {
    if (words.length === 0) {
      return words;
    }
    const sortedWords: TranscriptHelperObjectWord[] = words
      .map((word) => ({
        ...word,
        word_status: TurnStatus.IN_PROGRESS,
      }))
      .sort((a, b) => a.start_ms - b.start_ms)
      .reduce((acc, curr) => {
        // Only add if start_ms is unique
        if (!acc.find((word) => word.start_ms === curr.start_ms)) {
          acc.push(curr);
        }
        return acc;
      }, [] as TranscriptHelperObjectWord[]);
    const isMessageFinal = turn_status !== TurnStatus.IN_PROGRESS;
    if (isMessageFinal) {
      sortedWords[sortedWords.length - 1].word_status = turn_status;
    }
    return sortedWords;
  }

  // -----------------------------------------------------------------------
  // Message handlers — operate on chatHistory (TEXT / WORD modes)
  // -----------------------------------------------------------------------

  public handleTextMessage(uid: string, message: UserTranscription, callMessagePrint: CallMessagePrint) {
    const turn_id = message.turn_id;
    const text = message.text || '';
    const stream_id = message.stream_id;
    const turn_status = TurnStatus.END;

    const targetChatHistoryItem = this.chatHistory.find(
      (item) => item.turn_id === turn_id && item.stream_id === stream_id
    );
    // if not found, push to chatHistory
    if (!targetChatHistoryItem) {
      callMessagePrint(
        ELoggerType.debug,
        `[Text Mode]`,
        `[${uid}]`,
        'new item',
        message
      );
      this.appendChatHistory({
        turn_id,
        uid: message.stream_id ? `${SubRenderQueue.self_uid}` : `${uid}`,
        stream_id,
        _time: new Date().getTime(),
        text,
        status: turn_status,
        metadata: message,
      });
    } else {
      // if found, update text and status
      targetChatHistoryItem.text = text;
      targetChatHistoryItem.status = turn_status;
      targetChatHistoryItem.metadata = message;
      targetChatHistoryItem._time = new Date().getTime();
      callMessagePrint(
        ELoggerType.debug,
        `[Text Mode]`,
        `[${uid}]`,
        targetChatHistoryItem
      );
    }
    this.mutateChatHistory();
  }

  public handleChunkTextMessage(
    uid: string,
    message: AgentTranscription,
    callMessagePrint: CallMessagePrint,
    onIntervalNeeded: () => void
  ) {
    callMessagePrint(
      ELoggerType.debug,
      `[${TranscriptHelperMode.CHUNK} Mode]`,
      `[${uid}]`,
      'new item',
      message
    );
    // 0. check turn_id, teardown interval if new turn
    if (
      this.transcriptChunk &&
      this.transcriptChunk.data.turn_id < message.turn_id
    ) {
      onIntervalNeeded(); // signals orchestrator to teardown interval
      // set chathistory items turn_status to ended
      const lastChatHistory = this.chatHistory.find(
        (item) =>
          item.turn_id === this.transcriptChunk?.data.turn_id &&
          item.uid === uid
      );
      if (lastChatHistory) {
        lastChatHistory.status = TurnStatus.END;
      }
      // set transcriptChunk to null
      this.transcriptChunk = null;
    }
    // 1. update transcriptChunk
    this.transcriptChunk = {
      index: this.transcriptChunk?.index ?? 0,
      data: message,
      uid,
    };
  }

  public handleTranscriptChunk(callMessagePrint: CallMessagePrint) {
    if (!this.transcriptChunk) {
      callMessagePrint(
        ELoggerType.warn,
        `[${TranscriptHelperMode.CHUNK} Mode]`,
        '_handleTranscriptChunk',
        'missing _transcriptChunk'
      );
      return;
    }
    const currentIdx = this.transcriptChunk.index;
    const currentTranscript = this.transcriptChunk.data;
    const currentMaxLength = currentTranscript.text.length;
    const uid = this.transcriptChunk.uid;

    const nextIdx =
      currentIdx + 1 >= currentMaxLength ? currentMaxLength : currentIdx + 1;
    this.transcriptChunk.index = nextIdx;
    const validTranscriptString = currentTranscript.text.substring(0, nextIdx);
    const isValidTranscriptStringEnded =
      validTranscriptString.length > 0 &&
      currentTranscript.turn_status !== TurnStatus.IN_PROGRESS &&
      validTranscriptString.length === currentTranscript.text.length;

    const targetChatHistoryItem = this.chatHistory.find(
      (item) =>
        item.turn_id === currentTranscript.turn_id &&
        item.stream_id === currentTranscript.stream_id
    );
    // if not found, push to chatHistory
    if (!targetChatHistoryItem) {
      callMessagePrint(
        ELoggerType.debug,
        `[${TranscriptHelperMode.CHUNK} Mode]`,
        `[${uid}]`,
        'new transcriptChunk',
        this.transcriptChunk
      );
      this.appendChatHistory({
        turn_id: currentTranscript.turn_id,
        uid: currentTranscript.stream_id
          ? `${SubRenderQueue.self_uid}`
          : `${uid}`,
        stream_id: currentTranscript.stream_id,
        _time: Date.now(),
        text: validTranscriptString,
        status: currentTranscript.turn_status,
        metadata: currentTranscript,
      });
    } else {
      // if found, update text and status
      targetChatHistoryItem.text = validTranscriptString;
      targetChatHistoryItem.status = isValidTranscriptStringEnded
        ? currentTranscript.turn_status
        : targetChatHistoryItem.status;
      targetChatHistoryItem.metadata = currentTranscript;
      targetChatHistoryItem._time = Date.now();
      callMessagePrint(
        ELoggerType.debug,
        `[${TranscriptHelperMode.CHUNK} Mode]`,
        `[${uid}]`,
        'update transcriptChunk',
        targetChatHistoryItem
      );
    }
    this.mutateChatHistory();
  }

  public handleWordAgentMessage(
    uid: string,
    message: AgentTranscription,
    lastPoppedQueueItemTurnId: number | undefined,
    callMessagePrint: CallMessagePrint
  ) {
    // drop message if turn_status is undefined
    if (typeof message.turn_status === 'undefined') {
      callMessagePrint(
        ELoggerType.debug,
        `[Word Mode]`,
        `[${uid}]`,
        'Drop message with undefined turn_status',
        message.turn_id
      );
      return;
    }

    const turn_id = message.turn_id;
    const text = message.text || '';
    const words = message.words || [];
    const stream_id = message.stream_id;
    // drop message if turn_id is less than last popped queue item
    // except for the first turn(greeting message, turn_id is 0)
    if (
      lastPoppedQueueItemTurnId &&
      turn_id !== 0 &&
      turn_id <= lastPoppedQueueItemTurnId
    ) {
      callMessagePrint(
        ELoggerType.debug,
        `[Word Mode]`,
        `[${uid}]`,
        'Drop message with turn_id less than last popped queue item',
        `turn_id: ${turn_id}, last popped queue item turn_id: ${lastPoppedQueueItemTurnId}`
      );
      return;
    }
    this.pushToQueue({
      uid: message.stream_id ? `${SubRenderQueue.self_uid}` : `${uid}`,
      turn_id,
      words,
      text,
      status: message.turn_status,
      stream_id,
    });
  }

  public reset() {
    this.queue = [];
    this.lastPoppedQueueItem = null;
    this.chatHistory = [];
    this.transcriptChunk = null;
  }
}
