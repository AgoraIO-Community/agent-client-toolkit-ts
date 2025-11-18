# Agora Voice AI Demo

This demo demonstrates how to use the `agora-voice-ai` package to build a conversational AI application with real-time voice interactions.

## 📋 Prerequisites

Before running this demo, make sure you have:

1. **Node.js** (version 14 or higher)
2. **An Agora Account** - Sign up at [Agora Console](https://console.agora.io/)
3. **Agora App ID** - Create a project in Agora Console
4. **RTM Enabled** - Enable "Real-time Messaging RTM" in your Agora project
5. **RTC and RTM Tokens** - Generate tokens for your application (or use App ID for testing)
6. **AI Agent Setup** - You need an AI agent service configured to work with Agora Voice AI

## 🚀 Quick Start

### 1. Install Dependencies

From the root of the project:

```bash
npm install
```

Or if you're using this demo standalone:

```bash
npm install agora-voice-ai agora-rtc-sdk-ng agora-rtm
```

### 2. Configure the Demo

Edit `demo.ts` and update the configuration section with your values:

```typescript
const CONFIG = {
  appId: 'YOUR_AGORA_APP_ID', // Get from Agora Console
  rtcToken: 'YOUR_RTC_TOKEN', // Generate from your backend or Agora Console
  rtmToken: 'YOUR_RTM_TOKEN', // Generate from your backend or Agora Console
  channelName: 'voice-ai-demo', // Your channel name
  userId: 'user_' + Math.floor(Math.random() * 10000), // Unique user ID
  agentUserId: 'agent_123', // The AI agent's user ID
};
```

#### Getting Tokens

**For Development/Testing:**

- You can use temporary tokens generated from the [Agora Console](https://console.agora.io/)
- Or use App ID only (less secure, not recommended for production)

**For Production:**

- Implement a token server following [Agora's Token Guide](https://docs.agora.io/en/video-calling/develop/authentication-workflow)
- Your backend should generate tokens for each user session

### 3. Run the Demo

There are several ways to run this demo:

#### Option A: Node.js (Recommended for Testing)

```bash
# Compile TypeScript
npx tsc demo/demo.ts --outDir demo/dist --module es2020 --target es2020 --moduleResolution node --esModuleInterop

# Run with Node.js
node demo/dist/demo.js
```

Note: You may need to add `"type": "module"` to your package.json or use a CommonJS build.

#### Option B: Bundler (Vite, Webpack, etc.)

**Using Vite:**

1. Install Vite:

```bash
npm install -D vite
```

2. Create a simple `vite.config.js` if needed:

```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: './demo',
  build: {
    outDir: 'dist',
  },
});
```

3. Run:

```bash
npx vite demo
```

**Using Webpack or other bundlers:**

- Configure your bundler to handle TypeScript
- Set entry point to `demo/demo.ts`
- Build and run

#### Option C: Browser with HTML

1. Compile the TypeScript:

```bash
npx tsc demo/demo.ts --outDir demo/dist --module es2020 --target es2020
```

2. Update `index.html` to import the compiled JavaScript

3. Serve the HTML file:

```bash
npx http-server demo
```

4. Open in browser: `http://localhost:8080`

## 📚 What This Demo Covers

### Initialization

- Setting up RTC client with audio PTS metadata
- Creating and configuring RTM client
- Initializing AgoraVoiceAI singleton

### Event Handling

- `TRANSCRIPT_UPDATED` - Receiving conversation transcripts
- `AGENT_STATE_CHANGED` - Monitoring agent states (idle, listening, thinking, speaking)
- `AGENT_METRICS` - Agent performance metrics
- `AGENT_ERROR` - Error handling
- `AGENT_INTERRUPTED` - Handling interruptions
- `MESSAGE_RECEIPT_UPDATED` - Message delivery confirmations
- `MESSAGE_ERROR` - Message sending errors
- `DEBUG_LOG` - Debug logging

### Messaging

- Sending text messages to the AI agent
- Sending image messages (URL or base64)
- Message priority levels
- Interruptible responses

### Lifecycle Management

- Joining RTC channels
- RTM login
- Audio track publishing
- Subscribing to remote audio
- Proper cleanup and resource disposal

## 🎯 Key Concepts

### Agent States

The AI agent can be in one of these states:

- **idle**: Agent is ready but not actively processing
- **listening**: Agent is listening to user input
- **thinking**: Agent is processing and formulating a response
- **speaking**: Agent is speaking/responding
- **silent**: Agent is silent (e.g., after interruption)

### Message Priority

When sending messages, you can specify priority:

- **INTERRUPTED**: Interrupts current processing (immediate)
- **APPEND**: Adds to queue (processed in order)
- **IGNORE**: Discards if agent is busy

### Transcription Updates

**Important:** The `TRANSCRIPT_UPDATED` event returns the **complete conversation list** each time. Don't append to your UI - replace the entire conversation with the new list, as recent items may have been updated or modified.

## 🔧 Troubleshooting

### "AgoraVoiceAI is not initialized" Error

Make sure you:

1. Call `AgoraVoiceAI.init()` before using `getInstance()`
2. Initialize RTC and RTM clients before initializing AgoraVoiceAI

### Audio Not Working

1. Check that `ENABLE_AUDIO_PTS_METADATA` is set **before** creating the RTC client:

```typescript
AgoraRTC.setParameter('ENABLE_AUDIO_PTS_METADATA', true);
const rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
```

2. Ensure you have microphone permissions in the browser
3. Check that audio tracks are properly published and subscribed

### RTM Connection Failed

1. Verify RTM is enabled in your Agora Console
2. Check that your RTM token is valid
3. Ensure the user ID doesn't conflict with other users

### Agent Not Responding

1. Verify the agent user ID is correct
2. Check that the agent service is running and connected
3. Monitor the debug logs for errors
4. Ensure the channel name matches between your app and agent

### Token Expired

Tokens have expiration times. Implement token refresh in production:

- Monitor for token expiration events
- Request new tokens from your backend
- Renew tokens before expiry

## 📖 Additional Resources

- [Agora Voice AI Package Documentation](../README.md)
- [Agora RTC SDK Documentation](https://docs.agora.io/en/video-calling/overview/product-overview)
- [Agora RTM SDK Documentation](https://docs.agora.io/en/signaling/overview/product-overview)
- [Agora Console](https://console.agora.io/)
- [Agora Developer Community](https://www.agora.io/en/community/)

## 🤝 Need Help?

- Check the main [README](../README.md) for API reference
- Review the code comments in `demo.ts` for detailed explanations
- Visit [Agora Developer Community](https://www.agora.io/en/community/)
- Report issues on GitHub

## 📝 License

This demo is part of the agora-voice-ai package and follows the same MIT license.
