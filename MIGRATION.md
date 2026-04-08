# Migration Guide

Use this file for all version-to-version upgrade steps.

## Version index

- [1.1.x -> 1.2.0](#11x---120)

---

## 1.1.x -> 1.2.0

### TL;DR

1. Upgrade packages:

```bash
pnpm add agora-agent-client-toolkit@^1.2.0
pnpm add agora-agent-client-toolkit-react@^1.2.0
```

2. Remove old `as unknown as` init casts.
3. Keep passing your normal Agora RTC/RTM clients directly.
4. Ensure local Node.js is `20+`.

### What changed

- `rtcEngine` and `rtmEngine` now use toolkit-owned structural interfaces (`RTCEngine`, `RTMEngine`).
- `AgoraVoiceAI.init()` accepts compatible engine shapes without peer-path type coupling.
- Development-time validation now checks required engine methods and fails fast for invalid wrappers/mocks.

### Update examples

Before (`1.1.x`):

```ts
import type { IAgoraRTCClient, RTMConfig } from 'agora-agent-client-toolkit';

await AgoraVoiceAI.init({
  rtcEngine: rtcClient as unknown as IAgoraRTCClient,
  rtmConfig: {
    rtmEngine: rtmClient as unknown as RTMConfig['rtmEngine'],
  },
});
```

After (`1.2.0`):

```ts
await AgoraVoiceAI.init({
  rtcEngine: rtcClient,
  rtmConfig: { rtmEngine: rtmClient },
});
```

### RTC-only mode

No change. RTM remains optional:

```ts
await AgoraVoiceAI.init({ rtcEngine: rtcClient });
```

`sendText`, `sendImage`, and `interrupt` still require RTM and throw `RTMRequiredError` when `rtmConfig` is omitted.

### If you use custom wrappers/mocks

Required methods:

- RTC: `on`, `off`
- RTM: `publish`, `addEventListener`, `removeEventListener`

### Post-upgrade checks

```bash
pnpm --filter agora-agent-client-toolkit typecheck
pnpm --filter agora-agent-client-toolkit-react typecheck
pnpm test
```
