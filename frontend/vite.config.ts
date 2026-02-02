import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// When running in Docker, the frontend container cannot reach the backend via localhost.
// Use VITE_PROXY_TARGET=http://backend:8000 in docker-compose so the proxy forwards to the backend service.
const proxyTarget = process.env.VITE_PROXY_TARGET ?? 'http://localhost:8000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
      '/static': {
        target: proxyTarget,
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
