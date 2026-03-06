# @agora/conversational-ai-toolkit-react

React hooks for `@agora/conversational-ai-toolkit`. Bridges the `AgoraVoiceAI` singleton into React state and effects.

For RTC primitives (microphone tracks, camera tracks, remote users, volume levels), use `agora-rtc-react` directly — this package focuses exclusively on toolkit-specific concerns.

## Install

```bash
npm install @agora/conversational-ai-toolkit-react @agora/conversational-ai-toolkit agora-rtc-react
# agora-rtc-sdk-ng is a transitive peer dep — no separate install needed
```

## Quick Start

```tsx
import { useMemo, useState } from 'react';
import AgoraRTC, { AgoraRTCProvider } from 'agora-rtc-react';
import { useConversationalAI, useAgentState } from '@agora/conversational-ai-toolkit-react';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

function App() {
  return (
    <AgoraRTCProvider client={client}>
      <VoiceAI />
    </AgoraRTCProvider>
  );
}

function VoiceAI() {
  const config = useMemo(() => ({ channel: 'my-channel' }), []);
  const { transcript, agentState, isConnected, interrupt } = useConversationalAI(config);

  return (
    <div>
      <p>Agent: {agentState} | Connected: {String(isConnected)}</p>
      <button onClick={() => interrupt('AGENT_UID')}>Interrupt</button>
      <ul>
        {transcript.map((t) => <li key={t.uid}>{t.text}</li>)}
      </ul>
    </div>
  );
}

function StatusBar() {
  // Standalone hook — no lifecycle ownership needed
  const { agentState } = useAgentState();
  return <span>{agentState ?? 'idle'}</span>;
}
```

## Prerequisites

| Requirement | Version |
|-------------|---------|
| React | >= 18 |
| `agora-rtc-react` | >= 2.0.0 |
| `@agora/conversational-ai-toolkit` | >= 0.1.0 |

## API Reference

### `useConversationalAI(config)`

Flagship hook — initializes and manages the full `AgoraVoiceAI` lifecycle (init, subscribe, unsubscribe, destroy). Must be rendered inside an `AgoraRTCProvider`.

```typescript
const { transcript, agentState, isConnected, error, interrupt, sendMessage, metrics, messageReceipt } =
  useConversationalAI(config);
```

`config` extends `AgoraVoiceAIConfig` (omitting `rtcEngine`, which comes from the provider) and adds `channel: string`.

> **Important:** Only `rtcClient` and `config.channel` are in the effect dependency array. Wrap inline config objects in `useMemo` to avoid unnecessary re-subscribe cycles.

### `useTranscript()`

Subscribe to transcript updates from a pre-initialized `AgoraVoiceAI` instance. Use when you need transcript in a component that doesn't own the AI lifecycle.

```typescript
const transcript = useTranscript();
```

### `useAgentState()`

Subscribe to `AGENT_STATE_CHANGED` events. Returns the current agent state, full state-change event, and agent UID.

```typescript
const { agentState, stateEvent, agentUserId } = useAgentState();
// agentState: 'idle' | 'listening' | 'thinking' | 'speaking' | 'silent' | null
// stateEvent: { state, turnID, timestamp, reason } | null
```

### `useAgentError()`

Subscribe to both `AGENT_ERROR` and `MESSAGE_ERROR` events. Returns a discriminated union with `source: 'agent' | 'message'`.

```typescript
const { error, clearError } = useAgentError();
// error: { source: 'agent', agentUserId, error: ModuleError }
//      | { source: 'message', agentUserId, error: { type, code, message, timestamp } }
//      | null
```

Call `clearError()` to reset after dismissing an error (e.g. closing a toast).

### `useAgentMetrics()`

Subscribe to `AGENT_METRICS` events. Returns the latest metric and agent UID.

```typescript
const { metrics, agentUserId } = useAgentMetrics();
// metrics: { type: ModuleType, name: string, value: number, timestamp: number } | null
```

## Standalone hooks vs `useConversationalAI`

Both coexist. `useConversationalAI` is the batteries-included option — lifecycle + all events in one return. The standalone hooks (`useTranscript`, `useAgentState`, `useAgentError`, `useAgentMetrics`) are for granular use in components that don't own the lifecycle (e.g. a `<StatusBar>` that only needs agent state). If both are used in the same tree, the same event fires two handlers — this is expected.

```tsx
function StatusBar() {
  const { agentState } = useAgentState();
  const { error, clearError } = useAgentError();

  return (
    <div>
      <span>Agent: {agentState ?? 'idle'}</span>
      {error && (
        <span onClick={clearError}>
          Error: {error.error.message}
        </span>
      )}
    </div>
  );
}
```

## RTC primitives

For microphone/camera tracks, remote users, volume levels, and other RTC concerns, use `agora-rtc-react` directly:

- `useLocalMicrophoneTrack` — local mic
- `useLocalCameraTrack` — local camera
- `useRemoteUsers` — remote user list
- `useVolumeLevel` — audio volume (0-1)
- `useJoin`, `usePublish`, `useIsConnected` — connection management

See the [agora-rtc-react docs](https://github.com/AgoraIO-Extensions/agora-rtc-react) for full API reference.

## Core package

For vanilla JS / framework-agnostic usage, see [@agora/conversational-ai-toolkit](../conversational-ai/README.md).
