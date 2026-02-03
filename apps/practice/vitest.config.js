import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react()
  ],
  esbuild: {
    include: /\.js$/,
    exclude: [],
    loader: 'jsx'
  },
  test: {
    globals: true,
    environment: 'jsdom',
    clearMocks: true,
    restoreMocks: true
  }
})
