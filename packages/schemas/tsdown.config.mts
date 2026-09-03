import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['index.ts'],
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
