# Agora Conversational AI Toolkit

Monorepo for building real-time conversational AI experiences with Agora RTC — framework-agnostic core plus React hooks.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`@agora/conversational-ai-toolkit`](./packages/conversational-ai/README.md) | 0.1.0 | Core SDK — vanilla JS / TypeScript |
| [`@agora/conversational-ai-toolkit-react`](./packages/react/README.md) | 0.1.0 | React hooks |

## Quick links

- [Core package README](./packages/conversational-ai/README.md) — install, Quick Start, config reference, events
- [React package README](./packages/react/README.md) — hooks API, Quick Start
- [Demo app](./apps/demo/README.md) — run the vanilla TS demo locally

## Repository layout

```
.
├── packages/
│   ├── conversational-ai/   # @agora/conversational-ai-toolkit
│   └── react/               # @agora/conversational-ai-toolkit-react
├── apps/
│   ├── demo/                # Vanilla TS demo (Vite)
│   └── playground/          # Interactive playground
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Getting started

### Install

```bash
# Core only (vanilla JS / Node)
npm install @agora/conversational-ai-toolkit agora-rtc-sdk-ng

# React
npm install @agora/conversational-ai-toolkit-react @agora/conversational-ai-toolkit agora-rtc-react
```

### Minimal example (core)

```typescript
import AgoraRTC from 'agora-rtc-sdk-ng';
import { AgoraVoiceAI, AgoraVoiceAIEvents } from '@agora/conversational-ai-toolkit';

const rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

const ai = await AgoraVoiceAI.init({
  rtcEngine: rtcClient,
});

ai.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (transcript) => {
  console.log(transcript);
});

// Join the channel and publish audio via the RTC client directly
await rtcClient.join('APP_ID', 'CHANNEL', 'TOKEN', null);
const micTrack = await AgoraRTC.createMicrophoneAudioTrack();
await rtcClient.publish([micTrack]);

// Start receiving AI messages
await ai.subscribeMessage('CHANNEL');
```

### Minimal example (React)

```tsx
import AgoraRTC, { AgoraRTCProvider } from 'agora-rtc-react';
import { useConversationalAI } from '@agora/conversational-ai-toolkit-react';

const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });

function App() {
  return (
    <AgoraRTCProvider client={client}>
      <VoiceAI />
    </AgoraRTCProvider>
  );
}

function VoiceAI() {
  const { transcript, agentState } = useConversationalAI({
    channel: 'my-channel',
  });
  return <pre>{JSON.stringify(transcript, null, 2)}</pre>;
}
```

## RTC-only mode (no RTM)

RTM is optional. If you only need transcripts and agent state from the RTC stream, omit `rtmConfig` entirely:

```typescript
const ai = await AgoraVoiceAI.init({
  rtcEngine: rtcClient,
  // no rtmConfig
});
```

The following methods require RTM and will throw if called without it:

| Method | Error |
|--------|-------|
| `sendText(agentUserId, message)` | `[AgoraVoiceAI] This method requires RTM. Pass rtmConfig: { rtmEngine } when calling AgoraVoiceAI.init().` |
| `sendImage(agentUserId, message)` | same |
| `interrupt(agentUserId)` | same |

Everything else — transcript events, agent state, metrics — works in RTC-only mode.

## Development

This repo uses [pnpm workspaces](https://pnpm.io/workspaces).

```bash
# Install all dependencies
pnpm install

# Build all packages
pnpm -r build

# Run the demo
pnpm --filter @agora/conversational-ai-demo dev
```

## License

MIT
