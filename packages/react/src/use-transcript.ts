import { useState, useEffect } from 'react';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  type TranscriptHelperItem,
  type UserTranscription,
  type AgentTranscription,
} from '@agora/conversational-ai-toolkit';
import { useAgoraVoiceAIInstance } from './context';

/**
 * Thin hook for consumers who already have an `AgoraVoiceAI` instance
 * (e.g. via `ConversationalAIProvider`) and want to observe transcript
 * state in a separate component.
 *
 * Binds `TRANSCRIPT_UPDATED` on mount and unbinds on unmount.
 * Returns an empty array if `AgoraVoiceAI` has not been initialized yet.
 *
 * When used inside a `ConversationalAIProvider`, connects instantly via
 * React context. When used without the provider, falls back to a single
 * `getInstance()` attempt (no polling).
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
  const contextAi = useAgoraVoiceAIInstance();
  const [fallbackAi, setFallbackAi] = useState<AgoraVoiceAI | null>(null);

  // Fallback: single getInstance() attempt for backward compat without provider
  useEffect(() => {
    if (contextAi || fallbackAi) return;
    try {
      setFallbackAi(AgoraVoiceAI.getInstance());
    } catch {
      // Not initialized and no provider — hook returns defaults
    }
  }, [contextAi, fallbackAi]);

  const ai = contextAi ?? fallbackAi;

  const [transcript, setTranscript] = useState<
    TranscriptHelperItem<Partial<UserTranscription | AgentTranscription>>[]
  >([]);

  useEffect(() => {
    if (!ai) return;

    ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, setTranscript);
    return () => {
      try { ai.off(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, setTranscript); } catch { /* destroyed */ }
    };
  }, [ai]);

  return transcript;
}
