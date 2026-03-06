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
    let ai: AgoraVoiceAI;
    try {
      ai = AgoraVoiceAI.getInstance();
    } catch {
      // AgoraVoiceAI not yet initialized — transcript stays empty.
      return;
    }

    ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, setTranscript);
    return () => {
      ai.off(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, setTranscript);
    };
  }, []);

  return transcript;
}
