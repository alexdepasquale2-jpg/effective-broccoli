import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    outDir: 'dist-web',
    // One JS chunk and no separate assets, so the post-build step can inline
    // the whole thing into a single self-contained page.
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
        entryFileNames: 'bundle.js',
        assetFileNames: 'bundle.[ext]',
      },
    },
  },
});
