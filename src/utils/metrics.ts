export interface IMetricsReporter {
  report(event: string, data: Record<string, unknown>): void;
  flush?(): Promise<void>;
}

// Default: always available, zero dependencies, zero bundle impact
export class ConsoleMetricsReporter implements IMetricsReporter {
  report(event: string, data: Record<string, unknown>): void {
    console.debug(`[ConversationalAI:metrics] ${event}`, data);
  }
}

// Optional: loads @agora-js/report only when enableAgoraMetrics: true
export class AgoraMetricsReporter implements IMetricsReporter {
  private reporter: IMetricsReporter | null = null;

  async init(): Promise<void> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { default: AgoraReport } = await import('@agora-js/report');
      if (typeof AgoraReport !== 'function') {
        console.warn('[ConversationalAI] @agora-js/report default export is not a constructor. Falling back to console metrics.');
        return;
      }
      // @agora-js/report's constructor API is not publicly typed; cast required.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.reporter = new (AgoraReport as any)();
    } catch (e: unknown) {
      const isModuleNotFound =
        e instanceof Error &&
        ('code' in e && (e as NodeJS.ErrnoException).code === 'MODULE_NOT_FOUND' ||
          e.message.includes('Cannot find module'));
      if (isModuleNotFound) {
        console.warn(
          '[ConversationalAI] @agora-js/report not found. ' +
            'Falling back to console metrics. ' +
            'Install it with: pnpm add @agora-js/report'
        );
      } else {
        console.error('[ConversationalAI] Failed to initialize @agora-js/report:', e);
      }
    }
  }

  report(event: string, data: Record<string, unknown>): void {
    if (this.reporter) {
      this.reporter.report(event, data);
    } else {
      console.debug(`[ConversationalAI:metrics] ${event}`, data);
    }
  }
}
