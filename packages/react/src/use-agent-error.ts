import { useState, useEffect, useCallback } from 'react';
import {
  AgoraVoiceAIEvents,
  type ModuleError,
  type ChatMessageType,
} from 'agent-client-toolkit-ts';
import { useAgoraVoiceAIInstance } from './context';

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
 * Subscribe to both `AGENT_ERROR` and `MESSAGE_ERROR` events from the
 * nearest `ConversationalAIProvider`.
 *
 * The returned `error` uses a discriminated union with a `source` field
 * (`'agent'` or `'message'`) so consumers can distinguish pipeline errors
 * from RTM message errors when needed.
 *
 * Must be rendered inside a `ConversationalAIProvider`. Returns null
 * until the provider's `AgoraVoiceAI` instance is initialized.
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
  const ai = useAgoraVoiceAIInstance();

  const [error, setError] = useState<AgentErrorEvent | null>(null);

  const clearError = useCallback(() => setError(null), []);

  useEffect(() => {
    if (!ai) return;

    const handleAgentError = (agentUserId: string, err: ModuleError) => {
      setError({ source: 'agent', agentUserId, error: err });
    };

    const handleMessageError = (
      agentUserId: string,
      err: { type: ChatMessageType; code: number; message: string; timestamp: number }
    ) => {
      setError({ source: 'message', agentUserId, error: err });
    };

    ai.on(AgoraVoiceAIEvents.AGENT_ERROR, handleAgentError);
    ai.on(AgoraVoiceAIEvents.MESSAGE_ERROR, handleMessageError);
    return () => {
      try {
        ai.off(AgoraVoiceAIEvents.AGENT_ERROR, handleAgentError);
        ai.off(AgoraVoiceAIEvents.MESSAGE_ERROR, handleMessageError);
      } catch {
        /* destroyed */
      }
    };
  }, [ai]);

  return { error, clearError };
}
