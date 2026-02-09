import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const phpBase = env.VITE_PHP_API_BASE_URL || 'http://localhost:8080'

  return {
    plugins: [react(), tailwindcss()],
    appType: 'spa',
    server: {
      proxy: {
        // Avoid CORS: browser calls same origin /api/*, Vite proxies to PHP backend
        '/api': {
          target: phpBase,
          changeOrigin: true,
        },
      },
    },
  }
})
