// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // Apply recommended rules to all files
  {
    files: ['**/*.{js,mjs,cjs,ts,tsx}'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      tseslint.configs.strict,
    ],
  },
  // Type-aware linting for source TypeScript files
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/*.config.{ts,mts}', '**/dist/**', '**/build/**'],
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-function': 'warn',
      '@typescript-eslint/no-empty-object-type': 'warn',
      'prefer-const': 'warn',
    },
  },
  // Build and repo tooling under scripts/ runs in Node, not the browser, so `process` and
  // `console` are globals rather than undefined names.
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly' },
    },
  },
  // Global ignores
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      '**/*.config.{js,mjs,cjs,ts}',
      // apps/practice is linted by its own eslint config, through its own
      // `npm run lint`. Until the workspaces are unified it is not part of
      // this repo's install, so linting it from here would resolve neither
      // its plugins nor its tsconfig.
      'apps/practice/**',
      // Hand-written pages the deploy copies verbatim, with no build step. See pages/README.md.
      'pages/**',
    ],
  }
);
