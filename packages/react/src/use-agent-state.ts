import { useState, useEffect } from 'react';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  type AgentState,
  type StateChangeEvent,
} from '@agora/conversational-ai-toolkit';

export interface UseAgentStateReturn {
  /** Current agent state. Null until the first AGENT_STATE_CHANGED event. */
  agentState: AgentState | null;
  /** Full state-change event with turnID, timestamp, and reason. Null until the first event. */
  stateEvent: StateChangeEvent | null;
  /** UID of the agent that emitted the last state change. Null until the first event. */
  agentUserId: string | null;
}

/**
 * Subscribes to `AGENT_STATE_CHANGED` events from a pre-initialized
 * `AgoraVoiceAI` instance.
 *
 * Use in components that only need agent state without owning the AI
 * lifecycle (e.g. a `<StatusBar>`). If `AgoraVoiceAI` has not been
 * initialized yet, returns nulls until initialization completes.
 *
 * Can be used alongside `useConversationalAI` — the same event fires both
 * handlers; this is expected and documented.
 *
 * @example
 * function StatusBar() {
 *   const { agentState } = useAgentState();
 *   return <span>Agent: {agentState ?? 'not connected'}</span>;
 * }
 */
export function useAgentState(): UseAgentStateReturn {
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [stateEvent, setStateEvent] = useState<StateChangeEvent | null>(null);
  const [agentUserId, setAgentUserId] = useState<string | null>(null);

  useEffect(() => {
    let ai: AgoraVoiceAI;
    try {
      ai = AgoraVoiceAI.getInstance();
    } catch {
      return;
    }

    const handler = (userId: string, event: StateChangeEvent) => {
      setAgentState(event.state);
      setStateEvent(event);
      setAgentUserId(userId);
    };

    ai.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, handler);
    return () => {
      ai.off(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, handler);
    };
  }, []);

  return { agentState, stateEvent, agentUserId };
}
