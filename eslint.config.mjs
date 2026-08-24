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
  // packages/engine and packages/games are apps/strategy-practice code moved out of it, still
  // written in that app's dialect and composing its types. Two rules of this config
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
  // blind spot as above: `gameplay-react-free.spec.ts` in apps/strategy-practice watches what
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
  // no-explicit-any is on for the boardgame.io-facing code; what remains exempt
  // is the genuine interop core, per file. This list only shrinks: type a file,
  // delete its line — never add one. New code goes through the rule everywhere.
  {
    files: [
      // Copied bgio server internals whose types upstream does not export.
      'apps/online-backend/src/socketio_botmoves.ts',
      // Wire-shape casts on match state, pending a typed DTO field.
      'packages/common-frontend/src/client/components/TeamDetailDialog.tsx',
      // The client-factory family shares one untyped board/game plumbing shape;
      // its fix is the BoardProps<G> refactor the TODO in boardwrapper.tsx names,
      // and exempting only part of the family would be arbitrary.
      'apps/offline-frontend/src/client_factory.tsx',
      'packages/common-frontend/src/common/client_factory.tsx',
      'packages/common-frontend/src/common/myclient.ts',
      'apps/offline-frontend/src/myclient.ts',
      'packages/common-frontend/src/common/boardwrapper.tsx',
      // #224 lands first; the relay app joins the per-file ratchet after.
      'apps/relay-practise-frontend/**',
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
      // apps/strategy-practice is linted by its own eslint config, through its
      // own `npm run lint` — it keeps its own ESLint version and plugins (npm
      // nests them), which this config's flat resolution would not find.
      'apps/strategy-practice/**',
      // A frozen 2023 build output, kept byte for byte. See pages/valto-2023/README.md.
      'pages/**',
      // The assembled Pages artifact `npm run site:build` writes: every app's built
      // bundles, plus a copy of pages/. Gitignored, but eslint has its own ignore list
      // and would otherwise lint minified output the moment anyone previews the site.
      'site/**',
    ],
  }
);
