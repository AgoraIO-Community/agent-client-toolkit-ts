# Agora Conversational AI Toolkit

A client-side toolkit for adding Agora Conversational AI features to applications already using the Agora RTC SDK. Runs in the browser alongside your existing RTC integration — adds transcript rendering, agent state tracking, and RTM-based messaging controls on top of `agora-rtc-sdk-ng`. Framework-agnostic core with optional React hooks.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Install

> **Not yet published to npm.** Install directly from GitHub:
>
> ```bash
> git clone https://github.com/AgoraIO-Conversational-AI/agent-client-toolkit-ts
> cd agora-agent-client-toolkit && pnpm install && pnpm build
> ```

Once published:

```bash
# Vanilla JS / TypeScript
npm install agora-agent-client-toolkit

# React
npm install agora-agent-client-toolkit-react
```

## Quick Start

### Vanilla JS

```typescript
import AgoraRTC from 'agora-rtc-sdk-ng';
import RTMClient from 'agora-rtm';
import { AgoraVoiceAI, AgoraVoiceAIEvents } from 'agora-agent-client-toolkit';

// --- Your existing Agora RTC + RTM setup ---
const rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
const rtmClient = new RTMClient('APP_ID', 'USER_ID');

await rtmClient.login({ token: 'RTM_TOKEN' });
await rtcClient.join('APP_ID', 'CHANNEL', 'RTC_TOKEN', null);
const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
await rtcClient.publish([micTrack]);

// Subscribe to remote audio (agent playback)
rtcClient.on('user-published', async (user, mediaType) => {
  if (mediaType === 'audio') {
    await rtcClient.subscribe(user, 'audio');
    user.audioTrack?.play();
  }
});

// --- Add Conversational AI features ---
const ai = await AgoraVoiceAI.init({
  rtcEngine: rtcClient,
  rtmConfig: { rtmEngine: rtmClient },
});

ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (transcript) => {
  console.log(transcript); // full conversation history, replace don't append
});

ai.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, (_agentUserId, event) => {
  console.log(event.state); // 'idle' | 'listening' | 'thinking' | 'speaking'
});

ai.subscribeMessage('CHANNEL');

// Send a message or interrupt the agent (requires RTM)
await ai.sendText('AGENT_UID', { messageType: ChatMessageType.TEXT, text: 'Hello' });
await ai.interrupt('AGENT_UID');
```

### React

```tsx
import { useMemo } from 'react';
import AgoraRTC, {
  AgoraRTCProvider,
  useJoin,
  useLocalMicrophoneTrack,
  usePublish,
} from 'agora-rtc-react';
import RTMClient from 'agora-rtm';
import {
  ConversationalAIProvider,
  useTranscript,
  useAgentState,
} from 'agora-agent-client-toolkit-react';

const rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
const rtmClient = new RTMClient('APP_ID', 'USER_ID');
await rtmClient.login({ token: 'RTM_TOKEN' });

function App() {
  const config = useMemo(
    () => ({
      channel: 'my-channel',
      rtmConfig: { rtmEngine: rtmClient },
    }),
    []
  );

  return (
    // AgoraRTCProvider and ConversationalAIProvider layer on top of each other
    <AgoraRTCProvider client={rtcClient}>
      <ConversationalAIProvider config={config}>
        <VoiceSession />
      </ConversationalAIProvider>
    </AgoraRTCProvider>
  );
}

function VoiceSession() {
  // Agora RTC hooks — join, mic, publish (your existing integration)
  useJoin({ appid: 'APP_ID', channel: 'my-channel', token: 'RTC_TOKEN' });
  const { localMicrophoneTrack } = useLocalMicrophoneTrack();
  usePublish([localMicrophoneTrack]);

  // Conversational AI hooks — transcript, state, errors added on top
  const transcript = useTranscript();
  const { agentState } = useAgentState();

  return (
    <div>
      <p>Agent: {agentState ?? 'idle'}</p>
      <ul>
        {transcript.map((t) => (
          <li key={t.turn_id}>{t.text}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Packages

| Package                                                                      | Version | Description                        |
| ---------------------------------------------------------------------------- | ------- | ---------------------------------- |
| [`agora-agent-client-toolkit`](./packages/conversational-ai/README.md) | 0.1.0   | Core SDK — vanilla JS / TypeScript |
| [`agora-agent-client-toolkit-react`](./packages/react/README.md)       | 0.1.0   | React hooks                        |

Full API reference, configuration options, and events are in each package's README.

## RTC-only mode (no RTM)

RTM is optional. Transcripts and agent state work without it — just omit `rtmConfig`:

```typescript
const ai = await AgoraVoiceAI.init({ rtcEngine: rtcClient });
```

Three methods require RTM and throw if called without it: `sendText`, `sendImage`, and `interrupt`.

## Repository layout

```
.
├── packages/
│   ├── conversational-ai/   # agora-agent-client-toolkit
│   └── react/               # agora-agent-client-toolkit-react
├── apps/
│   ├── demo/                # Vanilla TS demo (Vite)
│   └── playground/          # Interactive React playground
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Development

This repo uses [pnpm workspaces](https://pnpm.io/workspaces).

```bash
pnpm install          # install all dependencies
pnpm -r build         # build all packages
pnpm test             # run all tests

# Run the demo apps
pnpm --filter @agora/conversational-ai-demo dev
pnpm --filter @agora/conversational-ai-playground dev
```

## License

MIT
