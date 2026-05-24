import react from 'eslint-plugin-react';
import tsParser from '@typescript-eslint/parser';

export default [
  {
    files: ['src/**/*.{js,ts,tsx}'],
    plugins: { react },
    rules: {
      'comma-dangle': ['error', 'never'],
      'curly': ['error', 'multi-line'],
      'max-len': ['error', { code: 120, ignoreUrls: true }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'no-trailing-spaces': 'error',
      'no-var': 'warn',
      'object-curly-newline': ['error', { 'consistent': true }],
      'object-property-newline': ['error', { 'allowAllPropertiesOnSameLine': true }],
      'array-bracket-newline': ['error', 'consistent'],
      'array-element-newline': ['error', 'consistent'],
      'react/jsx-key': ['error']
    }
  },
  {
    files: ['src/**/*.js'],
    languageOptions: {
      parserOptions: {
        ecmaFeatures: { jsx: true }
      }
    }
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tsParser
    }
  },
  {
    // SVG files contain inline path data that cannot be meaningfully reformatted
    files: ['src/**/*-svg.js'],
    rules: { 'max-len': 'off' }
  },
  {
    // test files may contain nicely formatted arrays such as for tictactoe
    files: ['src/**/*spec.js'],
    rules: { 'array-element-newline': 'off' }
  }
];
