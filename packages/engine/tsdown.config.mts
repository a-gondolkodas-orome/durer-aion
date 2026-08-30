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

    // What gets bundled is decided by `alwaysBundle` above, so tsdown's hint
    // asking for a list has nothing left to tell us. `onlyBundle: ['lodash']`
    // would be the tighter answer, but its own check runs over the declaration
    // pass too, where lodash is absent, so it reports the entry as unused on
    // every build.
    onlyBundle: false,

    // Leave a subpath import as written; resolving it is tsdown's default, and
    // for a dependency with no `exports` map it lands on the package's CJS entry.
    resolveDepSubpath: false,
  },

  // The cjs build replaces `import.meta` with `{}`, which is what dev-mode.ts
  // wants there — reading `.env?.DEV` off it yields undefined and the NODE_ENV
  // fallback decides. rolldown warns anyway, once per build. The fix it suggests,
  // `transform.define`, is not per-format and would erase the expression from the
  // esm output too, where Vite's substitution is the whole point.
  suppressWarnings: ['EMPTY_IMPORT_META'],

  outputOptions: {
    // rolldown keeps comments, so a package that bundles a dependency in also
    // carries that dependency's JSDoc, which can nearly double the output.
    // Legal and annotation comments still survive, so license headers and
    // `@__PURE__` markers stay.
    comments: { jsdoc: false },
  },
})
