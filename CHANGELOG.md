# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/).

## [v1.2.0] — 2026-04-06

### agora-agent-client-toolkit

#### Changed
- TypeScript public config contracts now use toolkit-owned structural interfaces: `RTCEngine` and `RTMEngine`
- `AgoraVoiceAI.init()` now accepts compatible RTC/RTM client objects without requiring `as unknown as` casts in strict package-manager layouts
- Public type surface no longer depends on `agora-rtm` event/class types (`RTMClient`, `RTMEvents`) for config and transcript event payload typing

#### Added
- Interop type-check fixture: `packages/conversational-ai/__typetests__/interop.ts` with `typecheck:interop` script

### agora-agent-client-toolkit-react

#### Changed
- Removed internal `rtcEngine` cast workaround when passing `useRTCClient()` into `AgoraVoiceAI.init()`

## [v1.1.0] — 2026-03-17

### agora-agent-client-toolkit

#### Fixed
- `ChunkedMessageAssembler`: explicitly reject `rawPartIdx < 1` before normalization — a zero value from the wire (invalid for 1-based format) previously passed through silently as chunk index 0, causing incorrect message assembly
- `ChunkedMessageAssembler`: simplified `part_idx` normalization to `rawPartIdx - 1` now that the `< 1` guard makes the conditional expression redundant
- `CovSubRenderController`: fix uid resolution in `handleTextMessage` and `_handleTranscriptChunk` — uid is now determined by `message.object === MessageType.USER_TRANSCRIPTION` rather than `stream_id` presence, preventing agent transcriptions from being attributed to the wrong uid
- `SubRenderPTS.setPts()`: allow PTS to reset to `0` on stream restart — previous `pts !== 0` guard blocked this, causing word rendering to freeze after reconnection

### agora-agent-client-toolkit-react

#### Fixed
- `context.ts`: updated context exports to correctly reflect renamed core package imports

### Docs

- `README.md`: updated install instructions to use `pnpm add` and removed pre-release note
- `AGENT.md`: added full test file inventory for core and React packages with commands for both
- `CLAUDE.md`: added Test section with commands, added `AGENT_ERROR` vs `MESSAGE_ERROR` routing table
- `CHANGELOG.md`: retroactively corrected v0.1.0 → v1.0.0 for initial release

---

## [v1.0.0] — 2026-03-11

Initial public release.

### agora-agent-client-toolkit

- `AgoraVoiceAI` singleton with async `init()`
- Event system: `TRANSCRIPT_UPDATED`, `AGENT_STATE_CHANGED`, `AGENT_ERROR`, `AGENT_METRICS`, `AGENT_INTERRUPTED`, `MESSAGE_ERROR`, `MESSAGE_RECEIPT_UPDATED`, `MESSAGE_SAL_STATUS`, `DEBUG_LOG`
- RTC-only mode — RTM is optional; methods requiring RTM (`sendText`, `sendImage`, `interrupt`) throw `RTMRequiredError`
- `CovSubRenderController` with TEXT, WORD, and AUTO rendering modes
- `ChunkedMessageAssembler` for stream message reassembly with input validation and cache size limits
- Structured error classes: `ConversationalAIError`, `NotInitializedError`, `RTMRequiredError`
- Optional Agora metrics via `enableAgoraMetrics: true` (requires `@agora-js/report`)
- Zero required runtime dependencies

### agora-agent-client-toolkit-react

- `useConversationalAI` — flagship lifecycle hook (init, subscribe, destroy)
- `useTranscript` — standalone transcript observer
- `useAgentState` — standalone agent state observer
- `useAgentError` — standalone error observer (AGENT_ERROR + MESSAGE_ERROR)
- `useAgentMetrics` — standalone metrics observer
