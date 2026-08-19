import { defineConfig } from 'tsup'

export default defineConfig({
  // Only the server entry is built: the `.` entry is the React configs, which
  // apps/practice reads as source through its alias, and no node host may
  // import — the optimal bots ship server-side precisely so no client bundle
  // carries them.
  entry: ['server.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  outDir: 'dist',
  splitting: false,
  clean: true,
  // As in the engine's build: lodash ships CommonJS, and a bare node loading
  // the esm output would reject its named imports without a bundler's interop.
  noExternal: ['lodash'],
})
