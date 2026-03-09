import { useState, useEffect } from 'react';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  type AgentMetric,
} from '@agora/conversational-ai-toolkit';
import { useAgoraVoiceAIInstance } from './context';

export interface UseAgentMetricsReturn {
  /** Latest agent metric. Null until the first AGENT_METRICS event. */
  metrics: AgentMetric | null;
  /** UID of the agent that emitted the last metric. Null until the first event. */
  agentUserId: string | null;
}

/**
 * Subscribes to `AGENT_METRICS` events from a pre-initialized
 * `AgoraVoiceAI` instance.
 *
 * Useful for latency displays and debugging UIs. Returns the latest
 * metric (module type, name, value, timestamp) and the agent UID.
 *
 * When used inside a `ConversationalAIProvider`, connects instantly via
 * React context. When used without the provider, falls back to a single
 * `getInstance()` attempt (no polling).
 *
 * @example
 * function LatencyDisplay() {
 *   const { metrics } = useAgentMetrics();
 *   if (!metrics) return null;
 *   return <span>{metrics.name}: {metrics.value}ms</span>;
 * }
 */
export function useAgentMetrics(): UseAgentMetricsReturn {
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

  const [metrics, setMetrics] = useState<AgentMetric | null>(null);
  const [agentUserId, setAgentUserId] = useState<string | null>(null);

  useEffect(() => {
    if (!ai) return;

    const handler = (userId: string, m: AgentMetric) => {
      setMetrics(m);
      setAgentUserId(userId);
    };

    ai.on(AgoraVoiceAIEvents.AGENT_METRICS, handler);
    return () => {
      try { ai.off(AgoraVoiceAIEvents.AGENT_METRICS, handler); } catch { /* destroyed */ }
    };
  }, [ai]);

  return { metrics, agentUserId };
}
