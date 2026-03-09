import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTranscript } from '../src/use-transcript';
import { useAgentState } from '../src/use-agent-state';
import { useAgentError } from '../src/use-agent-error';
import { useAgentMetrics } from '../src/use-agent-metrics';
import { AgoraVoiceAIContext } from '../src/context';

vi.mock('@agora/agent-client-toolkit', () => ({
  AgoraVoiceAIEvents: {
    TRANSCRIPT_UPDATED: 'transcript-updated',
    AGENT_STATE_CHANGED: 'agent-state-changed',
    AGENT_ERROR: 'agent-error',
    AGENT_METRICS: 'agent-metrics',
    MESSAGE_ERROR: 'message-error',
  },
}));

/** Create a mock AI instance with on/off tracking and emit helper */
function createMockAi() {
  const handlers = new Map<string, Function[]>();
  const on = vi.fn((event: string, handler: Function) => {
    if (!handlers.has(event)) handlers.set(event, []);
    handlers.get(event)!.push(handler);
  });
  const off = vi.fn((event: string, handler: Function) => {
    const list = handlers.get(event);
    if (list) {
      const idx = list.indexOf(handler);
      if (idx !== -1) list.splice(idx, 1);
    }
  });
  const emit = (event: string, ...args: unknown[]) => {
    for (const handler of handlers.get(event) ?? []) {
      handler(...args);
    }
  };
  return { on, off, emit, handlers };
}

/** Render a hook inside the AgoraVoiceAIContext provider */
function renderWithProvider<T>(hook: () => T, ai: { on: unknown; off: unknown }) {
  return renderHook(hook, {
    wrapper: ({ children }: { children: React.ReactNode }) =>
      React.createElement(AgoraVoiceAIContext.Provider, { value: ai as any }, children),
  });
}

