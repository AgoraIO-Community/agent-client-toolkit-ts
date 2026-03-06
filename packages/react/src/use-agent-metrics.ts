import { useState, useEffect } from 'react';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  type AgentMetric,
} from '@agora/conversational-ai-toolkit';

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
 * If `AgoraVoiceAI` has not been initialized yet, returns nulls until
 * initialization completes.
 *
 * @example
 * function LatencyDisplay() {
 *   const { metrics } = useAgentMetrics();
 *   if (!metrics) return null;
 *   return <span>{metrics.name}: {metrics.value}ms</span>;
 * }
 */
export function useAgentMetrics(): UseAgentMetricsReturn {
  const [metrics, setMetrics] = useState<AgentMetric | null>(null);
  const [agentUserId, setAgentUserId] = useState<string | null>(null);

  useEffect(() => {
    let ai: AgoraVoiceAI;
    try {
      ai = AgoraVoiceAI.getInstance();
    } catch {
      return;
    }

    const handler = (userId: string, m: AgentMetric) => {
      setMetrics(m);
      setAgentUserId(userId);
    };

    ai.on(AgoraVoiceAIEvents.AGENT_METRICS, handler);
    return () => {
      ai.off(AgoraVoiceAIEvents.AGENT_METRICS, handler);
    };
  }, []);

  return { metrics, agentUserId };
}
