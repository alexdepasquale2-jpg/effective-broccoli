import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: 5173,
    // The game server owns /api and /ws; proxying keeps the browser on one
    // origin in dev, so the session cookie behaves the same as in production.
    proxy: {
      '/api': { target: 'http://localhost:8080', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8080', ws: true },
    },
  },
  build: { outDir: 'dist-web' },
});
