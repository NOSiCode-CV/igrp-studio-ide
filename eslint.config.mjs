import { defineConfig } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import tsParser from '@typescript-eslint/parser';
import typescriptPlugin from '@typescript-eslint/eslint-plugin';
import pluginReact from 'eslint-plugin-react';
import pluginReactHooks from 'eslint-plugin-react-hooks';
import pluginJest from 'eslint-plugin-jest';

export default defineConfig([
    // Global ignore
    {
        ignores: [
            '**/node_modules/**',
            '**/.next/**',
            '**/.turbo/**',
            '**/dist/**',
            '**/out/**',
            '**/.git/**',
            '**/.cache/**',
            'src/renderer/**',
        ],
    },
    // Recommended presets
    tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    // Base config
    {
        name: 'base',
        files: ['**/*.{js,ts,jsx,tsx,mjs,cjs}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                ecmaFeatures: { jsx: true },
                tsconfigRootDir: process.cwd(),
                warnOnUnsupportedTypeScriptVersion: false,
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },

        plugins: {
            js,
            '@typescript-eslint': typescriptPlugin,
            react: pluginReact,
            'react-hooks': pluginReactHooks,
        },
        settings: {
            react: { version: 'detect' },
        },
        rules: {
            // React
            'react/react-in-jsx-scope': 'off',
            'react/jsx-key': 'warn',
            'react/jsx-uses-vars': 'error',

            // React Hooks
            'react-hooks/rules-of-hooks': 'error',
            'react-hooks/exhaustive-deps': 'warn',

            // TypeScript
            '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            '@typescript-eslint/explicit-module-boundary-types': 'off',
            '@typescript-eslint/no-explicit-any': 'warn',

            // JS
            'no-unused-vars': 'off',
            'no-console': 'warn',
            'no-debugger': 'warn',
        },
    },

    // Jest config for test files
    {
        name: 'jest-tests',
        files: [
            '**!/__tests__/!**!/!*.{js,ts,jsx,tsx}',
            '**!/!*.{test,spec}.{js,ts,jsx,tsx}',
        ],
        plugins: {
            jest: pluginJest,
        },
        languageOptions: {
            globals: {
                ...globals.jest,
            },
        },
        rules: {
            'jest/no-focused-tests': 'error',
            'jest/no-disabled-tests': 'warn',
            'jest/expect-expect': 'warn',
        },
    },

    // Optional: renderer override
    {
        name: 'renderer-overrides',
        files: ['src/renderer/**/*.{js,ts,jsx,tsx}'],
        rules: {
            'no-console': 'off',
            '@typescript-eslint/no-unused-vars': 'off',
        },
    },


]);
