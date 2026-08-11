import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(() => ({
  plugins: [react()],
  resolve: {
    // Games and their specs sit two to four folders deep under src/, so without
    // these every one of them reaches a shared module through a wall of `../` —
    // a depth that shifts whenever a game grows a variant subfolder.
    // Mirrored in tsconfig.json's `paths` — keep the two in sync.
    // The patterns are anchored: `strategy-game-factory/engine/…` deliberately
    // does not resolve, since games import through the barrel only.
    alias: [
      {
        find: /^test-utils$/,
        replacement: fileURLToPath(new URL('./src/test-utils.ts', import.meta.url))
      },
      {
        find: /^strategy-game-factory$/,
        replacement: fileURLToPath(new URL('./src/components/strategy-game-factory/index.ts', import.meta.url))
      },
      {
        find: /^language$/,
        replacement: fileURLToPath(new URL('./src/language/index.ts', import.meta.url))
      }
    ]
  },
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
    setupFiles: ['./src/test-setup.ts'],
    // On demand only, never in `npm test` or CI, and with no thresholds — see
    // AGENTS.md § Coverage for why, and for what the report is actually good
    // for, which is what `include` below is spelled out for.
    coverage: {
      provider: 'v8',
      // Without this, only files a test imported are reported, and a module no
      // spec touches is missing from the report rather than showing up at 0%.
      include: ['src/**/*.{ts,tsx}'],
      exclude: [
        'src/**/*.spec.{ts,tsx}',
        'src/test-utils.ts',
        'src/test-setup.ts',
        'src/**/spec-helpers.tsx',
        'src/main.tsx'
      ],
      reporter: ['text', 'html'],
      // /reports is gitignored
      reportsDirectory: 'reports/coverage'
    }
  }
}));
