import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
// import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(({ command }) => ({
  plugins: [
    react()
    // visualizer({ open: true })
  ],
  base: command === 'build' ? '/durer-jatekok/' : '/',
  build: {
    rollupOptions: {
      output: {
        // Define manual chunks to keep each chunk under the recommended 500kb
        manualChunks: (id) => {
          if (id.includes('node_modules/react')) {
            return 'react-vendor';
          }
          if (id.includes('node_modules/lodash')) {
            return 'lodash';
          }
          // has a big bot-strategy file
          if (id.includes('remove-divisor-multiple')) {
            return 'remove-divisor-multiple';
          }
          // has a relatively big svg that should only be loaded if necessary
          if (id.includes('shark-chase')) {
            return 'shark-chase';
          }
        }
      }
    }
  },
  esbuild: {
    include: /\.js$/,
    exclude: [],
    loader: 'jsx'
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx'
      }
    }
  },
  server: {
    host: true,
    port: 8012,
    watch: {
      usePolling: true
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    clearMocks: true,
    restoreMocks: true
  }
}));
