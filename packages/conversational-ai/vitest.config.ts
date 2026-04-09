import { defineConfig } from 'vitest/config';

export default defineConfig({
  root: '../../',
  test: {
    include: ['packages/conversational-ai/__tests__/**/*.test.ts'],
    globals: true,
    environment: 'jsdom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json-summary', 'lcov'],
      reportsDirectory: 'packages/conversational-ai/coverage',
      include: ['src/**/*.ts'],
      exclude: [
        '**/__tests__/**',
        '**/__typetests__/**',
        '**/*.d.ts',
        'src/index.ts',
      ],
      thresholds: {
        lines: 40,
        branches: 65,
        functions: 50,
        statements: 40,
      },
    },
  },
});
