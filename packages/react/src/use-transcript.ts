import { useState, useEffect } from 'react';
import {
  AgoraVoiceAIEvents,
  type TranscriptHelperItem,
  type UserTranscription,
  type AgentTranscription,
} from '@agora/agent-client-toolkit';
import { useAgoraVoiceAIInstance } from './context';

/**
 * Subscribe to transcript updates from the nearest `ConversationalAIProvider`.
 *
 * Must be rendered inside a `ConversationalAIProvider`. Returns an empty
 * array until the provider's `AgoraVoiceAI` instance is initialized.
 *
 * @example
 * function TranscriptPanel() {
 *   const transcript = useTranscript();
 *   return <ul>{transcript.map(item => <li key={item.uid}>{item.text}</li>)}</ul>;
 * }
 */
export function useTranscript(): TranscriptHelperItem<
  Partial<UserTranscription | AgentTranscription>
>[] {
  const ai = useAgoraVoiceAIInstance();

  const [transcript, setTranscript] = useState<
    TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>[]
  >([]);

  useEffect(() => {
    if (!ai) return;

    ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, setTranscript);
    return () => {
      try {
        ai.off(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, setTranscript);
      } catch {
        /* destroyed */
      }
    };
  }, [ai]);

  return transcript;
}
