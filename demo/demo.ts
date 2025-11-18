/**
 * Demo: How to use agora-voice-ai package
 *
 * This demo demonstrates the complete workflow of using the agora-voice-ai package
 * to create a conversational AI application with real-time voice interactions.
 */

import AgoraRTC from 'agora-rtc-sdk-ng';
import AgoraRTM from 'agora-rtm';
import {
  AgoraVoiceAI,
  AgoraVoiceAIEvents,
  ChatMessageType,
  ChatMessagePriority,
  TranscriptHelperMode,
  AgentState,
} from 'agora-voice-ai';

// ========================================
// Configuration - Replace with your values
// ========================================
const CONFIG = {
  appId: 'YOUR_AGORA_APP_ID', // Get from Agora Console
  rtcToken: 'YOUR_RTC_TOKEN', // Generate from your backend or Agora Console
  rtmToken: 'YOUR_RTM_TOKEN', // Generate from your backend or Agora Console
  channelName: 'voice-ai-demo', // Your channel name
  userId: 'user_' + Math.floor(Math.random() * 10000), // Unique user ID
  agentUserId: '46307123', // The AI agent's user ID
};

// ========================================
// Step 1: Initialize RTC Client
// ========================================

/**
 * IMPORTANT: Enable audio PTS metadata BEFORE creating the RTC client
 * This is required for proper audio synchronization with transcriptions
 */
AgoraRTC.setParameter('ENABLE_AUDIO_PTS_METADATA', true);

// Create RTC client with appropriate codec
const rtcClient = AgoraRTC.createClient({
  mode: 'rtc',
  codec: 'vp8',
});

console.log('✓ RTC Client created');

// ========================================
// Step 2: Initialize RTM Client
// ========================================

const rtmClient = new AgoraRTM.RTM(CONFIG.appId, CONFIG.userId);

console.log('✓ RTM Client created');

// ========================================
// Step 3: Initialize AgoraVoiceAI
// ========================================

/**
 * Initialize the AgoraVoiceAI singleton with RTC and RTM clients
 *
 * Options:
 * - rtcEngine: Your RTC client instance
 * - rtmEngine: Your RTM client instance
 * - renderMode: How transcripts should be rendered (TEXT, WORD, CHUNK, or UNKNOWN)
 * - enableLog: Enable debug logging (useful for development)
 */
AgoraVoiceAI.init({
  rtcEngine: rtcClient,
  rtmEngine: rtmClient,
  renderMode: TranscriptHelperMode.TEXT,
  enableLog: true, // Enable logging for debugging
});

// Get the singleton instance
const voiceAI = AgoraVoiceAI.getInstance();

console.log('✓ AgoraVoiceAI initialized');

// ========================================
// Step 4: Register Event Listeners
// ========================================

/**
 * TRANSCRIPT_UPDATED Event
 *
 * Emitted whenever the conversation transcript is updated.
 * IMPORTANT: This returns the COMPLETE conversation list each time.
 * You should replace your entire UI conversation list, not append.
 */
voiceAI.on(AgoraVoiceAIEvents.TRANSCRIPT_UPDATED, (transcripts) => {
  console.log('📝 Transcript updated:', transcripts);

  // Example: Render the complete conversation
  transcripts.forEach((item) => {
    console.log(`  [${item.role}]: ${item.final || item.text || '...'}`);
  });

  // TODO: Update your UI with the complete conversation list
});

/**
 * AGENT_STATE_CHANGED Event
 *
 * Emitted when the AI agent's state changes.
 * States: idle, listening, thinking, speaking, silent
 */
voiceAI.on(AgoraVoiceAIEvents.AGENT_STATE_CHANGED, (agentUserId, event) => {
  console.log(`🤖 Agent ${agentUserId} state changed:`, event.state);

  // Example: Update UI based on agent state
  switch (event.state) {
    case AgentState.IDLE:
      console.log('  Agent is idle');
      break;
    case AgentState.LISTENING:
      console.log('  Agent is listening...');
      break;
    case AgentState.THINKING:
      console.log('  Agent is thinking...');
      break;
    case AgentState.SPEAKING:
      console.log('  Agent is speaking...');
      break;
    case AgentState.SILENT:
      console.log('  Agent is silent');
      break;
  }

  // TODO: Update your UI to show agent state
});

