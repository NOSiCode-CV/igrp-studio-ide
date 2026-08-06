import react from '@vitejs/plugin-react'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import { resolve } from 'path'

const sharedAlias = {
    '@shared': resolve('src/shared')
}

export default defineConfig({
    main: {
        plugins: [externalizeDepsPlugin()],
        resolve: {
            alias: sharedAlias
        },
        build: {
            outDir: 'out/main',
            rollupOptions: {
                input: {
                    index: resolve(__dirname, 'src/main/index.ts')
                }
            }
        },
        envPrefix: 'VITE_'
    },
    preload: {
        plugins: [externalizeDepsPlugin()],
        build: {
            outDir: 'out/preload'
        }
    },
    renderer: {
        resolve: {
            alias: {
                '@renderer': resolve('src/renderer/src'),
                ...sharedAlias,
                path: 'path-browserify',
                'next/link': resolve(__dirname, 'src/renderer/src/__mocks__/next-link.js'),
                'next/image': resolve(__dirname, 'src/renderer/src/__mocks__/next-image.js'),
                'next/navigation': resolve(
                    __dirname,
                    'src/renderer/src/__mocks__/next-navigation.js'
                )
            }
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
            'import.meta.env.VITE_SENTRY_DSN': JSON.stringify(
                process.env.SENTRY_DSN || process.env.VITE_SENTRY_DSN || ''
            ),
            'import.meta.env.VITE_SENTRY_TEST': JSON.stringify(process.env.VITE_SENTRY_TEST || '')
        },
        plugins: [react()],
        optimizeDeps: {
            exclude: ['monaco-editor']
        },
        css: {
            postcss: './postcss.config.mjs'
        },
        build: {
            outDir: 'out/renderer',
            rollupOptions: {
                output: {
                    manualChunks: {
                        'monaco-editor': ['monaco-editor']
                    }
                }
            }
        },
        server: {
            fs: {
                strict: false
            }
        }
    }
})
