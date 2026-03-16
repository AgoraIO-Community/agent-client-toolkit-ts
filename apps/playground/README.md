# Conversational AI Playground

Interactive React playground for `agora-agent-client-toolkit-react`. Demonstrates all 5 React hooks in a realistic component tree with feature parity to the vanilla `demo.ts`.

## Setup

```bash
# From the workspace root
pnpm install
pnpm -r build              # build dependencies first

# Copy and fill in credentials
cp apps/playground/.env.example apps/playground/.env.local

# Start dev server
pnpm --filter agora-conversational-ai-playground dev
```

Open `http://localhost:3000`. Fill in credentials via the config form or `.env.local`.

## Architecture

Two-phase flow:
1. **Config phase** — `ConfigForm` collects Agora credentials (persisted to localStorage)
2. **Session phase** — `AgoraRTCProvider` wraps the session; RTC join + audio publish + RTM login happen automatically

### Component Tree

```
App
 └─ ErrorBoundary
     ├─ [Phase 1] → ConfigForm
     └─ [Phase 2] → AgoraRTCProvider
         └─ SessionProvider (useConversationalAI)
              ├─ Header
              │    ├─ StatusBar (useAgentState)
              │    └─ DisconnectButton
              ├─ TranscriptPanel (useTranscript)
              ├─ ChatInput (text + image + interrupt)
              ├─ MetricsPanel (useAgentMetrics), collapsible
              ├─ ErrorToast (useAgentError)
              └─ DebugPanel (raw event log + getState())
```

### Hook → Component Mapping

| Hook | Component | Purpose |
|------|-----------|---------|
| `useConversationalAI` | SessionProvider | Full lifecycle management, exposes controls via context |
| `useTranscript` | TranscriptPanel | Listener-only hook in a child (no prop drilling) |
| `useAgentState` | StatusBar | State-only display, scoped re-renders |
| `useAgentError` | ErrorToast | Discriminated union handling + clearError() |
| `useAgentMetrics` | MetricsPanel | Latency data in isolated component |

## Features Demonstrated

- All 9 SDK event types visible in the debug panel
- Text messaging via `sendMessage` (hook)
- Image messaging via `chat()` (escape hatch for features not exposed by hooks)
- Agent interruption
- `useMemo` config stability (no dev warnings)
- Error boundary with reset
- RTC-only mode (RTM token empty → text/image/interrupt disabled with explanation)
- `getState()` polling for SDK state snapshot
- Proper cleanup on disconnect

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_AGORA_APP_ID` | Yes | Agora App ID |
| `VITE_AGORA_RTC_TOKEN` | No | RTC token (empty for no-auth testing) |
| `VITE_AGORA_RTM_TOKEN` | No | RTM token (empty for RTC-only mode) |
| `VITE_AGORA_CHANNEL` | Yes | Channel name |
| `VITE_AGORA_USER_ID` | No | Your user ID (auto-generated if empty) |
| `VITE_AGORA_AGENT_USER_ID` | No | Agent UID to send messages to |

## Relationship to Other Packages

| Package | Role |
|---------|------|
| `agora-agent-client-toolkit` | Core SDK — singleton, events, transcript rendering |
| `agora-agent-client-toolkit-react` | React hooks wrapping the core SDK |
| `agora-conversational-ai-playground` | **This app** — consumes both packages for development |
| `agora-conversational-ai-demo` | Minimal vanilla TS demo (no React) |
