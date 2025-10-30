import { defineConfig } from 'tsup'
import * as dotenv from 'dotenv'

dotenv.config({ path: "../../.env.local" });

const envVars = Object.keys(process.env)
  .filter(key => key.startsWith('VITE_'))
  .reduce((acc, key) => {
    acc[`process.env.${key}`] = JSON.stringify(process.env[key]);
    return acc;
  }, {} as Record<string, string>);

export default defineConfig({
  entry: ['index.ts', 'relay.tsx', 'strategy.tsx'],
  format: ['esm', 'cjs'],
  dts: true,
  outDir: 'dist',
  splitting: false,
  clean: true,

  define: {
    ...envVars,
  },

})