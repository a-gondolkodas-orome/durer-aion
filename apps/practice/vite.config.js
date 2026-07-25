import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(() => ({
  plugins: [
    react()
    // visualizer({ open: true })
  ],
  base: '/',
  build: {
    rollupOptions: {
      output: {
        // Define manual chunks to keep each chunk under the recommended 500kb
        manualChunks: (id) => {
          if (id.includes('node_modules/react')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/lodash')) {
            return 'lodash';
          }
          // has a big bot-strategy file
          if (id.includes('remove-divisor-multiple')) {
            return 'remove-divisor-multiple';
          }
          // has a relatively big svg that should only be loaded if necessary
          if (id.includes('shark-chase')) {
            return 'shark-chase';
          }
        }
      }
    }
  },
  server: {
    host: true,
    port: 8012,
    watch: {
      usePolling: true
    }
  },
  test: {
    globals: true,
    environment: 'node',
    clearMocks: true,
    restoreMocks: true,
    // Reuse one context per worker instead of a fresh one per file (~40% faster).
    // Requires the setup file below: with a shared module cache, testing-library's
    // own auto-cleanup only registers in the first file per worker, so per-file
    // teardown must be provided explicitly. The strict per-file-isolated behaviour
    // is still a `vitest run --isolate` away if a leak is ever suspected.
    isolate: false,
    setupFiles: ['./src/test-setup.ts']
  }
}));
