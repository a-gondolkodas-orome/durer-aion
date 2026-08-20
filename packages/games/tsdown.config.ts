import { defineConfig } from 'tsdown'

export default defineConfig({
  // Only the server entry is built: the `.` entry is the React configs, which
  // apps/practice reads as source through its alias, and no node host may
  // import — the optimal bots ship server-side precisely so no client bundle
  // carries them.
  entry: ['server.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  clean: true,
  dts: true,

  // This package is CJS-typed, so this keeps cjs on `.js` and esm on `.mjs`,
  // which is where the `exports` map points. tsdown otherwise fixes the
  // extensions to `.cjs`/`.mjs` whenever `platform` is node, its default.
  fixedExtension: false,

  deps: {
    // As in the engine's build: lodash ships CommonJS, and a bare node loading
    // the esm output would reject its named imports without a bundler's interop.
    alwaysBundle: ['lodash'],
  },

  outputOptions: {
    // rolldown keeps comments, so a package that bundles a dependency in also
    // carries that dependency's JSDoc, which can nearly double the output.
    // Legal and annotation comments still survive, so license headers and
    // `@__PURE__` markers stay.
    comments: { jsdoc: false },
  },
})
