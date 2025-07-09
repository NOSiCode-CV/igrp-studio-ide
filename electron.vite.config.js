"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = require("path");
const electron_vite_1 = require("electron-vite");
const plugin_react_1 = __importDefault(require("@vitejs/plugin-react"));
exports.default = (0, electron_vite_1.defineConfig)({
    main: {
        plugins: [(0, electron_vite_1.externalizeDepsPlugin)()],
        build: {
            outDir: 'out/main',
            rollupOptions: {
                input: {
                    index: (0, path_1.resolve)(__dirname, 'src/main/index.ts'),
                },
            },
        },
        envPrefix: 'VITE_',
    },
    preload: {
        plugins: [(0, electron_vite_1.externalizeDepsPlugin)()],
        build: {
            outDir: 'out/preload',
        },
    },
    renderer: {
        resolve: {
            alias: {
                '@renderer': (0, path_1.resolve)('src/renderer/src'),
                path: 'path-browserify',
                'next/link': (0, path_1.resolve)(__dirname, 'src/renderer/src/__mocks__/nextLink.js'),
                'next/image': (0, path_1.resolve)(__dirname, 'src/renderer/src/__mocks__/nextImage.js'),
            },
        },
        define: {
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'development'),
        },
        plugins: [(0, plugin_react_1.default)()],
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
