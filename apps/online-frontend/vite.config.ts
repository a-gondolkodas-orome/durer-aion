import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// https://vite.dev/config/
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
