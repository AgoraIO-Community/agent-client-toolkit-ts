import { useState, useEffect, useCallback } from 'react';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  type ModuleError,
  type ChatMessageType,
} from '@agora/conversational-ai-toolkit';

/** Discriminated union for errors from both AGENT_ERROR and MESSAGE_ERROR events. */
export type AgentErrorEvent =
  | { source: 'agent'; agentUserId: string; error: ModuleError }
  | {
      source: 'message';
      agentUserId: string;
      error: {
        type: ChatMessageType;
        code: number;
        message: string;
        timestamp: number;
      };
    };

export interface UseAgentErrorReturn {
  /** Latest error from AGENT_ERROR or MESSAGE_ERROR. Null until an error occurs. */
  error: AgentErrorEvent | null;
  /** Reset the error to null (e.g. after dismissing a toast). */
  clearError: () => void;
}

/**
 * Subscribes to both `AGENT_ERROR` and `MESSAGE_ERROR` events from a
 * pre-initialized `AgoraVoiceAI` instance.
 *
 * The returned `error` uses a discriminated union with a `source` field
 * (`'agent'` or `'message'`) so consumers can distinguish pipeline errors
 * from RTM message errors when needed.
 *
 * If `AgoraVoiceAI` has not been initialized yet, returns null until
 * initialization completes.
 *
 * @example
 * function ErrorToast() {
 *   const { error, clearError } = useAgentError();
 *   if (!error) return null;
 *   return (
 *     <div>
 *       <p>{error.source} error: {error.error.message}</p>
 *       <button onClick={clearError}>Dismiss</button>
 *     </div>
 *   );
 * }
 */
export function useAgentError(): UseAgentErrorReturn {
  const [error, setError] = useState<AgentErrorEvent | null>(null);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const handleAgentError = (agentUserId: string, err: ModuleError) => {
      setError({ source: 'agent', agentUserId, error: err });
    };

    const handleMessageError = (
      agentUserId: string,
      err: { type: ChatMessageType; code: number; message: string; timestamp: number }
    ) => {
      setError({ source: 'message', agentUserId, error: err });
    };

    const tryConnect = () => {
      try {
        const ai = AgoraVoiceAI.getInstance();
        ai.on(AgoraVoiceAIEvents.AGENT_ERROR, handleAgentError);
        ai.on(AgoraVoiceAIEvents.MESSAGE_ERROR, handleMessageError);
        cleanup = () => {
          try {
            ai.off(AgoraVoiceAIEvents.AGENT_ERROR, handleAgentError);
            ai.off(AgoraVoiceAIEvents.MESSAGE_ERROR, handleMessageError);
          } catch { /* destroyed */ }
        };
      } catch {
        retryTimer = setTimeout(tryConnect, 100);
      }
    };

    tryConnect();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      cleanup?.();
    };
  }, []);

  return { error, clearError };
}
