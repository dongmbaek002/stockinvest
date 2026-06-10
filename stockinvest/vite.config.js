import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/yahoo': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        rewrite: (path) => {
          try {
            const url = new URL(path, 'http://localhost');
            const ticker = url.searchParams.get('ticker');
            const range = url.searchParams.get('range');
            const interval = url.searchParams.get('interval');
            
            if (ticker && range && interval) {
              return `/v8/finance/chart/${encodeURIComponent(ticker)}?range=${range}&interval=${interval}`;
            }
            return path;
          } catch (e) {
            return path;
          }
        }
      }
    }
  }
})
