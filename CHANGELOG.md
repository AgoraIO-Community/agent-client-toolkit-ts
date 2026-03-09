# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [0.1.0] — 2026-03-04

Initial public release.

### @agora/agent-client-toolkit

- `AgoraVoiceAI` singleton with async `init()` — **breaking change** from pre-release versions (init was previously synchronous)
- Event system: `TRANSCRIPT_UPDATED`, `AGENT_STATE_CHANGED`, `AGENT_ERROR`, `AGENT_METRICS`, `AGENT_INTERRUPTED`, `MESSAGE_ERROR`, `MESSAGE_RECEIPT_UPDATED`, `MESSAGE_SAL_STATUS`, `DEBUG_LOG`
- RTC-only mode — RTM is optional; methods requiring RTM (`sendText`, `sendImage`, `interrupt`) throw `RTMRequiredError`
- `CovSubRenderController` with TEXT, WORD, and AUTO rendering modes
- `ChunkedMessageAssembler` for stream message reassembly with input validation and cache size limits
- Structured error classes: `ConversationalAIError`, `NotInitializedError`, `RTMRequiredError`
- Optional Agora metrics via `enableAgoraMetrics: true` (requires `@agora-js/report`)
- Zero required runtime dependencies

### @agora/agent-client-toolkit-react

- `useConversationalAI` — flagship lifecycle hook (init, subscribe, destroy)
- `useTranscript` — standalone transcript observer
- `useAgentState` — standalone agent state observer
- `useAgentError` — standalone error observer (AGENT_ERROR + MESSAGE_ERROR)
- `useAgentMetrics` — standalone metrics observer
