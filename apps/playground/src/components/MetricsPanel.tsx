import { useState, useEffect } from 'react';
import { useAgentMetrics } from '@agora/agent-client-toolkit-react';
import type { AgentMetric } from '@agora/agent-client-toolkit';

/**
 * Displays agent metrics in a collapsible table.
 * Uses useAgentMetrics() hook in an isolated component.
 * Keeps the last 20 metric entries.
 */
export function MetricsPanel() {
  const { metrics } = useAgentMetrics();
  const [history, setHistory] = useState<AgentMetric[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!metrics) return;
    setHistory((prev) => {
      const next = [...prev, metrics];
      return next.length > 20 ? next.slice(-20) : next;
    });
  }, [metrics]);

  return (
    <div className="pg-panel">
      <button className="pg-panel-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? '[-]' : '[+]'} Metrics ({history.length})
      </button>
      {open && (
        <table className="pg-metrics-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Module</th>
              <th>Metric</th>
              <th>Value (ms)</th>
            </tr>
          </thead>
          <tbody>
            {history.map((m, i) => (
              <tr key={i}>
                <td>{new Date(m.timestamp).toLocaleTimeString()}</td>
                <td>{m.type}</td>
                <td>{m.name}</td>
                <td>{m.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
