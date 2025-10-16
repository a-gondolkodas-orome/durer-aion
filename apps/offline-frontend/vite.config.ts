import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path';

export default defineConfig({
  base: process.env.PUBLIC_URL || '/',
  plugins: [react()],
  resolve: {
    alias: {
      "boardgame.io": path.resolve(__dirname, "../../node_modules/boardgame.io"),
      game: path.resolve(__dirname, "../../packages/game"),
      schemas: path.resolve(__dirname, "../../packages/schemas"),
      strategy: path.resolve(__dirname, "../../packages/strategy"),
      "common-frontend": path.resolve(__dirname, "../../packages/common-frontend"),
    },
    dedupe: ["react", "react-dom", "boardgame.io"], // ✅ avoid duplicate instances
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
    include: ["boardgame.io"], 
  },
  build: {
    rollupOptions: {
      // Don’t bundle test files
      external: [/\.test\.(t|j)sx?$/],
    },
  },
})
