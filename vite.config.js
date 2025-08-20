import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import path from 'path';

// Get the current directory equivalent to __dirname
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Vite Configuration
export default defineConfig({
  plugins: [react()],
  server: {
    port: 4000,
    open: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
