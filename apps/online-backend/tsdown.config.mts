import { relative } from 'node:path'
import { defineConfig, type Rolldown } from 'tsdown'

// The team import is its own entry so that loading a TSV needs neither the bot
// nor the admin password, and none of the games, bots or socket transport. What
// it ships, read off the bundler's own graph — its chunk and the chunks it
// requires — must stay clear of the server's module, of the env getters in
// server/common.ts, of `game` and `relay-bot`, and of boardgame.io and socket.io.
const importStaysSmall: Rolldown.Plugin = {
  name: 'import-stays-small',
  generateBundle(_options, bundle) {
    const chunks = Object.values(bundle).filter((output): output is Rolldown.OutputChunk => output.type === 'chunk')
    const byFile = new Map(chunks.map(chunk => [chunk.fileName, chunk]))
    const reached = new Set<Rolldown.OutputChunk>()
    const pending = chunks.filter(chunk => chunk.isEntry && chunk.name === 'import_teams')
    if (pending.length === 0) this.error('no chunk for the import_teams entry')
    for (let chunk = pending.pop(); chunk; chunk = pending.pop()) {
      if (reached.has(chunk)) continue
      reached.add(chunk)
      for (const file of [...chunk.imports, ...chunk.dynamicImports]) {
        const next = byFile.get(file)
        if (next) pending.push(next)
      }
    }
    const modules = [...reached].flatMap(chunk => chunk.moduleIds)
      .map(id => relative(import.meta.dirname, id).replace(/\\/g, '/'))
    const packages = [...reached].flatMap(chunk => chunk.imports).filter(name => !byFile.has(name))
    const problems = [
      ...['src/server.ts', 'src/server/common.ts'].filter(id => modules.includes(id)).map(id => `reaches ${id}`),
      ...['game', 'relay-bot'].filter(name => modules.some(id => id.startsWith(`../../packages/${name}/`)))
        .map(name => `bundles ${name}`),
      ...packages.filter(name => /^(boardgame\.io|socket\.io)($|\/)/.test(name)).map(name => `requires ${name}`),
    ]
    if (problems.length > 0) this.error(`the team import entry ${problems.join(', ')}`)
  },
}

// The workspace packages are bundled in from their TypeScript source, so this
// build needs no `packages/*/dist` and cannot go stale against one. Where that
// source is comes from tsconfig.json's `paths`, which tsdown reads as its alias
// map — the one list the bundle and the typecheck share. The server imports
// `game` and `game/bot`, never `game/client`, so the bundle carries no board
// and requires neither React nor MUI.

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
  plugins: [importStaysSmall],
  // `.js`, not the `.cjs` tsdown picks for node: the package is CJS-typed, so
  // `.js` already means CommonJS, and `npm start` names the file.
  fixedExtension: false,
  // The map is what gives the server log and the debugger the source lines back.
  // `start`, `dev` and `import-teams` run node with --enable-source-maps.
  sourcemap: true,

  deps: {
    // Everything installed stays external — the backend's own dependencies
    // and the ones the game package reaches (MUI, React, lodash, boardgame.io),
    // which npm installs alongside the workspace. Marking external only what
    // this package.json declares would inline those.
    neverBundle: true,
    // `paths` resolves each of these to a source path, but the external check
    // runs on the bare specifier first, and they all belong to declared
    // dependencies; this is what makes `paths` win. Without it they stay
    // `require()`s of a `dist` the image never builds.
    alwaysBundle: ['game', 'game/bot', 'schemas', 'relay-bot'],
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
