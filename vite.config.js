import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  root: 'client',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    rollupOptions: { input: { home: path.resolve('client/index.html'), detail: path.resolve('client/detail.html') } },
    outDir: '../dist',
    emptyOutDir: true
  }
});
