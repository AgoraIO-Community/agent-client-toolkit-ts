# @agora/conversational-ai-toolkit-react

React hooks for `@agora/conversational-ai-toolkit`. Bridges the `AgoraVoiceAI` singleton into React state and effects.

For RTC primitives (microphone tracks, camera tracks, remote users, volume levels), use `agora-rtc-react` directly — this package focuses exclusively on toolkit-specific concerns.

## Install

```bash
npm install @agora/conversational-ai-toolkit-react @agora/conversational-ai-toolkit agora-rtc-react
# agora-rtc-sdk-ng is a transitive peer dep — no separate install needed
```

## Quick Start

Use `ConversationalAIProvider` to manage the AI lifecycle and give standalone hooks access via React context:

```tsx
import { useMemo } from 'react';
import AgoraRTC, { AgoraRTCProvider } from 'agora-rtc-react';
import {
  ConversationalAIProvider,
  useTranscript,
  useAgentState,
} from '@agora/conversational-ai-toolkit-react';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

function App() {
  const config = useMemo(() => ({ channel: 'my-channel' }), []);

  return (
    <AgoraRTCProvider client={client}>
      <ConversationalAIProvider config={config}>
        <TranscriptPanel />
        <StatusBar />
      </ConversationalAIProvider>
    </AgoraRTCProvider>
  );
}

function TranscriptPanel() {
  const transcript = useTranscript(); // connects via context — no polling
  return <ul>{transcript.map((t) => <li key={t.turn_id}>{t.text}</li>)}</ul>;
}

function StatusBar() {
  const { agentState } = useAgentState(); // connects via context
  return <span>{agentState ?? 'idle'}</span>;
}
```

Alternatively, use `useConversationalAI` directly for a batteries-included hook:

```tsx
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
```

## Prerequisites

| Requirement | Version |
|-------------|---------|
| React | >= 18 |
| `agora-rtc-react` | >= 2.0.0 |
| `@agora/conversational-ai-toolkit` | >= 0.1.0 |

## API Reference

### `ConversationalAIProvider`

Provider component that manages the `AgoraVoiceAI` lifecycle and exposes the AI instance via React context to standalone hooks. Use this when you have standalone hooks in child components.

```tsx
<AgoraRTCProvider client={rtcClient}>
  <ConversationalAIProvider config={{ channel: 'my-channel' }}>
    {/* standalone hooks connect instantly via context */}
    <TranscriptPanel />
    <StatusBar />
  </ConversationalAIProvider>
</AgoraRTCProvider>
```

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

**Recommended:** Use `ConversationalAIProvider` + standalone hooks when you have multiple components that each need a slice of AI state. The provider manages the lifecycle, and standalone hooks connect via React context — no polling, no timing issues.

**Alternative:** Use `useConversationalAI` directly when you only need AI state in one component. Standalone hooks can still work without the provider (they fall back to a single `getInstance()` attempt), but the provider is the recommended pattern for component trees.

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
