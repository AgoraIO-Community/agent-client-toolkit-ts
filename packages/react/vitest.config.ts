import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

const coreEntry = fileURLToPath(new URL('../../src/index.ts', import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      'agora-agent-client-toolkit': coreEntry,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 70,
        branches: 60,
        functions: 70,
        statements: 70,
      },
    },
  },
  esbuild: {
    jsx: 'automatic',
  },
});
