import js from '@eslint/js'
import babelParser from '@babel/eslint-parser'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'

export default [
  { ignores: ['dist', 'playwright-report', 'test-results'] },
  {
    files: ['**/*.{ts,tsx}'],
    ...js.configs.recommended,
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: [['@babel/preset-typescript', { ignoreExtensions: true }]],
          plugins: ['@babel/plugin-syntax-jsx'],
        },
      },
    },
    plugins: { 'react-hooks': reactHooks, 'react-refresh': reactRefresh },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true, allowExportNames: ['useAuth'] },
      ],
    },
  },
]
