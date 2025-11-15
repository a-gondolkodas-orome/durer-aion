import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
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
})
