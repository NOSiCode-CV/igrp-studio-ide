import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/main',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
        },
      },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'dist/preload',
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    plugins: [react(),  tailwindcss()],
    optimizeDeps: {
      exclude: ['monaco-editor']
    },
    css: {
      postcss: './postcss.config.mjs',
    },
    build: {
      outDir: 'dist/renderer',
      rollupOptions: {
        output: {
          manualChunks: {
            'monaco-editor': ['monaco-editor']
          }
        },
      },
    },
    server: {
      fs: {
        strict: false,
      },
    },
  },
});