/**
 * AGENT_METRICS Event
 *
 * Emitted when agent performance metrics are received.
 * Useful for monitoring agent performance and quality.
 */
voiceAI.on(AgoraVoiceAIEvents.AGENT_METRICS, (agentUserId, metrics) => {
  console.log(`📊 Agent ${agentUserId} metrics:`, metrics);

  // TODO: Display metrics in your UI or send to analytics
});

/**
 * AGENT_ERROR Event
 *
 * Emitted when an error occurs with the agent.
 */
voiceAI.on(AgoraVoiceAIEvents.AGENT_ERROR, (agentUserId, error) => {
  console.error(`❌ Agent ${agentUserId} error:`, error);

  // TODO: Show error message to user
});

/**
 * AGENT_INTERRUPTED Event
 *
 * Emitted when the agent is interrupted (e.g., user speaks while agent is speaking).
 */
voiceAI.on(AgoraVoiceAIEvents.AGENT_INTERRUPTED, (agentUserId, event) => {
  console.log(`⏸️ Agent ${agentUserId} interrupted:`, event);

  // TODO: Update UI to show interruption
});

/**
 * MESSAGE_RECEIPT_UPDATED Event
 *
 * Emitted when a message receipt is received (message delivery confirmation).
 */
voiceAI.on(
  AgoraVoiceAIEvents.MESSAGE_RECEIPT_UPDATED,
  (agentUserId, receipt) => {
    console.log(`✅ Message receipt from ${agentUserId}:`, receipt);

    // TODO: Update message status in UI
  }
);

/**
 * MESSAGE_ERROR Event
 *
 * Emitted when a message fails to send.
 */
voiceAI.on(AgoraVoiceAIEvents.MESSAGE_ERROR, (agentUserId, error) => {
  console.error(`❌ Message error for ${agentUserId}:`, error);

  // TODO: Show error to user and allow retry
});

/**
 * DEBUG_LOG Event
 *
 * Emitted for debug logging when enableLog is true.
 */
voiceAI.on(AgoraVoiceAIEvents.DEBUG_LOG, (message) => {
  console.debug('🔍 Debug:', message);
});

console.log('✓ Event listeners registered');

// ========================================
// Step 5: Join RTC Channel and Login to RTM
// ========================================

async function setupConnection() {
  try {
    // Login to RTM first
    console.log('Logging in to RTM...');
    await rtmClient.login({ token: CONFIG.rtmToken });
    console.log('✓ RTM login successful');

    // Join RTC channel
    console.log('Joining RTC channel...');
    await rtcClient.join(
      CONFIG.appId,
      CONFIG.channelName,
      CONFIG.rtcToken,
      CONFIG.userId
    );
    console.log('✓ RTC channel joined');

    // Create and publish local audio track
    const localAudioTrack = await AgoraRTC.createMicrophoneAudioTrack();
    await rtcClient.publish([localAudioTrack]);
    console.log('✓ Local audio published');

    // Subscribe to agent's audio
    rtcClient.on('user-published', async (user, mediaType) => {
      if (mediaType === 'audio') {
        await rtcClient.subscribe(user, mediaType);
        user.audioTrack?.play();
        console.log(`✓ Subscribed to ${user.uid}'s audio`);
      }
    });
  } catch (error) {
    console.error('Connection setup failed:', error);
    throw error;
  }
}

// ========================================
// Step 6: Subscribe to Voice AI Messages
// ========================================

async function startVoiceAI() {
  try {
    // Subscribe to messages for this channel
    voiceAI.subscribeMessage(CONFIG.channelName);
    console.log('✓ Subscribed to voice AI messages');
  } catch (error) {
    console.error('Failed to start voice AI:', error);
    throw error;
  }
}

