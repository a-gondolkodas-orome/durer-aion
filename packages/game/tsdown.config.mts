import { globSync } from 'node:fs'
import { relative } from 'node:path'
import { defineConfig, type Rolldown } from 'tsdown'

// Every module an entry ships, read off the bundler's own graph: its chunk's
// modules, and those of every chunk it imports, statically or dynamically. A
// module two entries share lands in a chunk both import, so it counts for both.
function shippedBy(bundle: Rolldown.OutputBundle, entry: string): Set<string> {
  const chunks = Object.values(bundle).filter(
    (output): output is Rolldown.OutputChunk => output.type === 'chunk' && output.fileName.endsWith('.mjs'))
  const byFile = new Map(chunks.map(chunk => [chunk.fileName, chunk]))
  const pending = chunks.filter(chunk => chunk.isEntry && chunk.name === entry)
  if (pending.length === 0) throw new Error(`no chunk for the ${entry} entry`)
  const seen = new Set<Rolldown.OutputChunk>()
  for (let chunk = pending.pop(); chunk; chunk = pending.pop()) {
    if (seen.has(chunk)) continue
    seen.add(chunk)
    for (const file of [...chunk.imports, ...chunk.dynamicImports]) {
      const next = byFile.get(file)
      if (next) pending.push(next)
    }
  }
  return new Set([...seen].flatMap(chunk => chunk.moduleIds)
    .filter(id => !id.includes('/node_modules/'))
    .map(id => relative(import.meta.dirname, id).replace(/\\/g, '/')))
}

// The boundaries the three entries exist for, checked on every build. The live
// client ships what `index` and `client` reach, and the bots must not be in it:
// the only modules `bot` may share with those two are the rules — a game's
// game.ts and src/common — per the game layout in README.md. A strategy file,
// or a lookup table under whatever name, reached from both is a bot in the
// served bundle. The server never renders, so `index` reaches no board; and no
// entry carries a suite's fixtures.
const entryBoundaries: Rolldown.Plugin = {
  name: 'entry-boundaries',
  generateBundle(_options, bundle) {
    const [index, bot, client] = ['index', 'bot', 'client'].map(entry => shippedBy(bundle, entry))
    const isRules = (id: string) => id.startsWith('src/common/') || /(^|\/)game\.ts$/.test(id)
    const problems = [
      ...[...bot].filter(id => (index.has(id) || client.has(id)) && !isRules(id))
        .map(id => `${id} is reached by the bot entry and by an entry the live client ships`),
      ...[...index].filter(id => id.endsWith('.tsx')).map(id => `the shared entry reaches the board ${id}`),
      ...globSync('src/games/strategy/*/strategy.ts', { cwd: import.meta.dirname })
        .map(id => id.replace(/\\/g, '/')).filter(id => !bot.has(id))
        .map(id => `${id} is not reached by the bot entry: register it in strategy-bots.ts`),
      ...[...new Set([...index, ...bot, ...client])].filter(id => /(\.test|_for_testing)\.tsx?$/.test(id))
        .map(id => `an entry reaches the test-only ${id}`),
    ]
    if (problems.length > 0) this.error(`packages/game's entries cross their boundaries:\n  ${problems.join('\n  ')}`)
  },
}

export default defineConfig({
  // One entry per export: the shared rules, the bots, the React client half.
  entry: ['index.ts', 'bot.ts', 'client.ts'],
  // ESM only: the frontends import it and the backend bundles the source; a
  // CommonJS half would have no consumer.
  format: ['esm'],
  outDir: 'dist',
  clean: true,
  plugins: [entryBoundaries],

  deps: {
    // Leave a subpath import as written. Resolving it is tsdown's default, and
    // for a dependency with no `exports` map it lands on the package's CJS
    // entry — `boardgame.io/core` becomes `boardgame.io/dist/cjs/core.js` — so
    // the frontend apps bundle CommonJS builds that tree-shake far worse.
    resolveDepSubpath: false,
  },

  outputOptions: {
    // rolldown keeps comments, so a package that bundles a dependency in also
    // carries that dependency's JSDoc, which can nearly double the output.
    // Legal and annotation comments still survive, so license headers and
    // `@__PURE__` markers stay.
    comments: { jsdoc: false },
  },
})
