# Agora Voice AI

A TypeScript/JavaScript library for building conversational AI applications with real-time voice interactions using Agora RTC and RTM services.

[![npm version](https://img.shields.io/npm/v/agora-voice-ai.svg)](https://www.npmjs.com/package/agora-voice-ai)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- 🎤 Real-time voice communication with AI agents
- 📝 Automatic transcription of user and agent speech
- 🔄 State management for AI agent interactions
- 📊 Agent performance metrics
- 🎯 Event-driven architecture
- 💬 Support for text and image messages
- ⚡ Optimized for low-latency interactions

## Installation

```bash
npm install agora-voice-ai
```

## Prerequisites

This library requires:

- Agora RTC SDK (agora-rtc-sdk-ng) version **4.23.4 or above**
- Agora RTM SDK (agora-rtm) version **2.0.0 or above**

Install peer dependencies:

```bash
npm install agora-rtc-sdk-ng agora-rtm
```

⚠️ **Important:** Before using this library, you must enable the "Real-time Messaging RTM" feature in the [Agora Console](https://console.agora.io/).

## Demo

📚 **Want to see a complete working example?**

Check out the [demo](./demo) directory for a comprehensive example that demonstrates all features of the agora-voice-ai package, including:

- Complete initialization workflow
- Event handling for all event types
- Sending text and image messages
- Interrupting the agent
- Proper cleanup and resource management

See [demo/README.md](./demo/README.md) for setup instructions and how to run the demo.

## Quick Start

### 1. Import the Library

**ES Modules:**

```typescript
import { AgoraVoiceAI, AgoraVoiceAIEvents } from 'agora-voice-ai';
```

**CommonJS:**

```javascript
const { AgoraVoiceAI, AgoraVoiceAIEvents } = require('agora-voice-ai');
```

### 2. Set Audio Parameters (Required)

Before creating an RTC client, enable audio PTS metadata:

```typescript
import AgoraRTC from 'agora-rtc-sdk-ng';

AgoraRTC.setParameter('ENABLE_AUDIO_PTS_METADATA', true);

const rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
```

### 3. Initialize the API

```typescript
import { AgoraVoiceAI } from 'agora-voice-ai';

// Initialize with your RTC and RTM instances
AgoraVoiceAI.init({
  rtcEngine: rtcClient,
  rtmEngine: rtmClient,
  // Optional: manually specify render mode
  // renderMode: TranscriptHelperMode.TEXT,
  enableLog: true, // Enable debug logging
});
```

### 4. Get the Singleton Instance

```typescript
const voiceAI = AgoraVoiceAI.getInstance();
```

### 5. Register Event Listeners

```typescript
// Listen for transcription updates
voiceAI.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (transcripts) => {
  console.log('Transcription updated:', transcripts);
  // Render the complete conversation list in your UI
});

// Listen for agent state changes
voiceAI.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, (agentUserId, event) => {
  console.log(`Agent ${agentUserId} is now ${event.state}`);
});

// Listen for agent metrics
voiceAI.on(AgoraVoiceAIEvents.AGENT_METRICS, (agentUserId, metrics) => {
  console.log('Agent metrics:', metrics);
});

// Listen for errors
voiceAI.on(AgoraVoiceAIEvents.AGENT_ERROR, (agentUserId, error) => {
  console.error('Agent error:', error);
});

// Listen for agent interruptions
voiceAI.on(AgoraVoiceAIEvents.AGENT_INTERRUPTED, (agentUserId, event) => {
  console.log('Agent interrupted:', event);
});

// Listen for message receipts
voiceAI.on(
  AgoraVoiceAIEvents.MESSAGE_RECEIPT_UPDATED,
  (agentUserId, receipt) => {
    console.log('Message receipt:', receipt);
  }
);

// Listen for message errors
voiceAI.on(AgoraVoiceAIEvents.MESSAGE_ERROR, (agentUserId, error) => {
  console.error('Message error:', error);
});

// Listen for debug logs (if enableLog is true)
voiceAI.on(AgoraVoiceAIEvents.DEBUG_LOG, (message) => {
  console.debug('Debug:', message);
});
```

### 6. Subscribe to Channel Messages

Call this before starting the session:

```typescript
voiceAI.subscribeMessage(channelName);
```

### 7. Send Messages to AI Agent

**Send text message:**

```typescript
await voiceAI.chat(agentUserId, {
  messageType: ChatMessageType.TEXT,
  text: 'Hello, how can you help me today?',
  priority: ChatMessagePriority.INTERRUPTED,
  responseInterruptable: true,
});
```

**Send image message:**

```typescript
await voiceAI.chat(agentUserId, {
  messageType: ChatMessageType.IMAGE,
  uuid: 'unique-message-id',
  url: 'https://example.com/image.jpg',
  // or use base64: base64: "data:image/png;base64,..."
});
```

### 8. Interrupt Agent (Optional)

```typescript
await voiceAI.interrupt(agentUserId);
```

### 9. Cleanup

When leaving the channel or ending the session:

```typescript
// Unsubscribe from messages
voiceAI.unsubscribe();

// Destroy the instance
voiceAI.destroy();
```

## API Reference

### AgoraVoiceAI

The main class for managing conversational AI interactions.

#### Static Methods

- `AgoraVoiceAI.init(config: AgoraVoiceAIConfig): AgoraVoiceAI` - Initialize the singleton instance
- `AgoraVoiceAI.getInstance(): AgoraVoiceAI` - Get the singleton instance

#### Instance Methods

- `subscribeMessage(channel: string): void` - Subscribe to channel messages
- `unsubscribe(): void` - Unsubscribe from channel messages
- `chat(agentUserId: string, message: IChatMessageText | IChatMessageImage): Promise<void>` - Send a message to the AI agent
- `interrupt(agentUserId: string): Promise<void>` - Interrupt the agent's current response
- `destroy(): void` - Clean up and destroy the instance
- `on(event: string, callback: Function): this` - Subscribe to an event
- `off(event: string, callback: Function): this` - Unsubscribe from an event

### Configuration Interface

```typescript
interface AgoraVoiceAIConfig {
  rtcEngine: IAgoraRTCClient;
  rtmEngine: RTMClient;
  renderMode?: TranscriptHelperMode;
  enableLog?: boolean;
}
```

### Events

All events are defined in `AgoraVoiceAIEvents`:

- `TRANSCRIPT_UPDATED` - Emitted when transcription is updated (returns complete conversation list)
- `AGENT_STATE_CHANGED` - Emitted when agent state changes (idle, listening, thinking, speaking, silent)
- `AGENT_INTERRUPTED` - Emitted when agent is interrupted
- `AGENT_METRICS` - Emitted when agent performance metrics are received
- `AGENT_ERROR` - Emitted when an error occurs
- `DEBUG_LOG` - Emitted for debug logging (when enableLog is true)
- `MESSAGE_RECEIPT_UPDATED` - Emitted when message receipt is updated
- `MESSAGE_ERROR` - Emitted when a message error occurs

### Agent States

```typescript
enum AgentState {
  IDLE = 'idle',
  LISTENING = 'listening',
  THINKING = 'thinking',
  SPEAKING = 'speaking',
  SILENT = 'silent',
}
```

### Chat Message Types

```typescript
enum ChatMessageType {
  TEXT = 'text',
  IMAGE = 'image',
}

enum ChatMessagePriority {
  INTERRUPTED = 'interrupted', // Interrupt current processing
  APPEND = 'append', // Add to queue
  IGNORE = 'ignore', // Discard message
}
```

## Important Notes

### Lifecycle Management

> **You are responsible for managing the initialization, lifecycle, and login status of RTC and RTM.**

- Ensure RTC and RTM instances have a lifecycle greater than this component
- Before using this component, ensure RTC is available and RTM is logged in
- Always call `destroy()` when cleaning up to prevent memory leaks

### Transcription Updates

> **All TRANSCRIPT_UPDATED events return the complete conversation list.**

Each update may modify recent conversation items. Always render the UI based on the complete list returned in the event, not by appending individual items.

### RTC Settings

The `ENABLE_AUDIO_PTS_METADATA` parameter must be set **before creating each RTC client** to ensure PTS (Presentation Time Stamp) information can be received properly:

```typescript
AgoraRTC.setParameter('ENABLE_AUDIO_PTS_METADATA', true);
const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
```

## TypeScript Support

This library is written in TypeScript and includes type definitions. All types, interfaces, and enums are exported for use in your TypeScript projects.

```typescript
import type {
  AgoraVoiceAIConfig,
  AgoraVoiceAIEvents,
  AgentState,
  TranscriptHelperItem,
  AgentMetric,
  ModuleError,
} from 'agora-voice-ai';
```

## Browser Support

This library supports all modern browsers that are compatible with Agora RTC SDK:

- Chrome 58+
- Firefox 56+
- Safari 11+
- Edge 80+

## License

MIT

## Support

For issues and questions:

- [GitHub Issues](https://github.com/your-repo/agora-voice-ai/issues)
- [Agora Documentation](https://docs.agora.io/)
- [Agora Developer Community](https://www.agora.io/en/community/)
