import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['index.ts'],
  format: ['esm', 'cjs'],
  outDir: 'dist',
  clean: true,
  dts: true,

  // This package is CJS-typed, so this keeps cjs on `.js` and esm on `.mjs`,
  // which is where the `exports` map points. tsdown otherwise fixes the
  // extensions to `.cjs`/`.mjs` whenever `platform` is node, its default.
  fixedExtension: false,
})
