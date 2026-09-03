import { defineConfig } from 'tsdown'

export default defineConfig({
  // One entry per export: the shared rules, the bots, the React client half.
  entry: ['index.ts', 'bot.ts', 'client.ts'],
  // ESM only: the frontends import it and the backend bundles the source; a
  // CommonJS half would have no consumer.
  format: ['esm'],
  outDir: 'dist',
  clean: true,

  // The tsconfig here sets `declarationMap` and tsdown honours it. Nothing
  // reads the map, and emitting one puts a `sourceMappingURL` into output the
  // frontend apps go on to bundle.
  dts: { sourcemap: false },

  deps: {
    // The one dependency that ends up inlined is lodash, which this package
    // imports without declaring. Saying so is what silences tsdown's per-build
    // hint. `onlyBundle: ['lodash']` would be the tighter answer — it fails the
    // build if anything else starts getting inlined — but its own check runs
    // over the declaration pass too, where lodash is absent, so it reports the
    // entry as unused on every build.
    onlyBundle: false,

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
