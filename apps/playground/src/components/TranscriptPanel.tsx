import { useEffect, useRef } from 'react';
import { useTranscript } from '@agora/agent-client-toolkit-react';
import { MessageType, TurnStatus } from '@agora/agent-client-toolkit';

const STATUS_LABELS: Record<number, string> = {
  [TurnStatus.IN_PROGRESS]: 'IN_PROGRESS',
  [TurnStatus.END]: 'END',
  [TurnStatus.INTERRUPTED]: 'INTERRUPTED',
};

/**
 * Renders the conversation transcript using useTranscript() hook.
 * User messages are left-aligned, agent messages right-aligned.
 * Auto-scrolls to the bottom on new messages.
 */
export function TranscriptPanel() {
  const transcript = useTranscript();
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  if (transcript.length === 0) {
    return <div className="pg-transcript pg-transcript-empty">Waiting for conversation...</div>;
  }

  return (
    <div className="pg-transcript">
      {transcript.map((item, i) => {
        const isAgent = item.metadata?.object === MessageType.AGENT_TRANSCRIPTION;
        return (
          <div
            key={`${item.turn_id}-${item.stream_id}-${i}`}
            className={`pg-bubble ${isAgent ? 'pg-bubble-agent' : 'pg-bubble-user'}`}
          >
            <div className="pg-bubble-meta">
              <span className="pg-bubble-uid">{item.uid}</span>
              <span className="pg-bubble-status">{STATUS_LABELS[item.status] ?? item.status}</span>
            </div>
            <div className="pg-bubble-text">{item.text || '...'}</div>
          </div>
        );
      })}
      <div ref={bottomRef} />
    </div>
  );
}
