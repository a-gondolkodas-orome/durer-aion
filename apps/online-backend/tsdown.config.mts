import { fileURLToPath } from 'node:url'
import { defineConfig } from 'tsdown'

// The three workspace packages are bundled in from their TypeScript source —
// the same entries vitest.config.mts aliases — so this build needs no
// `packages/*/dist` and cannot go stale against one. Only `tsc --noEmit` still
// reaches the packages through their exports maps, for the declarations.
const source = (pkg: string) =>
  fileURLToPath(new URL(`../../packages/${pkg}/index.ts`, import.meta.url))

export default defineConfig({
  entry: ['src/server.ts'],
  // CommonJS, not ESM: every dependency stays a bare `require()` below, and
  // boardgame.io ships no `exports` map — its subpaths are directories, which
  // Node's ESM loader refuses (ERR_UNSUPPORTED_DIR_IMPORT on
  // `boardgame.io/server`). A CJS bundle is what Node can run unbundled deps
  // from; an ESM one becomes possible the day upstream adds the map.
  format: 'cjs',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  // `.js`, not the `.cjs` tsdown picks for node: the package is CJS-typed, so
  // `.js` already means CommonJS, and `npm start` names the file.
  fixedExtension: false,
  // The bundle is one file; the map is what gives Sentry and the debugger the
  // source lines back. `start` and `dev` run node with --enable-source-maps.
  sourcemap: true,

  alias: {
    game: source('game'),
    schemas: source('schemas'),
    strategy: source('strategy'),
  },

  deps: {
    // Everything installed stays external — the backend's own dependencies
    // and the ones the game package reaches (MUI, React, lodash, boardgame.io),
    // which npm installs alongside the workspace. Marking external only what
    // this package.json declares would inline those.
    neverBundle: true,
    // The alias resolves each of these to a source path, but the external
    // check runs on the bare specifier first, and all three are declared
    // dependencies; this is what makes the alias win.
    alwaysBundle: ['game', 'schemas', 'strategy'],
    // Keep `boardgame.io/server` and the like as written, so the bundle
    // requires what the source imports rather than a `dist/cjs/...` path.
    resolveDepSubpath: false,
  },

  outputOptions: {
    // rolldown keeps comments; the bundled packages' JSDoc would be dead
    // weight in a server bundle. Legal and annotation comments still survive.
    comments: { jsdoc: false },
  },
})
