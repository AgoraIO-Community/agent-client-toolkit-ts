import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranscript } from '../src/use-transcript';
import { useAgentState } from '../src/use-agent-state';
import { useAgentError } from '../src/use-agent-error';
import { useAgentMetrics } from '../src/use-agent-metrics';

// We mock AgoraVoiceAI at the module level to control getInstance() behavior
// and emit events in tests without real SDK dependencies.
const mockOn = vi.fn();
const mockOff = vi.fn();
const mockGetInstance = vi.fn();

vi.mock('@agora/conversational-ai-toolkit', () => ({
  AgoraVoiceAI: {
    getInstance: (...args: unknown[]) => mockGetInstance(...args),
  },
  AgoraVoiceAIEvents: {
    TRANSCRIPT_UPDATED: 'transcript-updated',
    AGENT_STATE_CHANGED: 'agent-state-changed',
    AGENT_ERROR: 'agent-error',
    AGENT_METRICS: 'agent-metrics',
    MESSAGE_ERROR: 'message-error',
  },
}));

describe('Standalone hooks', () => {
  // Track event handlers registered via mockOn so we can invoke them in tests
  const eventHandlers = new Map<string, Function[]>();

  beforeEach(() => {
    eventHandlers.clear();
    mockOn.mockImplementation((event: string, handler: Function) => {
      if (!eventHandlers.has(event)) eventHandlers.set(event, []);
      eventHandlers.get(event)!.push(handler);
    });
    mockOff.mockImplementation((event: string, handler: Function) => {
      const handlers = eventHandlers.get(event);
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx !== -1) handlers.splice(idx, 1);
      }
    });
    mockGetInstance.mockReturnValue({ on: mockOn, off: mockOff });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function emitEvent(event: string, ...args: unknown[]) {
    const handlers = eventHandlers.get(event) ?? [];
    for (const handler of handlers) {
      handler(...args);
    }
  }

  // --- useTranscript ---
  describe('useTranscript', () => {
    it('returns empty array when singleton not initialized', () => {
      mockGetInstance.mockImplementation(() => { throw new Error('Not initialized'); });
      const { result } = renderHook(() => useTranscript());
      expect(result.current).toEqual([]);
    });

    it('returns transcript after TRANSCRIPT_UPDATED fires', () => {
      const { result } = renderHook(() => useTranscript());
      const transcriptData = [{ uid: 'u1', text: 'hello', turn_id: 1 }];
      act(() => emitEvent('transcript-updated', transcriptData));
      expect(result.current).toEqual(transcriptData);
    });

    it('unsubscribes on unmount', () => {
      const { unmount } = renderHook(() => useTranscript());
      unmount();
      expect(mockOff).toHaveBeenCalledWith('transcript-updated', expect.any(Function));
    });
  });

  // --- useAgentState ---
  describe('useAgentState', () => {
    it('returns nulls when singleton not initialized', () => {
      mockGetInstance.mockImplementation(() => { throw new Error('Not initialized'); });
      const { result } = renderHook(() => useAgentState());
      expect(result.current.agentState).toBeNull();
      expect(result.current.stateEvent).toBeNull();
      expect(result.current.agentUserId).toBeNull();
    });

    it('returns state after AGENT_STATE_CHANGED fires', () => {
      const { result } = renderHook(() => useAgentState());
      const stateEvent = { state: 'speaking', turnID: 1, timestamp: 123, reason: 'test' };
      act(() => emitEvent('agent-state-changed', 'agent-uid', stateEvent));
      expect(result.current.agentState).toBe('speaking');
      expect(result.current.stateEvent).toEqual(stateEvent);
      expect(result.current.agentUserId).toBe('agent-uid');
    });

    it('returns full stateEvent and agentUserId', () => {
      const { result } = renderHook(() => useAgentState());
      const stateEvent = { state: 'listening', turnID: 2, timestamp: 456, reason: 'user-spoke' };
      act(() => emitEvent('agent-state-changed', 'agent-42', stateEvent));
      expect(result.current.stateEvent?.turnID).toBe(2);
      expect(result.current.stateEvent?.reason).toBe('user-spoke');
      expect(result.current.agentUserId).toBe('agent-42');
    });
  });

  // --- useAgentError ---
  describe('useAgentError', () => {
    it('returns null when no error', () => {
      const { result } = renderHook(() => useAgentError());
      expect(result.current.error).toBeNull();
    });

    it('returns agent error with source: agent', () => {
      const { result } = renderHook(() => useAgentError());
      const agentError = { type: 'llm', code: 500, message: 'LLM failed', timestamp: 123 };
      act(() => emitEvent('agent-error', 'agent-uid', agentError));
      expect(result.current.error).toEqual({
        source: 'agent',
        agentUserId: 'agent-uid',
        error: agentError,
      });
    });

    it('returns message error with source: message', () => {
      const { result } = renderHook(() => useAgentError());
      const msgError = { type: 'text', code: 400, message: 'Delivery failed', timestamp: 456 };
      act(() => emitEvent('message-error', 'agent-uid', msgError));
      expect(result.current.error).toEqual({
        source: 'message',
        agentUserId: 'agent-uid',
        error: msgError,
      });
    });

    it('clearError() resets to null', () => {
      const { result } = renderHook(() => useAgentError());
      const agentError = { type: 'tts', code: 503, message: 'TTS timeout', timestamp: 789 };
      act(() => emitEvent('agent-error', 'agent-uid', agentError));
      expect(result.current.error).not.toBeNull();
      act(() => result.current.clearError());
      expect(result.current.error).toBeNull();
    });
  });

  // --- useAgentMetrics ---
  describe('useAgentMetrics', () => {
    it('returns null metrics initially', () => {
      const { result } = renderHook(() => useAgentMetrics());
      expect(result.current.metrics).toBeNull();
      expect(result.current.agentUserId).toBeNull();
    });

    it('returns metrics after AGENT_METRICS fires', () => {
      const { result } = renderHook(() => useAgentMetrics());
      const metric = { type: 'llm', name: 'latency', value: 150, timestamp: 123 };
      act(() => emitEvent('agent-metrics', 'agent-uid', metric));
      expect(result.current.metrics).toEqual(metric);
      expect(result.current.agentUserId).toBe('agent-uid');
    });

    it('unsubscribes on unmount', () => {
      const { unmount } = renderHook(() => useAgentMetrics());
      unmount();
      expect(mockOff).toHaveBeenCalledWith('agent-metrics', expect.any(Function));
    });
  });
});
