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
  // packages/engine is apps/practice's engine, moved out of it (Phase 1 of
  // docs/boardgame-io-replacement-plan.md). Two rules of this config disagree with the
  // conventions that code was written under, and rewriting it would turn a move into a
  // rewrite — they stay off here until the two ESLint setups are unified.
  {
    files: ['packages/engine/**/*.ts'],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
      // What the package is for. `import type` is allowed because it is erased: i18n.ts
      // has to name React's node type to say what a game's rule text may be, and naming
      // it costs a bare node nothing.
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [{
          group: ['react', 'react/*', 'react-*', '*.tsx', '**/*.tsx'],
          allowTypeImports: true,
          message: 'packages/engine runs with no framework attached; keep React on the app side.',
        }],
      }],
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
      // A frozen 2023 build output, kept byte for byte. See pages/valto-2023/README.md.
      'pages/**',
    ],
  }
);
