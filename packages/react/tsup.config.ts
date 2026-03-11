import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: false, // Generated separately via tsc to work around agora-rtc-react/agora-rtc-sdk-ng type mismatch
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    'agora-rtc-react',
    'agora-agent-client-toolkit',
  ],
  treeshake: true,
});
