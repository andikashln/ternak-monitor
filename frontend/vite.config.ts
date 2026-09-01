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
        theme_color: '#174a3a',
        background_color: '#f5fbf7',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/icons/sapi-papi-192.svg', sizes: '192x192', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icons/sapi-papi-512.svg', sizes: '512x512', type: 'image/svg+xml', purpose: 'any maskable' },
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
  build: {
    chunkSizeWarningLimit: 550,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom'],
          'vendor-lucide': ['lucide-react'],
          'vendor-jspdf': ['jspdf', 'jspdf-autotable'],
          'vendor-excel': ['read-excel-file', 'write-excel-file'],
          'vendor-http': ['axios'],
        },
      },
    },
  },
  server: {
    host: '0.0.0.0', port: 5173,
    proxy: { '/api': { target: process.env.VITE_API_URL || 'http://localhost:3001', changeOrigin: true, rewrite: url => url.replace(/^\/api/, '/api') } },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
}));
