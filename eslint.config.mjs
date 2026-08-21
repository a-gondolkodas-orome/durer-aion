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
    // 'error', not 'warn': the lint script fails on any warning anyway
    // (--max-warnings=0), so 'warn' only made the editor and a bare `npx eslint`
    // disagree with CI. These were warnings while the repo had violations to
    // surface without blocking; it no longer does. The cap stays as a backstop,
    // so a rule added at 'warn' severity later cannot quietly accumulate either.
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/no-empty-object-type': 'error',
      'prefer-const': 'error',
    },
  },
  // packages/engine and packages/games are apps/practice code moved out of it (Phases
  // 1-2 of docs/boardgame-io-replacement-plan.md), and packages/competition is new code
  // written in the same dialect, composing the engine's types. Two rules of this config
  // disagree with the conventions that code follows, and rewriting it would turn a move
  // into a rewrite — they stay off here until the two ESLint setups are unified.
  {
    files: [
      'packages/engine/**/*.{ts,tsx}',
      'packages/games/**/*.{ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/consistent-type-definitions': 'off',
    },
  },
  // The core of the package is what a bare node server imports; its React client half
  // lives in src/react/ and is exempt — that is the whole point of the split. What this
  // rule cannot see is a relative import resolving into src/react/; the walk in
  // packages/engine/src/react-free.spec.ts pins that. `import type` is allowed because
  // it is erased: i18n.ts has to name React's node type to say what a game's rule text
  // may be, and naming it costs a bare node nothing.
  {
    files: ['packages/engine/**/*.ts'],
    ignores: ['packages/engine/react.ts', 'packages/engine/src/react/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [{
          group: ['react', 'react/*', 'react-*', '*.tsx', '**/*.tsx'],
          allowTypeImports: true,
          message: 'packages/engine runs with no framework attached; keep React on the app side.',
        }],
      }],
    },
  },
  // A game's .ts half — gameplay, bot, curated start boards — is what a competition
  // server validates moves and plays bot turns with, so it runs in plain Node; only
  // the game's .tsx (its board client and config) may be React-flavoured. Same
  // blind spot as above: `gameplay-react-free.spec.ts` in apps/practice watches what
  // a relative import resolves to.
  {
    files: ['packages/games/**/*.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [{
          group: ['react', 'react/*', 'react-*', '*.tsx', '**/*.tsx'],
          allowTypeImports: true,
          message: 'A game\'s .ts half runs in plain Node; move anything React-flavoured into the game .tsx.',
        }],
      }],
    },
  },
  // The boardgame.io-era code, which the migration replaces (Phases 3-5 of
  // docs/boardgame-io-replacement-plan.md) and Phase 7 deletes. Its 106 `any`s are bgio
  // interop nobody will type out before the deletion, and as warnings they only buried the
  // signal — every new warning showed up below them. Off here, and zero-tolerance
  // (--max-warnings=0) everywhere else, is the trade that keeps the gate meaningful.
  {
    files: [
      'apps/offline-frontend/**',
      'apps/online-frontend/**',
      'apps/online-backend/**',
      'packages/game/**',
      'packages/strategy/**',
      'packages/common-frontend/**',
    ],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
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
