import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  base: './',
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: false
  },
  build: {
    outDir: '../docs',
    emptyOutDir: true,
    target: 'esnext',
    sourcemap: false
  }
});
