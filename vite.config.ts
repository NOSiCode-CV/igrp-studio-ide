import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@main': path.resolve(__dirname, './src/main'),
      '@renderer': path.resolve(__dirname, './src/renderer/src'),
      '@assets': path.resolve(__dirname, './src/renderer/src/assets'),
      '@components': path.resolve(__dirname, './src/renderer/src/components'),
      '@hooks': path.resolve(__dirname, './src/renderer/src/hooks'),
      '@services': path.resolve(__dirname, './src/renderer/src/services'),
      '@utils': path.resolve(__dirname, './src/renderer/src/utils'),
      '@types': path.resolve(__dirname, './src/main/types')
    }
  }
})