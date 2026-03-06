import { useState } from 'react';
import { useSession, type DebugLogEntry } from './SessionProvider';

const EVENT_COLORS: Record<string, string> = {
  AGENT_STATE_CHANGED: '#4caf50',
  AGENT_INTERRUPTED: '#ff9800',
  AGENT_METRICS: '#2196f3',
  AGENT_ERROR: '#f44336',
  TRANSCRIPT_UPDATED: '#9c27b0',
  DEBUG_LOG: '#607d8b',
  MESSAGE_RECEIPT_UPDATED: '#00bcd4',
  MESSAGE_ERROR: '#e91e63',
  MESSAGE_SAL_STATUS: '#795548',
};

function LogEntry({ entry }: { entry: DebugLogEntry }) {
  const color = EVENT_COLORS[entry.event] ?? '#666';
  return (
    <div className="pg-debug-entry">
      <span className="pg-debug-time">
        {new Date(entry.timestamp).toLocaleTimeString()}
      </span>
      <span className="pg-debug-event" style={{ color }}>
        {entry.event}
      </span>
      <pre className="pg-debug-data">
        {JSON.stringify(entry.data, null, 2)}
      </pre>
    </div>
  );
}

/**
 * Debug panel showing raw event log and SDK state snapshot.
 * Consumes debugLog + sdkState from SessionContext.
 * Collapsible, capped at 100 entries, with Clear button.
 */
export function DebugPanel() {
  const { debugLog, sdkState, clearDebugLog } = useSession();
  const [open, setOpen] = useState(false);

  return (
    <div className="pg-panel">
      <button
        className="pg-panel-toggle"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? '[-]' : '[+]'} Debug ({debugLog.length} events)
      </button>
      {open && (
        <div className="pg-debug-content">
          <div className="pg-debug-actions">
            <button onClick={clearDebugLog}>Clear</button>
          </div>

          {sdkState && (
            <div className="pg-debug-state">
              <strong>SDK State</strong>
              <pre>{JSON.stringify(sdkState, null, 2)}</pre>
            </div>
          )}

          <div className="pg-debug-log">
            {debugLog.length === 0 && (
              <div className="pg-debug-empty">No events yet</div>
            )}
            {debugLog.map((entry, i) => (
              <LogEntry key={i} entry={entry} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
