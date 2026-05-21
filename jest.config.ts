import type { Config } from 'jest'

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'js', 'json'],
    rootDir: './',
    testRegex: '.*\\.test\\.ts$',
    transform: {
        // Force CommonJS output + node module resolution. Without this,
        // each `import` from `@igrp/*` may resolve to `dist/index.es.js`
        // which lives in a separate module context — `setEngineConfiguration`
        // and `newApi` would each get their own copy of the engine's
        // singleton state and the environment switch never propagates.
        '^.+\\.ts$': [
            'ts-jest',
            {
                tsconfig: {
                    module: 'commonjs',
                    moduleResolution: 'node',
                    target: 'es2020',
                    esModuleInterop: true,
                    skipLibCheck: true,
                    resolveJsonModule: true,
                    isolatedModules: true
                }
            }
        ]
    },
    moduleNameMapper: {
        '^electron$': '<rootDir>/__mocks__/electron.ts'
    }
}

export default config
