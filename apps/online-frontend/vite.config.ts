import { defineConfig, ConfigEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

// https://vite.dev/config/
export default defineConfig(({ mode }: ConfigEnv) => {
  const commitHash = execSync('git rev-parse HEAD').toString().trimEnd();

  process.env.VITE_GIT_COMMIT_HASH = commitHash;

  return {
    plugins: [react()],
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
