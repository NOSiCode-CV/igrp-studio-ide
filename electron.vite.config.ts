import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/main',
      rollupOptions: {
        input: {
          index: resolve(__dirname, 'src/main/index.ts'),
        },
      },
    },
    envPrefix: 'VITE_',
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: 'out/preload',
    },
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src'),
        path: 'path-browserify',
        'next/link': resolve(__dirname, 'src/renderer/src/__mocks__/nextLink.js'),
        'next/image': resolve(__dirname, 'src/renderer/src/__mocks__/nextImage.js'),
      },
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
    },
    plugins: [react()],
    optimizeDeps: {
      exclude: ['monaco-editor', 'next/link', 'next/image']
    },
    css: {
      postcss: './postcss.config.mjs',
    },
    build: {
      outDir: 'out/renderer',
      rollupOptions: {
        external: ['next/link', 'next/image'],
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