import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// https://vite.dev/config/
const backend = 'http://localhost:8000';

export default defineConfig(() => {
  process.env.VITE_GIT_COMMIT_HASH = execSync('git rev-parse HEAD').toString().trimEnd();

  return {
    plugins: [react()],
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
        '/games': backend,
        '/socket.io': { target: backend, ws: true },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            // Split game description files into a separate chunk
            // These contain the problem text that should only load when the game starts
            if (id.includes('/ReactClient.')) {
              return 'react-client';
            }
          }
        }
      }
    }
  }
})
