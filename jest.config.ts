import type { Config } from 'jest'

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions: ['ts', 'js', 'json'],
    rootDir: './',
    testRegex: '.*\\.test\\.ts$',
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    moduleNameMapper: {
        '^electron$': '<rootDir>/__mocks__/electron.ts'
    }
}

export default config
