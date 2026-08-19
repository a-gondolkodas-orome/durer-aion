import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    // packages/competition reads the engine's source, the way apps/practice
    // does through its own alias: the CI test job runs with no build step, so
    // resolving `engine` to its dist would fail there and silently test a
    // stale build everywhere else.
    alias: [
      {
        find: /^engine$/,
        replacement: fileURLToPath(new URL('./packages/engine/index.ts', import.meta.url))
      }
    ]
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
  },
});
