// .mts, not .ts: the root package.json is not a module, so Vite loads a .ts config as
// CommonJS and warns that the ESM syntax below will stop working once its native config
// loader becomes the default.
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// The suites run against the packages' TypeScript sources, with no build in
// front of them — the CI test job installs and runs vitest, nothing more. That
// used to happen by accident: resolution fell through each package's unbuilt
// `main` to the source barrel next to it. Their exports maps close that path
// now, so say it outright, which also stops a stale `dist` on a developer's
// machine from being what the suites test.
const source = (file: string) =>
  fileURLToPath(new URL(`packages/${file}`, import.meta.url));

export default defineConfig({
  resolve: {
    // Anchored patterns, not string keys: a string key matches as a prefix too,
    // so `game` alone would send `game/bot` to `index.ts/bot`.
    alias: [
      { find: /^game$/, replacement: source('game/index.ts') },
      { find: /^game\/bot$/, replacement: source('game/bot.ts') },
      { find: /^game\/client$/, replacement: source('game/client.ts') },
      { find: /^schemas$/, replacement: source('schemas/index.ts') },
      { find: /^strategy$/, replacement: source('strategy/index.ts') },
    ],
  },
  test: {
    // The suites import from 'vitest' explicitly, so they typecheck without an
    // ambient-types entry in every workspace tsconfig. Globals stay on because
    // `@testing-library/jest-dom` extends the global `expect` when imported.
    globals: true,
    // Most suites are plain Node. Component tests opt into a DOM per file with
    // a `// @vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['{apps,packages}/*/src/**/*.test.{ts,tsx}', 'scripts/**/*.test.mjs'],
    // Keeps the run's output to the report itself — see the file for how a test
    // that means to log opts out.
    setupFiles: ['./vitest.setup.mts'],
    // apps/strategy-practice runs as a second project, under its own vite
    // config: its aliases, setup file and `isolate: false` are its own, and
    // CLAUDE.md § Project Structure says why the two configs stay separate.
    // `extends: true` keeps the options above for the root project only. That
    // config is also the root config when vitest runs from that directory,
    // which is what its `npm run coverage` relies on.
    projects: [
      { extends: true, test: { name: 'root' } },
      './apps/strategy-practice/vite.config.js',
    ],
  },
});
