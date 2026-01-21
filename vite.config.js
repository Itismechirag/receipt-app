import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'billtemplate.png'], // Add your background image here
      manifest: {
        name: 'Jeevan Jyoti Receipt App',
        short_name: 'JJ Receipts',
        description: 'Standalone Billing App for Hospital',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png', // You can use online generators to make these
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
});
