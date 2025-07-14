import eslintPlugin from '@typescript-eslint/eslint-plugin';
import eslintParser from '@typescript-eslint/parser';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import prettierPlugin from 'eslint-plugin-prettier';

/** @type {import("eslint").Linter.FlatConfig[]} */
export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: eslintParser,
      ecmaVersion: 2020,
      sourceType: 'module',
      globals: {
        node: true,
      },
    },
    plugins: {
      '@typescript-eslint': eslintPlugin,
      'simple-import-sort': simpleImportSort,
      prettier: prettierPlugin,
    },
    rules: {
      'prettier/prettier': 'error',
      '@typescript-eslint/array-type': ['error', { default: 'generic' }],
      '@typescript-eslint/no-explicit-any': [
        'error',
        { ignoreRestArgs: true, fixToUnknown: true },
      ],
      'prefer-const': ['error', { destructuring: 'all', ignoreReadBeforeAssign: false }],
      'no-continue': 'error',
      'no-console': 'error',
      'func-names': ['error', 'as-needed'],
      'no-duplicate-imports': 'error',
      'simple-import-sort/imports': 'error',
      'simple-import-sort/exports': 'error',
    },
  },
];
