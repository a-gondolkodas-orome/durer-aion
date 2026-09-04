import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';
import { execSync } from 'child_process';

export default defineConfig(() => {
  process.env.VITE_GIT_COMMIT_HASH = execSync('git rev-parse HEAD').toString().trimEnd();

  return {
    // SITE_BASE is the Pages deploy's prefix, composed by the workflow from one variable so the
    // three subpages move together (scripts/assemble-site.mjs). PUBLIC_URL stays supported
    // because DEPLOYMENT.md's per-competition deploy sets it, and that build is not this one.
    base: process.env.SITE_BASE || process.env.PUBLIC_URL || '/',
    plugins: [react()],
    resolve: {
      // Anchored patterns, not string keys: a string key matches as a prefix too, so
      // `game` alone would send `game/bot` to the package *directory* plus `/bot` —
      // that is, to the source entry bot.ts — while `game` itself resolves through
      // the exports map to the built dist, and the rules end up in the bundle twice,
      // once from each. Each subpath names its dist file, so the three entries share
      // one copy of the rules.
      alias: [
        { find: "boardgame.io", replacement: path.resolve(import.meta.dirname, "../../node_modules/boardgame.io") },
        { find: /^game$/, replacement: path.resolve(import.meta.dirname, "../../packages/game") },
        { find: /^game\/(bot|client)$/, replacement: path.resolve(import.meta.dirname, "../../packages/game/dist/$1.mjs") },
        { find: /^schemas$/, replacement: path.resolve(import.meta.dirname, "../../packages/schemas") },
        { find: /^strategy$/, replacement: path.resolve(import.meta.dirname, "../../packages/strategy") },
        { find: /^common-frontend$/, replacement: path.resolve(import.meta.dirname, "../../packages/common-frontend") },
      ],
      dedupe: ["react", "react-dom", "boardgame.io"], // ✅ avoid duplicate instances
      preserveSymlinks: true, // this is needed to make sure that linked packages are properly resolved (like game and schemas
    },
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
    optimizeDeps: {
      exclude: ["game", "schemas", "strategy", "common-frontend"],
      include: ["boardgame.io"],
    },
    build: {
      rollupOptions: {
        // Don’t bundle test files
        output: {
          manualChunks(id) {
            // Split game description files into a separate chunk
            // These contain the problem text that should only load when the game starts
            if (id.includes('/ReactClient.')) {
              return 'react-client';
            }
          }
        },
        external: [/\.test\.(t|j)sx?$/],
      },
    },
  }
})
