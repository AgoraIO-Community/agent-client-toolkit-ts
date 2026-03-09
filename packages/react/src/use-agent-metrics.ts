import { useState, useEffect } from 'react';
import { AgoraVoiceAIEvents, type AgentMetric } from '@agora/agent-client-toolkit';
import { useAgoraVoiceAIInstance } from './context';

export interface UseAgentMetricsReturn {
  /** Latest agent metric. Null until the first AGENT_METRICS event. */
  metrics: AgentMetric | null;
  /** UID of the agent that emitted the last metric. Null until the first event. */
  agentUserId: string | null;
}

/**
 * Subscribe to `AGENT_METRICS` events from the nearest
 * `ConversationalAIProvider`.
 *
 * Useful for latency displays and debugging UIs. Returns the latest
 * metric (module type, name, value, timestamp) and the agent UID.
 *
 * Must be rendered inside a `ConversationalAIProvider`. Returns nulls
 * until the provider's `AgoraVoiceAI` instance is initialized.
 *
 * @example
 * function LatencyDisplay() {
 *   const { metrics } = useAgentMetrics();
 *   if (!metrics) return null;
 *   return <span>{metrics.name}: {metrics.value}ms</span>;
 * }
 */
export function useAgentMetrics(): UseAgentMetricsReturn {
  const ai = useAgoraVoiceAIInstance();

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
      try {
        ai.off(AgoraVoiceAIEvents.AGENT_METRICS, handler);
      } catch {
        /* destroyed */
      }
    };
  }, [ai]);

  return { metrics, agentUserId };
}
