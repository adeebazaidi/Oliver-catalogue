import { defineConfig } from 'vite';

export default defineConfig({
  base: '/CatalogueGen/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    open: true,
  },
});
