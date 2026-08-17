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
      },
      // The engine is a workspace package, whose `main` is a tsup build — right for
      // the node hosts that will import it, wrong here: it would mean building
      // before `npm run dev` and no HMR into engine source. This app reads the
      // source, exactly as it did when these files sat under src/.
      {
        find: /^engine$/,
        replacement: fileURLToPath(new URL('../../packages/engine/index.ts', import.meta.url))
      }
    ]
  },
  // Served from `/jatekok/` on gyakorlo.durerinfo.hu, and from the site root by `npm run dev`.
  // The deploy workflow composes the whole prefix from one variable, so moving the site is one
  // line there rather than an edit in every app. See docs/pages-consolidation.md.
  base: process.env.SITE_BASE || '/',
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
    // The engine's own specs moved out with it, and still run here: they were
    // written against this setup, and this is the app that exercises the engine
    // in a browser. Vitest resolves them through the alias above, so they test
    // the source rather than a build.
    include: ['**/*.{test,spec}.?(c|m)[jt]s?(x)', '../../packages/engine/src/**/*.spec.ts'],
    // On demand only, never in `npm test` or CI, and with no thresholds — see
    // AGENTS.md § Coverage for why, and for what the report is actually good
    // for, which is what `include` below is spelled out for.
    coverage: {
      provider: 'v8',
      // Without this, only files a test imported are reported, and a module no
      // spec touches is missing from the report rather than showing up at 0%.
      // The engine package counts as this app's source for coverage purposes:
      // its specs run here, and patch-coverage gates its added lines the same
      // way (allowExternal is what lets v8 keep files above the app root).
      allowExternal: true,
      include: ['src/**/*.{ts,tsx}', '../../packages/engine/src/**/*.ts'],
      exclude: [
        'src/**/*.spec.{ts,tsx}',
        'src/test-utils.ts',
        'src/test-setup.ts',
        'src/**/spec-helpers.tsx',
        'src/main.tsx',
        '../../packages/engine/src/**/*.spec.ts'
      ],
      reporter: ['text', 'html'],
      // /reports is gitignored
      reportsDirectory: 'reports/coverage'
    }
  }
}));
