import { defineConfig } from 'tsdown'
import * as dotenv from 'dotenv'

dotenv.config({ path: "../../.env.local", quiet: true });

const envVars = Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .reduce((acc, key) => {
    acc[`process.env.${key}`] = JSON.stringify(process.env[key]);
    return acc;
  }, {} as Record<string, string>);

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
    // Keep external dependencies as imports so browser ESM never hits runtime
    // `require` shims. Marking external only what package.json declares is not
    // enough here: this package reaches @mui/system and @mui/utils through
    // @mui/material without declaring either, so the default would inline them.
    neverBundle: true,

    // Leave a subpath import as written. Resolving it is tsdown's default, and
    // for a dependency with no `exports` map it lands on the package's CJS
    // entry — `@mui/material/Stack` becomes `@mui/material/node/Stack/index.js`
    // — so the frontend apps bundle CommonJS builds that tree-shake far worse.
    resolveDepSubpath: false,
  },

  define: {
    ...envVars,
  },

  outputOptions: {
    // rolldown keeps comments, so a package that bundles a dependency in also
    // carries that dependency's JSDoc, which can nearly double the output.
    // Legal and annotation comments still survive, so license headers and
    // `@__PURE__` markers stay.
    comments: { jsdoc: false },
  },
})
