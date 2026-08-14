import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The suites import from 'vitest' explicitly, so they typecheck without an
    // ambient-types entry in every workspace tsconfig. Globals stay on because
    // `@testing-library/jest-dom` extends the global `expect` when imported.
    globals: true,
    // Most suites are plain Node. Component tests opt into a DOM per file with
    // a `// @vitest-environment jsdom` docblock.
    environment: 'node',
    include: ['{apps,packages}/*/src/**/*.test.{ts,tsx}'],
  },
});
