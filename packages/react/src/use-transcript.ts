import { useState, useEffect } from 'react';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  type TranscriptHelperItem,
  type UserTranscription,
  type AgentTranscription,
} from '@agora/conversational-ai-toolkit';

/**
 * Thin hook for consumers who already have an `AgoraVoiceAI` instance
 * (e.g. via `useConversationalAI`) and want to observe transcript state
 * in a separate component.
 *
 * Binds `TRANSCRIPT_UPDATED` on mount and unbinds on unmount.
 * Returns an empty array if `AgoraVoiceAI` has not been initialized yet.
 *
 * @example
 * function TranscriptPanel() {
 *   const transcript = useTranscript();
 *   return <ul>{transcript.map(item => <li key={item.uid}>{...}</li>)}</ul>;
 * }
 */
export function useTranscript(): TranscriptHelperItem<
  Partial<UserTranscription | AgentTranscription>
>[] {
  const [transcript, setTranscript] = useState<
    TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>[]
  >([]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let retryTimer: ReturnType<typeof setTimeout> | undefined;

    const tryConnect = () => {
      try {
        const ai = AgoraVoiceAI.getInstance();
        ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, setTranscript);
        cleanup = () => {
          try { ai.off(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, setTranscript); } catch { /* destroyed */ }
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

  return transcript;
}
