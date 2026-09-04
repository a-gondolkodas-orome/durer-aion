// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import { quotesRule, stylisticPlugin, stylisticRules, stylisticRulesOff } from './eslint.stylistic.mjs';

const noBotMessage = 'The live client must not ship the bot: import `game` or `game/client` only.';

// The `game/bot` entry and every relative spelling of it, of the package's source
// and of its build: `../../packages/game/...` from an app, `../../game/...` from a
// sibling package, with or without an extension (`../../game/bot.js` resolves to
// bot.ts and used to slip through). See the block that uses it, below.
const noBotInTheClient = {
  group: [
    'game/bot',
    '**/packages/game/**',
    '**/game/bot', '**/game/bot.*',
    '**/game/src/**', '**/game/dist/**',
  ],
  message: noBotMessage,
};

// The same spellings once more, for `import()`. no-restricted-imports reads import
// and export *declarations* only — the core rule has no ImportExpression case at all
// — so `await import('game/bot')` walked straight past it and would have handed the
// browser a lazy chunk of the bot.
const noDynamicBotImport = {
  selector: 'ImportExpression > Literal[value=/(^|\\/)game\\/(bot($|\\.)|src\\/|dist\\/)|packages\\/game\\//]',
  message: noBotMessage,
};

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
  // The live client must not ship the bot. packages/game keeps its bots behind the
  // `game/bot` entry, so the rule is about naming it: nothing may import `game/bot`,
  // nor reach into packages/game by path, except the server and the offline dry run,
  // which this block's `ignores` exempts. The ban is repo-wide rather than on
  // apps/online-frontend alone because the served bundle is more than that app:
  // packages/common-frontend is in it too, and an import there would ship the bot
  // just the same. The path patterns cover both ways a relative import can spell the
  // package: through `packages/` from an app, and as a sibling (`../../game/...`)
  // from another package. What the rule cannot see is the package's own graph — a
  // board importing a strategy file; the walk in packages/game/src/entries.test.ts
  // pins that.
  //
  // The two exempt apps are named here rather than in a second block switching the
  // rules off, and the ban rides the core `no-restricted-imports` while the React
  // bans below use the typescript-eslint rule of the same name. Both for one reason:
  // a flat config replaces a rule's options wholesale, so every extra block naming a
  // rule is another way to disarm it silently — one block, and a rule name nothing
  // else sets, cannot be. The core rule differs only in having no `allowTypeImports`,
  // which this ban has no use for: nothing outside the bot needs to name a bot's
  // types either. `.mts` and the rest of the extensions are in because a config or a
  // script is as able to import the bot as a source file is.
  {
    files: ['**/*.{js,mjs,cjs,mts,ts,tsx}'],
    ignores: ['apps/online-backend/**', 'apps/offline-frontend/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [noBotInTheClient],
      }],
      'no-restricted-syntax': ['error', noDynamicBotImport],
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
  // Formatting, shared with apps/strategy-practice's config — see eslint.stylistic.mjs
  // for what belongs in that list and why it is rules rather than prettier. `--fix`
  // applies all of it, which is what the editor runs on save.
  {
    files: ['**/*.{js,mjs,cjs,mts,ts,tsx}'],
    plugins: stylisticPlugin,
    rules: stylisticRules,
  },
  {
    // Quote style, for the same two packages the block above exempts from
    // no-non-null-assertion and for the same reason: this is apps/strategy-practice
    // code, moved out, and that app has enforced single quotes all along. Both
    // already comply, so this rewrites nothing and keeps it that way. The rest of
    // the repo never had the rule and never settled — see eslint.stylistic.mjs.
    files: [
      'packages/engine/**/*.{ts,tsx}',
      'packages/games/**/*.{ts,tsx}',
    ],
    rules: quotesRule,
  },
  {
    // Written by a generator that has to reproduce them byte for byte:
    // remove-divisor-multiple's table says so at the top of the file, and moveMap
    // is what generateStrategy.py beside it prints. See eslint.stylistic.mjs.
    files: [
      'packages/games/src/remove-divisor-multiple/bot-strategy.ts',
      'packages/game/src/games/strategy/stones/moveMap.ts',
    ],
    rules: stylisticRulesOff,
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
