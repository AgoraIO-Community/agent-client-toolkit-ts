import { useAgentError } from 'agent-client-toolkit-react';

/**
 * Displays the latest error from useAgentError() as a dismissible toast.
 * Shows discriminated union source badge ("Agent Error" / "Message Error").
 * Hidden when no error is present.
 */
export function ErrorToast() {
  const { error, clearError } = useAgentError();

  if (!error) return null;

  const badge = error.source === 'agent' ? 'Agent Error' : 'Message Error';

  return (
    <div className="pg-toast">
      <span className="pg-toast-badge">{badge}</span>
      <span className="pg-toast-message">
        [{error.error.code}] {error.error.message}
      </span>
      <button className="pg-toast-dismiss" onClick={clearError}>
        Dismiss
      </button>
    </div>
  );
}
