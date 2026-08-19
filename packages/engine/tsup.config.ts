import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['index.ts', 'react.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  outDir: 'dist',
  splitting: false,
  clean: true,
  // lodash ships CommonJS, so a real node importing the esm output would reject
  // `import { cloneDeep } from 'lodash'` outright — a bundler's interop is what
  // hides that everywhere else. Bundling it in is what makes this package
  // loadable by the hosts it exists for. Nothing browser-facing pays for it:
  // apps/practice reads the source through an alias, not this build.
  noExternal: ['lodash'],
  esbuildOptions(options) {
    // `import.meta` is empty in the cjs output, which is exactly what isDevMode
    // wants there: no Vite means fall through to NODE_ENV. The warning describes
    // the case the line was written for.
    options.logOverride = { ...options.logOverride, 'empty-import-meta': 'silent' };
  },
})
