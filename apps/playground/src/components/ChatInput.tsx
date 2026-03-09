import { useState, type FormEvent } from 'react';
import { AgoraVoiceAI, ChatMessageType, RTMRequiredError } from '@agora/conversational-ai-toolkit';
import { useSession } from './SessionProvider';

/**
 * Chat input for sending text messages, image URLs, and interrupts.
 * Demonstrates sendMessage from the hook and chat() escape hatch for images.
 * All actions disabled with explanation when RTM is not configured.
 */
export function ChatInput() {
  const { sendMessage, interrupt, credentials, hasRtm } = useSession();
  const [text, setText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSendText = async (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setError(null);
    try {
      await sendMessage(credentials.agentUserId, text.trim());
      setText('');
    } catch (err) {
      if (err instanceof RTMRequiredError) {
        setError('RTM is required to send text messages');
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  };

  const handleSendImage = async () => {
    if (!imageUrl.trim()) return;
    setError(null);
    try {
      const ai = AgoraVoiceAI.getInstance();
      await ai.chat(credentials.agentUserId, {
        messageType: ChatMessageType.IMAGE,
        uuid: 'img_' + Date.now(),
        url: imageUrl.trim(),
      });
      setImageUrl('');
    } catch (err) {
      if (err instanceof RTMRequiredError) {
        setError('RTM is required to send images');
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  };

  const handleInterrupt = async () => {
    setError(null);
    try {
      await interrupt(credentials.agentUserId);
    } catch (err) {
      if (err instanceof RTMRequiredError) {
        setError('RTM is required to interrupt');
      } else {
        setError(err instanceof Error ? err.message : String(err));
      }
    }
  };

  return (
    <div className="pg-chat-input">
      {!hasRtm && (
        <div className="pg-chat-disabled">
          RTM not configured — text, image, and interrupt are disabled.
        </div>
      )}

      <form onSubmit={handleSendText} className="pg-input-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Send a text message..."
          disabled={!hasRtm}
        />
        <button type="submit" disabled={!hasRtm || !text.trim()}>
          Send
        </button>
      </form>

      <div className="pg-input-row">
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="Image URL..."
          disabled={!hasRtm}
        />
        <button type="button" onClick={handleSendImage} disabled={!hasRtm || !imageUrl.trim()}>
          Send Image
        </button>
      </div>

      <button
        type="button"
        className="pg-interrupt-btn"
        onClick={handleInterrupt}
        disabled={!hasRtm}
      >
        Interrupt Agent
      </button>

      {error && <div className="pg-chat-error">{error}</div>}
    </div>
  );
}
