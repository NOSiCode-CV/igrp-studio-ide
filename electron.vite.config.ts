import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/main', // Output directory for the main process
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'), // Entry file for the main process
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/preload', // Output directory for the preload script
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'), // Define the `process.env`
    },
    plugins: [react()],
    build: {
      outDir: 'dist/renderer', // Output directory for the renderer process
    },
  },
});