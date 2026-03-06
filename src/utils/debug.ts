// ---------------------------------------------------------------------------
// Logger types and manager (from lib/logger.ts)
// ---------------------------------------------------------------------------

const MAX_ZIP_SIZE = 4 * 1024 * 1024; // 4MB

export enum ELoggerType {
  log = 'log',
  info = 'info',
  debug = 'debug',
  error = 'error',
  warn = 'warn',
}

interface LogEntry {
  message: string;
  size: number;
}

class LogManager {
  private currentSize = 0;
  private logs: LogEntry[] = [];
  private textEncoder = new TextEncoder();

  private addLog(level: ELoggerType, ...args: unknown[]) {
    try {
      const timestamp = new Date().toISOString();
      const logMessage = args
        .map((arg) => (typeof arg === 'string' ? arg : JSON.stringify(arg)))
        .join(' ');
      if (process.env.NODE_ENV === 'development') {
        console[level](`[${timestamp}] ${logMessage}`);
      }
      const fullLogMessage = `${timestamp} ${logMessage}\n`;
      const logSize = this.textEncoder.encode(fullLogMessage).length;
      const logEntry: LogEntry = {
        message: fullLogMessage,
        size: logSize,
      };

      this.logs.push(logEntry);
      this.currentSize += logSize;

      if (this.currentSize > MAX_ZIP_SIZE) {
        let removedSize = 0;
        let removeCount = 0;

        for (const log of this.logs) {
          removedSize += log.size;
          removeCount++;
          if (this.currentSize - removedSize <= MAX_ZIP_SIZE) {
            break;
          }
        }

        this.logs = this.logs.slice(removeCount);
        this.currentSize -= removedSize;
      }
    } catch (error) {
      console.info('Error in addLog:', error);
    }
  }

  async downloadLogs(): Promise<File | null> {
    let JSZip: typeof import('jszip');
    try {
      JSZip = (await import('jszip')).default;
    } catch {
      throw new Error(
        '[ConversationalAI] downloadLogs requires jszip. ' +
          'Install it with: npm install jszip',
      );
    }

    try {
      const zip = new JSZip();
      const logContent = this.logs.map((log) => log.message).join('');

      zip.file('log.txt', logContent);
      const content = await zip.generateAsync({ type: 'blob' });
      const file = new File([content], 'logs.zip', { type: 'application/zip' });

      // Clear only after the File is successfully created
      this.clear();

      return file;
    } catch (error) {
      console.error('Error creating log file:', error);
      return null;
    }
  }

  private clear() {
    this.logs = [];
    this.currentSize = 0;
  }

  info(...args: unknown[]) {
    this.addLog(ELoggerType.info, ...args);
  }

  log(...args: unknown[]) {
    this.addLog(ELoggerType.log, ...args);
  }

  debug(...args: unknown[]) {
    this.addLog(ELoggerType.debug, ...args);
  }

  error(...args: unknown[]) {
    this.addLog(ELoggerType.error, ...args);
  }

  warn(...args: unknown[]) {
    this.addLog(ELoggerType.warn, ...args);
  }
}

export const logger = new LogManager();

// ---------------------------------------------------------------------------
// General utilities (from lib/utils.ts)
// ---------------------------------------------------------------------------

export function decodeStreamMessage(stream: Uint8Array) {
  const decoder = new TextDecoder();
  return decoder.decode(stream);
}

export const genTraceID = (length: number = 8) => {
  let result = '';
  const characters = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const charactersLength = characters.length;

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * charactersLength);
    result += characters[randomIndex];
  }

  return result;
};

// ---------------------------------------------------------------------------
// Log formatting (from utils/index.ts)
// ---------------------------------------------------------------------------

export const factoryFormatLog =
  (options: { tag: string }) =>
  (...args: unknown[]) => {
    return `[${options.tag}] ${args.map((arg) => JSON.stringify(arg)).join(' ')}`;
  };
