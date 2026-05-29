import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  base: '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  server: {
    port: 3000,
    open: true,
  },
  worker: {
    format: 'es'
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Oliver Mc Inroy Catalogue',
        short_name: 'Catalogue',
        description: 'Premium Product Catalogue Generator',
        theme_color: '#1e3a8a',
        background_color: '#f8fafc',
        icons: [
          {
            src: 'https://via.placeholder.com/192x192.png?text=Catalogue',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'https://via.placeholder.com/512x512.png?text=Catalogue',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
