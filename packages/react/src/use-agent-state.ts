import { useState, useEffect } from 'react';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  type AgentState,
  type StateChangeEvent,
} from '@agora/conversational-ai-toolkit';
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
 * Subscribes to `AGENT_STATE_CHANGED` events from a pre-initialized
 * `AgoraVoiceAI` instance.
 *
 * Use in components that only need agent state without owning the AI
 * lifecycle (e.g. a `<StatusBar>`). If `AgoraVoiceAI` has not been
 * initialized yet, returns nulls until initialization completes.
 *
 * When used inside a `ConversationalAIProvider`, connects instantly via
 * React context. When used without the provider, falls back to a single
 * `getInstance()` attempt (no polling).
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
  const contextAi = useAgoraVoiceAIInstance();
  const [fallbackAi, setFallbackAi] = useState<AgoraVoiceAI | null>(null);

  // Fallback: single getInstance() attempt for backward compat without provider
  useEffect(() => {
    if (contextAi || fallbackAi) return;
    try {
      setFallbackAi(AgoraVoiceAI.getInstance());
    } catch {
      // Not initialized and no provider — hook returns defaults
    }
  }, [contextAi, fallbackAi]);

  const ai = contextAi ?? fallbackAi;

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
      try { ai.off(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, handler); } catch { /* destroyed */ }
    };
  }, [ai]);

  return { agentState, stateEvent, agentUserId };
}
