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
    let cleanup: (() => void) | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const handler = (userId: string, m: AgentMetric) => {
      setMetrics(m);
      setAgentUserId(userId);
    };

    const tryConnect = () => {
      try {
        const ai = AgoraVoiceAI.getInstance();
        ai.on(AgoraVoiceAIEvents.AGENT_METRICS, handler);
        cleanup = () => {
          try { ai.off(AgoraVoiceAIEvents.AGENT_METRICS, handler); } catch { /* destroyed */ }
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

  return { metrics, agentUserId };
}
