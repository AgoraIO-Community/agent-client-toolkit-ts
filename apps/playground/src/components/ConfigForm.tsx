import { useState, type FormEvent } from 'react';
import { TranscriptHelperMode } from 'agent-client-toolkit-ts';

export interface Credentials {
  appId: string;
  rtcToken: string;
  rtmToken: string;
  channelName: string;
  userId: string;
  agentUserId: string;
  renderMode: TranscriptHelperMode;
  enableLog: boolean;
}

const STORAGE_KEY = 'pg-credentials';

function loadDefaults(): Credentials {
  const stored = localStorage.getItem(STORAGE_KEY);
  const saved: Partial<Credentials> = stored ? JSON.parse(stored) : {};
  return {
    appId: import.meta.env.VITE_AGORA_APP_ID ?? saved.appId ?? '',
    rtcToken: import.meta.env.VITE_AGORA_RTC_TOKEN ?? saved.rtcToken ?? '',
    rtmToken: import.meta.env.VITE_AGORA_RTM_TOKEN ?? saved.rtmToken ?? '',
    channelName: import.meta.env.VITE_AGORA_CHANNEL ?? saved.channelName ?? '',
    userId:
      import.meta.env.VITE_AGORA_USER_ID ??
      saved.userId ??
      'user_' + Math.floor(Math.random() * 10000),
    agentUserId: import.meta.env.VITE_AGORA_AGENT_USER_ID ?? saved.agentUserId ?? '',
    renderMode: saved.renderMode ?? TranscriptHelperMode.TEXT,
    enableLog: saved.enableLog ?? true,
  };
}

interface Props {
  onConnect: (credentials: Credentials) => void;
}

/**
 * Configuration form for entering Agora credentials before connecting.
 * Reads from env vars, falls back to localStorage, then empty defaults.
 * Persists values to localStorage on submit.
 */
export function ConfigForm({ onConnect }: Props) {
  const [form, setForm] = useState<Credentials>(loadDefaults);

  const update = (key: keyof Credentials, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const randomizeUserId = () => update('userId', 'user_' + Math.floor(Math.random() * 100000));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.appId.trim() || !form.channelName.trim()) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(form));
    onConnect(form);
  };

  const isValid = form.appId.trim() && form.channelName.trim();

  return (
    <form className="pg-config-form" onSubmit={handleSubmit}>
      <label>
        App ID *
        <input
          value={form.appId}
          onChange={(e) => update('appId', e.target.value)}
          placeholder="Your Agora App ID"
          required
        />
      </label>

      <label>
        RTC Token
        <input
          value={form.rtcToken}
          onChange={(e) => update('rtcToken', e.target.value)}
          placeholder="RTC token (or empty for no-auth)"
        />
      </label>

      <label>
        RTM Token
        <input
          value={form.rtmToken}
          onChange={(e) => update('rtmToken', e.target.value)}
          placeholder="Leave empty for RTC-only mode"
        />
        <small>Leave empty for RTC-only (text/image/interrupt disabled)</small>
      </label>

      <label>
        Channel Name *
        <input
          value={form.channelName}
          onChange={(e) => update('channelName', e.target.value)}
          placeholder="Channel name"
          required
        />
      </label>

      <label>
        User ID
        <div className="pg-input-row">
          <input
            value={form.userId}
            onChange={(e) => update('userId', e.target.value)}
            placeholder="Your user ID"
          />
          <button type="button" onClick={randomizeUserId}>
            Random
          </button>
        </div>
      </label>

      <label>
        Agent User ID
        <input
          value={form.agentUserId}
          onChange={(e) => update('agentUserId', e.target.value)}
          placeholder="Agent UID (e.g. 46307123)"
        />
      </label>

      <label>
        Render Mode
        <select
          value={form.renderMode}
          onChange={(e) => update('renderMode', e.target.value as TranscriptHelperMode)}
        >
          <option value={TranscriptHelperMode.TEXT}>Text</option>
          <option value={TranscriptHelperMode.WORD}>Word</option>
          <option value={TranscriptHelperMode.CHUNK}>Chunk</option>
          <option value={TranscriptHelperMode.AUTO}>Auto</option>
        </select>
      </label>

      <label className="pg-checkbox">
        <input
          type="checkbox"
          checked={form.enableLog}
          onChange={(e) => update('enableLog', e.target.checked)}
        />
        Enable SDK logging
      </label>

      <button type="submit" disabled={!isValid}>
        Connect
      </button>
    </form>
  );
}
