// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

export default defineConfig(
  // Apply recommended rules to all files
  {
    files: ['**/*.{js,mjs,cjs,mts,ts,tsx}'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      tseslint.configs.strict,
    ],
    // Pinned, not inferred. One `eslint .` loads this config and
    // apps/strategy-practice's in the same process, so typescript-eslint sees two
    // candidate roots and refuses to guess — even for the files here that no
    // type-aware rule touches. Both configs name their own root explicitly.
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
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
      // An object interpolated into a string prints `[object Object]`, which is
      // never what the message meant to say.
      '@typescript-eslint/no-base-to-string': 'error',
      // A promise nobody waits for: the caller reports success before the work has
      // landed, and a failure surfaces only as an unhandled rejection.
      '@typescript-eslint/no-floating-promises': 'error',
      // `for…in` over an array walks its keys as strings, and its own properties
      // too. No violations today; this keeps it that way.
      '@typescript-eslint/no-for-in-array': 'error',
      // A deprecated API still compiles; this is the only thing that says so before
      // the removal lands.
      '@typescript-eslint/no-deprecated': 'error',
      // An async function handed to something that ignores what it returns: React
      // event handlers, addEventListener, Array.forEach. The await never happens.
      '@typescript-eslint/no-misused-promises': 'error',
      // A type assertion the compiler already knows is redundant. Deleting them is
      // what keeps the ones that remain worth reading: a stray `!` is where a null
      // dereference hides.
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      // A catch callback's parameter is implicitly `any`, so reading `.message` off
      // it yields undefined for anything that is not an Error — and the UI shows an
      // empty error where the reason should be.
      '@typescript-eslint/use-unknown-in-catch-callback-variable': 'error',
    },
  },
  // packages/engine and packages/games are apps/strategy-practice code moved out of it,
  // still written in that app's dialect: `!` stands in for a guard the game's rules
  // already make redundant, and auditing several hundred of those would turn a move
  // into a rewrite. Off in apps/strategy-practice's own config too, for the same code.
  {
    files: [
      'packages/engine/**/*.{ts,tsx}',
      'packages/games/**/*.{ts,tsx}',
    ],
    rules: {
      '@typescript-eslint/no-non-null-assertion': 'off',
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
  // Build and repo tooling under scripts/ runs in Node, not the browser, so `process`, `console`,
  // `URL` and `fetch` are globals rather than undefined names.
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly', URL: 'readonly', fetch: 'readonly' },
    },
  },
  // Global ignores
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/node_modules/**',
      // Hand-written pages the deploy copies verbatim, with no build step. See pages/README.md.
      'pages/**',
      // The assembled Pages artifact `npm run site:build` writes: every app's built
      // bundles, plus a copy of pages/. Gitignored, but eslint has its own ignore list
      // and would otherwise lint minified output the moment anyone previews the site.
      'site/**',
    ],
  }
);
