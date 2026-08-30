import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  clean: true,

  // This package is CJS-typed, so this keeps cjs on `.js` and esm on `.mjs`,
  // which is where `main` and `module` point. tsdown otherwise fixes the
  // extensions to `.cjs`/`.mjs` whenever `platform` is node, its default.
  fixedExtension: false,

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
