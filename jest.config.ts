import type { Config } from 'jest'

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'tsx', 'js', 'json'],
    rootDir: './',
    // `.test.tsx` files run component tests (opt into jsdom per-file with a
    // `@jest-environment jsdom` docblock); plain `.test.ts` stay node.
    testRegex: '.*\\.test\\.tsx?$',
    transform: {
        // Force CommonJS output + node module resolution. Without this,
        // each `import` from `@igrp/*` may resolve to `dist/index.es.js`
        // which lives in a separate module context — `setEngineConfiguration`
        // and `newApi` would each get their own copy of the engine's
        // singleton state and the environment switch never propagates.
        '^.+\\.tsx?$': [
            'ts-jest',
            {
                tsconfig: {
                    module: 'commonjs',
                    moduleResolution: 'node',
                    target: 'es2020',
                    esModuleInterop: true,
                    skipLibCheck: true,
                    resolveJsonModule: true,
                    isolatedModules: true,
                    jsx: 'react-jsx'
                }
            }
        ]
    },
    moduleNameMapper: {
        '^electron$': '<rootDir>/__mocks__/electron.ts',
        // Mirror electron-vite's `@renderer` alias so renderer modules
        // (validation schemas, config components) are unit-testable.
        '^@renderer/(.*)$': '<rootDir>/src/renderer/src/$1',
        // uuid v13+ is ESM-only; Jest's require(ESM) needs Node ≥24.9.
        '^uuid$': '<rootDir>/__mocks__/uuid.ts'
    }
}

export default config
