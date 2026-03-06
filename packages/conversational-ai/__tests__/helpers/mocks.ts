import { vi } from 'vitest';

/**
 * Creates a mock RTC client that stores handlers and can emit events.
 * Implements the subset of IAgoraRTCClient that AgoraVoiceAI uses.
 */
export function createMockRTCClient() {
  const handlers = new Map<string, Set<Function>>();

  return {
    on(event: string, handler: Function) {
      if (!handlers.has(event)) handlers.set(event, new Set());
      handlers.get(event)!.add(handler);
    },
    off(event: string, handler: Function) {
      handlers.get(event)?.delete(handler);
    },
    removeAllListeners() {
      handlers.clear();
    },
    /** Test helper: emit an event to all registered handlers */
    __emit(event: string, ...args: unknown[]) {
      const cbs = handlers.get(event);
      if (cbs) {
        for (const cb of cbs) {
          cb(...args);
        }
      }
    },
    /** Test helper: get handler count for an event */
    __handlerCount(event: string): number {
      return handlers.get(event)?.size ?? 0;
    },
  };
}

/**
 * Creates a mock RTM client that stores handlers and can emit events.
 * Implements the subset of RTMClient that AgoraVoiceAI uses.
 */
export function createMockRTMClient() {
  const listeners = new Map<string, Set<Function>>();

  return {
    addEventListener(event: string, handler: Function) {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(handler);
    },
    removeEventListener(event: string, handler: Function) {
      listeners.get(event)?.delete(handler);
    },
    removeAllListeners() {
      listeners.clear();
    },
    subscribe: vi.fn().mockResolvedValue(undefined),
    unsubscribe: vi.fn().mockResolvedValue(undefined),
    publish: vi.fn().mockResolvedValue(undefined),
    /** Test helper: emit an event to all registered listeners */
    __emit(event: string, ...args: unknown[]) {
      const cbs = listeners.get(event);
      if (cbs) {
        for (const cb of cbs) {
          cb(...args);
        }
      }
    },
    /** Test helper: get listener count for an event */
    __listenerCount(event: string): number {
      return listeners.get(event)?.size ?? 0;
    },
  };
}
