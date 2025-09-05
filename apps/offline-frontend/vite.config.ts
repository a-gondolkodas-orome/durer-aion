import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      game: path.resolve(__dirname, "../../packages/game"),
      schemas: path.resolve(__dirname, "../../packages/schemas"),
      strategy: path.resolve(__dirname, "../../packages/strategy"),
      "common-frontend": path.resolve(__dirname, "../../packages/common-frontend"),
    },
    preserveSymlinks: true, // this is needed to make sure that linked packages are properly resolved (like game and schemas
  },
  server: {
    fs: {
      allow: [
        "..", // allow Vite to serve files outside project root
      ],
    },
  },
  optimizeDeps: {
    exclude: ["game", "schemas", "strategy", "common-frontend"],
  },
})
