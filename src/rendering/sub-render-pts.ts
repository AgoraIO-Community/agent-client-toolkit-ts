import { ELoggerType } from '../utils/debug';

type CallMessagePrint = (type: ELoggerType, ...args: unknown[]) => void;
type HandleQueueFn = (curPTS: number) => void;

/**
 * SubRenderPTS manages the PTS (Presentation Time Stamp) state and the
 * interval loop that drives PTS-gated word emission.
 *
 * Extracted from CovSubRenderController to isolate PTS synchronization logic.
 */
export class SubRenderPTS {
  private _pts: number = 0; // current pts
  private _intervalRef: NodeJS.Timeout | null = null;
  private _isRunning: boolean = false;

  private _interval: number;
  private callMessagePrint: CallMessagePrint;
  private handleQueue: HandleQueueFn;

  constructor(
    interval: number,
    callMessagePrint: CallMessagePrint,
    handleQueue: HandleQueueFn
  ) {
    this._interval = interval;
    this.callMessagePrint = callMessagePrint;
    this.handleQueue = handleQueue;
  }

  public get pts(): number {
    return this._pts;
  }

  public get isRunning(): boolean {
    return this._isRunning;
  }

  public setRunning(value: boolean) {
    this._isRunning = value;
  }

  public setInterval(interval: number) {
    this._interval = interval;
  }

  private _preSetupInterval() {
    if (!this._isRunning) {
      this.callMessagePrint(
        ELoggerType.error,
        '_preSetupInterval',
        'Message service is not running'
      );
      return;
    }
  }

  public setupIntervalForWords(options?: { isForce?: boolean }) {
    this._preSetupInterval();
    // if force: clean older and reset interval
    if (options?.isForce) {
      if (this._intervalRef) {
        clearInterval(this._intervalRef);
        this._intervalRef = null;
      }
      this._intervalRef = setInterval(
        () => this.handleQueue(this._pts),
        this._interval
      );
      return;
    }
    // else(if not forced): skip if interval is already set, otherwise set an interval
    if (this._intervalRef) {
      return;
    }
    this._intervalRef = setInterval(
      () => this.handleQueue(this._pts),
      this._interval
    );
  }

  public teardownInterval() {
    if (this._intervalRef) {
      clearInterval(this._intervalRef);
      this._intervalRef = null;
    }
  }

  public get intervalRef(): NodeJS.Timeout | null {
    return this._intervalRef;
  }

  public setIntervalRef(ref: NodeJS.Timeout) {
    this._intervalRef = ref;
  }

  public setPts(pts: number) {
    if (this._pts < pts && pts !== 0) {
      this._pts = pts;
    }
  }

  public reset() {
    this.teardownInterval();
    this._pts = 0;
    this._isRunning = false;
  }
}
