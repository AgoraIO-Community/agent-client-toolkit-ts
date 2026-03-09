import { createContext, useContext } from 'react';
import type { AgoraVoiceAI } from '@agora/agent-client-toolkit';

export const AgoraVoiceAIContext = createContext<AgoraVoiceAI | null>(null);

/**
 * Returns the AgoraVoiceAI instance from the nearest provider,
 * or null if useConversationalAI hasn't initialized yet.
 *
 * Internal — not exported from the package index.
 */
export function useAgoraVoiceAIInstance(): AgoraVoiceAI | null {
  return useContext(AgoraVoiceAIContext);
}
