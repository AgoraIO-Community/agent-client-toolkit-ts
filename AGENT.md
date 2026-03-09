# AGENT.md

Reference for AI agents working in this repository.

## What this repo is

A pnpm monorepo containing:

- **`agora-agent-client-toolkit`** — framework-agnostic TypeScript SDK for Agora Conversational AI
- **`agora-agent-client-toolkit-react`** — React hooks wrapping the core SDK
- **`apps/demo`** — vanilla TS demo (Vite)
- **`apps/playground`** — interactive playground

## Commands

```bash
pnpm install                  # install all workspace deps
pnpm -r build                 # build all packages
pnpm --filter <name> build    # build one package
pnpm --filter <name> typecheck
```

## Source locations

| What | Where |
|------|-------|
| Core SDK source | `src/` |
| Core package config | `packages/conversational-ai/` |
| React hooks | `packages/react/src/` |
| Demo | `apps/demo/` |

> The tsup build for `agora-agent-client-toolkit` reads from `src/` (via `../../src` in `packages/conversational-ai/tsup.config.ts`). There is no source in `packages/conversational-ai/src/`.

## Public API surface

Exports from `agora-agent-client-toolkit`:

- `AgoraVoiceAI` — main singleton class (async `init()`)
- `AgoraVoiceAIConfig`, `RTMConfig` — config interfaces
- `AgoraVoiceAIEvents` — event name constants
- `CovSubRenderController` — transcript rendering controller
- `ChunkedMessageAssembler` — stream message assembly
- `IMetricsReporter`, `ConsoleMetricsReporter`, `AgoraMetricsReporter`
- All types and enums from `src/core/types.ts` and `src/core/events.ts`

Exports from `agora-agent-client-toolkit-react`:

- `useConversationalAI` — flagship lifecycle hook (init/destroy/subscribe + all events)
- `useTranscript` — standalone transcript observer
- `useAgentState` — standalone agent state observer
- `useAgentError` — standalone error observer (AGENT_ERROR + MESSAGE_ERROR)
- `useAgentMetrics` — standalone metrics observer

## Constraints

- **Do not modify `CovSubRenderController`** without explicit task scope. It is battle-tested rendering logic; bugs here are silent and hard to reproduce without real agent traffic.
- **RTM is optional** — never assume `rtmEngine` is present. Use `rtmConfig?.rtmEngine`.
- **`AgoraVoiceAI.init()` is async** — always `await`.
- **pnpm only** — no npm or yarn commands.
- **`jszip` and `@agora-js/report` are optional deps** — guard all usages.

## Key interfaces

```typescript
// Core config
interface AgoraVoiceAIConfig {
  rtcEngine: IAgoraRTCClient;       // required
  rtmConfig?: { rtmEngine: RTMClient }; // optional
  renderMode?: TranscriptHelperMode; // TEXT | WORD | AUTO
  enableLog?: boolean;
  enableAgoraMetrics?: boolean;
}
```

## Testing

```bash
pnpm --filter agora-agent-client-toolkit test        # run tests once
pnpm --filter agora-agent-client-toolkit test:watch  # watch mode
```

Test files live in `packages/conversational-ai/__tests__/`. Current coverage:
- `chunked.test.ts` — `ChunkedMessageAssembler` (10 cases)
- `lifecycle.test.ts` — `AgoraVoiceAI` singleton lifecycle (9 cases)

Functional validation against real agent traffic still requires Agora sandbox credentials.