describe('Standalone hooks', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  // --- useTranscript ---
  describe('useTranscript', () => {
    it('subscribes to TRANSCRIPT_UPDATED via context', () => {
      const mock = createMockAi();
      const { result } = renderWithProvider(() => useTranscript(), mock);

      expect(mock.on).toHaveBeenCalledWith('transcript-updated', expect.any(Function));
      expect(result.current).toEqual([]);
    });

    it('returns transcript after event fires', () => {
      const mock = createMockAi();
      const { result } = renderWithProvider(() => useTranscript(), mock);

      const data = [{ uid: 'u1', text: 'hello', turn_id: 1 }];
      act(() => mock.emit('transcript-updated', data));
      expect(result.current).toEqual(data);
    });

    it('unsubscribes on unmount', () => {
      const mock = createMockAi();
      const { unmount } = renderWithProvider(() => useTranscript(), mock);

      unmount();
      expect(mock.off).toHaveBeenCalledWith('transcript-updated', expect.any(Function));
    });

    it('returns empty array without provider', () => {
      const { result } = renderHook(() => useTranscript());
      expect(result.current).toEqual([]);
    });
  });

  // --- useAgentState ---
  describe('useAgentState', () => {
    it('subscribes to AGENT_STATE_CHANGED via context', () => {
      const mock = createMockAi();
      const { result } = renderWithProvider(() => useAgentState(), mock);

      expect(mock.on).toHaveBeenCalledWith('agent-state-changed', expect.any(Function));
      expect(result.current.agentState).toBeNull();
      expect(result.current.stateEvent).toBeNull();
      expect(result.current.agentUserId).toBeNull();
    });

    it('returns state after event fires', () => {
      const mock = createMockAi();
      const { result } = renderWithProvider(() => useAgentState(), mock);

      const stateEvent = { state: 'speaking', turnID: 1, timestamp: 123, reason: 'test' };
      act(() => mock.emit('agent-state-changed', 'agent-uid', stateEvent));
      expect(result.current.agentState).toBe('speaking');
      expect(result.current.stateEvent).toEqual(stateEvent);
      expect(result.current.agentUserId).toBe('agent-uid');
    });

    it('returns full stateEvent and agentUserId', () => {
      const mock = createMockAi();
      const { result } = renderWithProvider(() => useAgentState(), mock);

      const stateEvent = { state: 'listening', turnID: 2, timestamp: 456, reason: 'user-spoke' };
      act(() => mock.emit('agent-state-changed', 'agent-42', stateEvent));
      expect(result.current.stateEvent?.turnID).toBe(2);
      expect(result.current.stateEvent?.reason).toBe('user-spoke');
      expect(result.current.agentUserId).toBe('agent-42');
    });

    it('unsubscribes on unmount', () => {
      const mock = createMockAi();
      const { unmount } = renderWithProvider(() => useAgentState(), mock);

      unmount();
      expect(mock.off).toHaveBeenCalledWith('agent-state-changed', expect.any(Function));
    });

    it('returns nulls without provider', () => {
      const { result } = renderHook(() => useAgentState());
      expect(result.current.agentState).toBeNull();
      expect(result.current.stateEvent).toBeNull();
      expect(result.current.agentUserId).toBeNull();
    });
  });

  // --- useAgentError ---
  describe('useAgentError', () => {
    it('returns null when no error', () => {
      const mock = createMockAi();
      const { result } = renderWithProvider(() => useAgentError(), mock);

      expect(result.current.error).toBeNull();
    });

    it('returns agent error with source: agent', () => {
      const mock = createMockAi();
      const { result } = renderWithProvider(() => useAgentError(), mock);

      const agentError = { type: 'llm', code: 500, message: 'LLM failed', timestamp: 123 };
      act(() => mock.emit('agent-error', 'agent-uid', agentError));
      expect(result.current.error).toEqual({
        source: 'agent',
        agentUserId: 'agent-uid',
        error: agentError,
      });
    });

    it('returns message error with source: message', () => {
      const mock = createMockAi();
      const { result } = renderWithProvider(() => useAgentError(), mock);

      const msgError = { type: 'text', code: 400, message: 'Delivery failed', timestamp: 456 };
      act(() => mock.emit('message-error', 'agent-uid', msgError));
      expect(result.current.error).toEqual({
        source: 'message',
        agentUserId: 'agent-uid',
        error: msgError,
      });
    });

    it('clearError() resets to null', () => {
      const mock = createMockAi();
      const { result } = renderWithProvider(() => useAgentError(), mock);

      const agentError = { type: 'tts', code: 503, message: 'TTS timeout', timestamp: 789 };
      act(() => mock.emit('agent-error', 'agent-uid', agentError));
      expect(result.current.error).not.toBeNull();
      act(() => result.current.clearError());
      expect(result.current.error).toBeNull();
    });

    it('subscribes to both AGENT_ERROR and MESSAGE_ERROR', () => {
      const mock = createMockAi();
      renderWithProvider(() => useAgentError(), mock);

      expect(mock.on).toHaveBeenCalledWith('agent-error', expect.any(Function));
      expect(mock.on).toHaveBeenCalledWith('message-error', expect.any(Function));
    });

    it('unsubscribes on unmount', () => {
      const mock = createMockAi();
      const { unmount } = renderWithProvider(() => useAgentError(), mock);

      unmount();
      expect(mock.off).toHaveBeenCalledWith('agent-error', expect.any(Function));
      expect(mock.off).toHaveBeenCalledWith('message-error', expect.any(Function));
    });

    it('returns null without provider', () => {
      const { result } = renderHook(() => useAgentError());
      expect(result.current.error).toBeNull();
    });
  });

  // --- useAgentMetrics ---
  describe('useAgentMetrics', () => {
    it('returns null metrics initially', () => {
      const mock = createMockAi();
      const { result } = renderWithProvider(() => useAgentMetrics(), mock);

      expect(result.current.metrics).toBeNull();
      expect(result.current.agentUserId).toBeNull();
    });

    it('returns metrics after AGENT_METRICS fires', () => {
      const mock = createMockAi();
      const { result } = renderWithProvider(() => useAgentMetrics(), mock);

      const metric = { type: 'llm', name: 'latency', value: 150, timestamp: 123 };
      act(() => mock.emit('agent-metrics', 'agent-uid', metric));
      expect(result.current.metrics).toEqual(metric);
      expect(result.current.agentUserId).toBe('agent-uid');
    });

    it('unsubscribes on unmount', () => {
      const mock = createMockAi();
      const { unmount } = renderWithProvider(() => useAgentMetrics(), mock);

      unmount();
      expect(mock.off).toHaveBeenCalledWith('agent-metrics', expect.any(Function));
    });

    it('returns nulls without provider', () => {
      const { result } = renderHook(() => useAgentMetrics());
      expect(result.current.metrics).toBeNull();
      expect(result.current.agentUserId).toBeNull();
    });
  });
});
