import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['index.ts', 'react.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  clean: true,

  // This package is CJS-typed, so this keeps cjs on `.js` and esm on `.mjs`,
  // which is where the `exports` map points. tsdown otherwise fixes the
  // extensions to `.cjs`/`.mjs` whenever `platform` is node, its default.
  fixedExtension: false,

  // The tsconfig here sets `declarationMap` and tsdown honours it. Nothing
  // reads the map, and emitting one puts a `sourceMappingURL` into output the
  // frontend apps go on to bundle.
  dts: { sourcemap: false },

  deps: {
    // lodash ships CommonJS, so a real node importing the esm output would reject
    // `import { cloneDeep } from 'lodash'` outright — a bundler's interop is what
    // hides that everywhere else. Bundling it in is what makes this package
    // loadable by the hosts it exists for. Nothing browser-facing pays for it:
    // apps/strategy-practice reads the source through an alias, not this build.
    alwaysBundle: ['lodash'],

    // Leave a subpath import as written; resolving it is tsdown's default, and
    // for a dependency with no `exports` map it lands on the package's CJS entry.
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