// ========================================
// Step 7: Send Messages to AI Agent
// ========================================

/**
 * Send a text message to the AI agent
 */
async function sendTextMessage(text: string) {
  try {
    console.log(`💬 Sending text: "${text}"`);

    await voiceAI.chat(CONFIG.agentUserId, {
      messageType: ChatMessageType.TEXT,
      text: text,
      priority: ChatMessagePriority.INTERRUPTED, // Interrupt current processing
      responseInterruptable: true, // Allow user to interrupt response
    });

    console.log('✓ Text message sent');
  } catch (error) {
    console.error('Failed to send text message:', error);
  }
}

/**
 * Send an image message to the AI agent
 */
async function sendImageMessage(imageUrl: string) {
  try {
    console.log(`🖼️ Sending image: ${imageUrl}`);

    await voiceAI.chat(CONFIG.agentUserId, {
      messageType: ChatMessageType.IMAGE,
      uuid: 'img_' + Date.now(), // Unique message ID
      url: imageUrl,
      // Alternative: use base64 instead of URL
      // base64: 'data:image/png;base64,...',
    });

    console.log('✓ Image message sent');
  } catch (error) {
    console.error('Failed to send image message:', error);
  }
}

/**
 * Interrupt the agent's current response
 */
async function interruptAgent() {
  try {
    console.log('⏸️ Interrupting agent...');

    await voiceAI.interrupt(CONFIG.agentUserId);

    console.log('✓ Interrupt sent');
  } catch (error) {
    console.error('Failed to interrupt agent:', error);
  }
}

// ========================================
// Step 8: Cleanup
// ========================================

async function cleanup() {
  try {
    console.log('Cleaning up...');

    // Unsubscribe from voice AI messages
    voiceAI.unsubscribe();
    console.log('✓ Unsubscribed from voice AI');

    // Leave RTC channel
    await rtcClient.leave();
    console.log('✓ Left RTC channel');

    // Logout from RTM
    await rtmClient.logout();
    console.log('✓ Logged out from RTM');

    // Destroy voice AI instance
    voiceAI.destroy();
    console.log('✓ Voice AI destroyed');

    console.log('✓ Cleanup complete');
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

// ========================================
// Main Demo Flow
// ========================================

async function main() {
  try {
    console.log('🚀 Starting Agora Voice AI Demo...\n');

    // Step 1-3: Already done (RTC, RTM, VoiceAI initialization)
    // Step 4: Already done (Event listeners)

    // Step 5: Setup connections
    await setupConnection();

    // Step 6: Start voice AI
    await startVoiceAI();

    console.log('\n✅ Demo setup complete!\n');
    console.log('You can now interact with the AI agent:');
    console.log('- Voice will be captured automatically');
    console.log('- Or use sendTextMessage() to send text');
    console.log('- Or use sendImageMessage() to send images');
    console.log('- Or use interruptAgent() to interrupt the agent\n');

    // Example: Send a text message after 2 seconds
    setTimeout(() => {
      sendTextMessage('Hello! Can you introduce yourself?');
    }, 2000);

    // Example: Send another message after 10 seconds
    setTimeout(() => {
      sendTextMessage('What can you help me with?');
    }, 10000);

    // Example: Interrupt agent after 15 seconds (if still speaking)
    setTimeout(() => {
      interruptAgent();
    }, 15000);

    // Example: Send an image after 20 seconds
    setTimeout(() => {
      sendImageMessage('https://example.com/sample-image.jpg');
    }, 20000);

    // Cleanup after 30 seconds (in a real app, this would be triggered by user action)
    setTimeout(async () => {
      await cleanup();
      console.log('\n👋 Demo ended');
    }, 30000);
  } catch (error) {
    console.error('❌ Demo failed:', error);
    await cleanup();
  }
}

// ========================================
// Export functions for use in other contexts
// ========================================

export { main, sendTextMessage, sendImageMessage, interruptAgent, cleanup };

// ========================================
// Run demo if executed directly
// ========================================

// Uncomment to run automatically:
// main();

// Or call main() from your application when ready
