import { defineConfig } from 'tsup';

// Source lives at the workspace root src/.
// Relative path from packages/conversational-ai/ → ../../src
const SRC = '../../src';

export default defineConfig({
  entry: {
    index: `${SRC}/index.ts`,
  },
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,       // enables code splitting for dynamic imports
  sourcemap: true,
  clean: true,
  external: [
    // Peer dependencies — never bundled
    'agora-rtc-sdk-ng',
    'agora-rtm',
    // Optional dependencies — loaded dynamically; must also be external
    'jszip',
    '@agora-js/report',
  ],
  treeshake: true,
});
