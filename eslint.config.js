import reactHooks from 'eslint-plugin-react-hooks';
import typescript from '@typescript-eslint/eslint-plugin';
import reactPlugin from 'eslint-plugin-react';
import tsParser from '@typescript-eslint/parser';
import globals from 'globals';

export default [
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
      '@typescript-eslint': typescript,
      'react': reactPlugin
    },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true
        }
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    settings: {
      react: {
        version: 'detect'
      }
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'react/react-in-jsx-scope': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['warn']
    }
  }
];
