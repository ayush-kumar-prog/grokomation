import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Twitter Bearer Token (for demo - proxy adds this to all requests)
const TWITTER_TOKEN = 'AAAAAAAAAAAAAAAAAAAAAP9M7AEAAAAAQ1YUSSOHBX1HL6MDRjTosOwlDhY=PPyGMGnKYpGusSydUSltyXtQo78h4sZZJNObyHzGnq1NUU90lr';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Allow connections from any origin (for bookmarklet on x.com)
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    },
    proxy: {
      // Proxy X/Twitter API requests to bypass CORS
      '/api/twitter': {
        target: 'https://api.twitter.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/twitter/, ''),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq) => {
            // Add the bearer token to all proxied requests
            proxyReq.setHeader('Authorization', `Bearer ${TWITTER_TOKEN}`);
          });
          proxy.on('proxyRes', (proxyRes) => {
            // Add CORS headers to response
            proxyRes.headers['Access-Control-Allow-Origin'] = '*';
            proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
            proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
          });
        },
      },
    },
  },
})
