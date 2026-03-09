import { useAgentState } from '@agora/conversational-ai-toolkit-react';
import { AgentState } from '@agora/conversational-ai-toolkit';
import { useSession } from './SessionProvider';

const STATE_COLORS: Record<string, string> = {
  [AgentState.IDLE]: '#888',
  [AgentState.LISTENING]: '#4caf50',
  [AgentState.THINKING]: '#ff9800',
  [AgentState.SPEAKING]: '#2196f3',
  [AgentState.SILENT]: '#9e9e9e',
};

/**
 * Displays current agent state with a colored indicator dot.
 * Uses useAgentState() hook in an isolated component for scoped re-renders.
 */
export function StatusBar() {
  const { agentState, stateEvent, agentUserId } = useAgentState();
  const { credentials, isConnected } = useSession();

  const label = agentState ?? 'connecting...';
  const color = agentState ? (STATE_COLORS[agentState] ?? '#888') : '#888';

  return (
    <div className="pg-status-bar">
      <span className="pg-status-dot" style={{ backgroundColor: color }} />
      <span className="pg-status-label">{label}</span>
      {isConnected && (
        <span className="pg-status-info">
          Agent: {agentUserId ?? credentials.agentUserId}
          {stateEvent ? ` | Turn: ${stateEvent.turnID}` : ''}
        </span>
      )}
    </div>
  );
}
