import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Split description files into a separate chunk
          if (id.includes('packages/game/src/games/strategy') &&
              (id.includes('/main.tsx') || id.includes('/main.ts'))) {
            return 'game-descriptions';
          }
          // Split the descriptions wrapper into its own chunk
          if (id.includes('apps/online-frontend/src/descriptions')) {
            return 'descriptions';
          }
        }
      }
    }
  }
})
