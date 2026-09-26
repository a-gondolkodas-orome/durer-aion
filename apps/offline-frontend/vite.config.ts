import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process';
import { manualChunks, workspacePackages } from '../../vite.shared.mts';

export default defineConfig(() => {
  // ||=, so a caller may set it and turbo can hash what the bundle will carry
  // (it is in globalEnv). Unset — every local build — this reads HEAD, and a
  // restored cache entry names the commit that first built these exact sources
  // instead. Identical trees, so only the commit's identity is approximate.
  process.env.VITE_GIT_COMMIT_HASH ||= execSync('git rev-parse HEAD').toString().trimEnd();

  return {
    // SITE_BASE is the Pages deploy's prefix, composed by the workflow from one variable so the
    // three subpages move together (scripts/assemble-site.mjs). The dry run's own deploy sets it
    // too, to the private repo's name (scripts/deploy-dry-run.mjs).
    base: process.env.SITE_BASE || '/',
    plugins: [react()],
    ...workspacePackages,
    server: {
      // Vite binds loopback by default. In a dev container the browser reaches
      // it from outside the container's network namespace, where a
      // loopback-only bind is simply unreachable — the request hangs rather
      // than failing. `.devcontainer` sets DEV_SERVER_HOST for that case;
      // outside a container nothing changes.
      host: process.env.DEV_SERVER_HOST === "true" || undefined,
      fs: {
        allow: [
          "..", // allow Vite to serve files outside project root
        ],
      },
    },
    build: {
      rollupOptions: {
        output: { manualChunks },
      },
    },
  }
})
