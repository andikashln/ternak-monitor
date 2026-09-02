import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vite';

export default defineConfig(() => ({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sapi Papi Farm',
        short_name: 'Sapi Papi',
        description: 'Pencatatan dan monitoring operasional peternakan.',
        theme_color: '#5A2D1F',
        background_color: '#F5EFE6',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
  resolve: { alias: { '@': path.resolve(__dirname, '.') } },
  server: {
    host: '0.0.0.0', port: 5173,
    proxy: { '/api': { target: process.env.VITE_API_URL || 'http://localhost:3001', changeOrigin: true, rewrite: url => url.replace(/^\/api/, '/api') } },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
