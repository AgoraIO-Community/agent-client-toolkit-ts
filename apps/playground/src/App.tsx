import { useState, useCallback, useRef } from 'react';
import AgoraRTC, { type IAgoraRTCClient } from 'agora-rtc-sdk-ng';
import AgoraRTM, { type RTMClient } from 'agora-rtm';
import { AgoraRTCProvider } from 'agora-rtc-react';
import { ErrorBoundary } from './ErrorBoundary';
import { ConfigForm, type Credentials } from './components/ConfigForm';
import { SessionProvider } from './components/SessionProvider';

// AgoraRTC.setParameter is a private API not exposed in types — cast required
const setAgoraParameter = (
  AgoraRTC as unknown as { setParameter: (key: string, value: boolean) => void }
).setParameter;

/**
 * Root app component. Two-phase flow:
 * - Phase 1: ConfigForm collects credentials
 * - Phase 2: AgoraRTCProvider wraps SessionProvider for the active session
 */
export function App() {
  const [credentials, setCredentials] = useState<Credentials | null>(null);
  const rtcClientRef = useRef<IAgoraRTCClient | null>(null);
  const rtmClientRef = useRef<RTMClient | null>(null);

  const handleConnect = useCallback((creds: Credentials) => {
    setAgoraParameter('ENABLE_AUDIO_PTS_METADATA', true);
    const rtcClient = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
    rtcClientRef.current = rtcClient;

    if (creds.rtmToken) {
      rtmClientRef.current = new AgoraRTM.RTM(creds.appId, creds.userId);
    }

    setCredentials(creds);
  }, []);

  const handleDisconnect = useCallback(() => {
    rtcClientRef.current = null;
    rtmClientRef.current = null;
    setCredentials(null);
  }, []);

  // Cast needed: agora-rtc-react re-exports its own IAgoraRTCClient type
  // which is structurally identical but nominally different from agora-rtc-sdk-ng's
  const rtcClient = rtcClientRef.current as Parameters<typeof AgoraRTCProvider>[0]['client'] | null;

  return (
    <ErrorBoundary>
      <div className="pg-app">
        <h1 className="pg-title">Conversational AI Playground</h1>
        {!credentials || !rtcClient ? (
          <ConfigForm onConnect={handleConnect} />
        ) : (
          <AgoraRTCProvider client={rtcClient}>
            <SessionProvider
              credentials={credentials}
              rtcClient={rtcClientRef.current!}
              rtmClient={rtmClientRef.current}
              onDisconnect={handleDisconnect}
            />
          </AgoraRTCProvider>
        )}
      </div>
    </ErrorBoundary>
  );
}
