import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig } from 'vite';
import { createServer } from './server/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
  return {
    base: '/engineerverse/',
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'express-api-server',
        configureServer(server) {
          try {
            const expressApp = createServer();
            server.middlewares.use(expressApp);
          } catch (err) {
            console.error('[Vite] Notice: Express API middleware initialization:', err.message || err);
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@shared': path.resolve(__dirname, './shared'),
        '@server': path.resolve(__dirname, './server'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      //
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
