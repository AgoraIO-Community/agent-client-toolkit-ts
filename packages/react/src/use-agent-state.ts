import { useState, useEffect } from 'react';
import {
  AgoraVoiceAIEvents,
  type AgentState,
  type StateChangeEvent,
} from '@agora/agent-client-toolkit';
import { useAgoraVoiceAIInstance } from './context';

export interface UseAgentStateReturn {
  /** Current agent state. Null until the first AGENT_STATE_CHANGED event. */
  agentState: AgentState | null;
  /** Full state-change event with turnID, timestamp, and reason. Null until the first event. */
  stateEvent: StateChangeEvent | null;
  /** UID of the agent that emitted the last state change. Null until the first event. */
  agentUserId: string | null;
}

/**
 * Subscribe to `AGENT_STATE_CHANGED` events from the nearest
 * `ConversationalAIProvider`.
 *
 * Must be rendered inside a `ConversationalAIProvider`. Returns nulls
 * until the provider's `AgoraVoiceAI` instance is initialized.
 *
 * @example
 * function StatusBar() {
 *   const { agentState } = useAgentState();
 *   return <span>Agent: {agentState ?? 'not connected'}</span>;
 * }
 */
export function useAgentState(): UseAgentStateReturn {
  const ai = useAgoraVoiceAIInstance();

  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [stateEvent, setStateEvent] = useState<StateChangeEvent | null>(null);
  const [agentUserId, setAgentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!ai) return;

    const handler = (userId: string, event: StateChangeEvent) => {
      setAgentState(event.state);
      setStateEvent(event);
      setAgentUserId(userId);
    };

    ai.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, handler);
    return () => {
      try {
        ai.off(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, handler);
      } catch {
        /* destroyed */
      }
    };
  }, [ai]);

  return { agentState, stateEvent, agentUserId };
}
