import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'
import { existsSync, readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
const backend = 'http://localhost:8000';

// The strategy games are served only through the backend's gate (#643): each
// game folder's client.tsx builds to gated/strategy/<folder>.js, which nginx
// serves only to the backend's X-Accel-Redirect.
const GATE_URL = '/team/me/strategy-client.js';
const GATED_DIR = 'gated/strategy/';
const strategySource = fileURLToPath(new URL('../../packages/game/src/games/strategy/', import.meta.url));
const clientOf = (folder: string) => `${strategySource}${folder}/client.tsx`;
const gameFolders = readdirSync(strategySource, { withFileTypes: true })
  .filter(entry => entry.isDirectory() && existsSync(clientOf(entry.name)))
  .map(entry => entry.name);

// Fails the build if a game's code lands anywhere but gated/, as it would
// through a stray import or a chunk shared with the public build.
function gatedBoundary(): Plugin {
  return {
    name: 'gated-strategy-boundary',
    apply: 'build',
    enforce: 'post',
    generateBundle(_, bundle) {
      const leaks = Object.values(bundle).flatMap(item =>
        item.type === 'chunk' && !item.fileName.startsWith(GATED_DIR)
          ? item.moduleIds.filter(id => id.includes(strategySource)).map(id => `${item.fileName}: ${id}`)
          : []);
      if (leaks.length > 0) this.error(`A strategy game's code would reach the public build:\n${leaks.join('\n')}`);
    },
  };
}

// Dev has no nginx: ask the backend, and answer with the source of the folder
// its X-Accel-Redirect names. Runs before Vite's proxy.
function devGate(): Plugin {
  return {
    name: 'gated-strategy-dev',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== GATE_URL) return next();
        try {
          const answer = await fetch(`${backend}${req.url}`, { headers: { cookie: req.headers.cookie ?? '' } });
          const redirect = answer.headers.get('x-accel-redirect') ?? '';
          const folder = /^\/gated\/strategy\/([^/]+)\.js$/.exec(redirect)?.[1];
          if (answer.status !== 200 || folder === undefined || !gameFolders.includes(folder)) {
            res.statusCode = answer.status === 200 ? 500 : answer.status;
            res.end();
            return;
          }
          res.setHeader('Content-Type', 'text/javascript');
          res.setHeader('Cache-Control', 'private, no-cache');
          res.end(`export * from ${JSON.stringify(`/@fs${clientOf(folder)}`)};\n`);
        } catch {
          res.statusCode = 502;
          res.end();
        }
      });
    },
  };
}

export default defineConfig(() => {
  // ||=, so a caller may set it and turbo can hash what the bundle will carry
  // (it is in globalEnv). Unset — every local build — this reads HEAD, and a
  // restored cache entry names the commit that first built these exact sources
  // instead. Identical trees, so only the commit's identity is approximate.
  process.env.VITE_GIT_COMMIT_HASH ||= execSync('git rev-parse HEAD').toString().trimEnd();

  return {
    plugins: [react(), gatedBoundary(), devGate()],
    resolve: {
      // The game package from source, every entry: the boundary check reads
      // module paths, which its dist would hide. Anchored, as a string key
      // matches as a prefix.
      alias: [
        { find: /^game$/, replacement: fileURLToPath(new URL('../../packages/game/index.ts', import.meta.url)) },
        { find: /^game\/([^/]+)$/, replacement: fileURLToPath(new URL('../../packages/game/$1.ts', import.meta.url)) },
      ],
    },
    build: {
      rolldownOptions: {
        input: {
          index: fileURLToPath(new URL('index.html', import.meta.url)),
          ...Object.fromEntries(gameFolders.map(folder => [`${GATED_DIR}${folder}`, clientOf(folder)])),
        },
        // Vite's default (`false`) strips the exports the loader calls.
        preserveEntrySignatures: 'exports-only',
        output: {
          entryFileNames: chunk => chunk.name.startsWith(GATED_DIR) ? '[name].js' : 'assets/[name]-[hash].js',
        },
      },
    },
    server: {
      // Vite binds loopback by default. In a dev container the browser reaches
      // it from outside the container's network namespace, where a
      // loopback-only bind is simply unreachable — the request hangs rather
      // than failing. `.devcontainer` sets DEV_SERVER_HOST for that case;
      // outside a container nothing changes.
      host: process.env.DEV_SERVER_HOST === "true" || undefined,
      // The backend's routes, the same map as nginx/nginx.conf: the session is
      // a cookie, which only rides same-origin requests, so the dev server
      // proxies the backend rather than the page calling it across origins.
      proxy: {
        '/team': backend,
        '/game': backend,
        '/socket.io': { target: backend, ws: true },
      },
    },
  }
})
