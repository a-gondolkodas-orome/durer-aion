import { defineConfig } from 'tsdown'

// The workspace packages are bundled in from their TypeScript source, so this
// build needs no `packages/*/dist` and cannot go stale against one. Where that
// source is comes from tsconfig.json's `paths`, which tsdown reads as its alias
// map — the one list the bundle and the typecheck share. The server imports
// `game`, `game/strategy` and `game/bot`, never `game/client`, so the bundle
// carries no board and requires neither React nor MUI.

export default defineConfig({
  // Two entries: the server and the team import. rolldown puts what they share
  // — the database and the team repository — in a chunk beside them, which each
  // `require`s by name.
  entry: ['src/server.ts', 'src/import_teams.ts'],
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
  // The map is what gives the server log and the debugger the source lines back.
  // `start`, `dev` and `import-teams` run node with --enable-source-maps.
  sourcemap: true,

  deps: {
    // Everything installed stays external: the backend's own dependencies and
    // those of the workspace packages bundled in below, which npm installs
    // alongside it. Marking external only what this package.json declares
    // would inline the latter. The production image installs exactly those
    // two sets and no peers, so a bundle require() must name a dependency of
    // one of them; the image build fails otherwise (Dockerfile).
    neverBundle: true,
    // `paths` resolves each of these to a source path, but the external check
    // runs on the bare specifier first, and they all belong to declared
    // dependencies; this is what makes `paths` win. Without it they stay
    // `require()`s of a `dist` the image never builds.
    alwaysBundle: ['game', 'game/strategy', 'game/bot', 'game/relay-judge', 'schemas', 'problem-bank', 'problem-bank/all'],
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
