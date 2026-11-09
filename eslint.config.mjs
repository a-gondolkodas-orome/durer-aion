// @ts-check

import eslint from '@eslint/js';
import { defineConfig } from 'eslint/config';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';
import { quotesRule, stylisticPlugin, stylisticRules } from './eslint.stylistic.mjs';

const noBotMessage = 'The live client must not ship the bot: import `game` or `game/client` only.';

// The `game/bot` entry and every relative spelling of it, of the package's source
// and of its build: `../../packages/game/...` from an app, `../../game/...` from a
// sibling package, with or without an extension (`../../game/bot.js` resolves to
// bot.ts). See the block that uses it, below.
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

const noProblemsMessage =
  'The live client must not ship the relay problems: `relay-bot` and `problem-bank` carry their answers.';

// `relay-bot` and `problem-bank` both hold relay problems — each problem's text,
// its answer and what it is worth — so the live competition client must name
// neither, by the package, by a sub-entry (`problem-bank/all`,
// `problem-bank/banks/…`) or by any path to it. Neither is behind a sub-entry
// the way packages/game's bots are: the package *is* the secret, so the ban is
// on the package itself. The names are specific enough to ban any path segment
// spelled so: a generic one such as `competitions` would also catch the live
// client's own `./competitions/…` folder.
const noProblemsInTheClient = {
  group: ['relay-bot', 'problem-bank'].flatMap(name => [
    name, `${name}/**`,
    `**/${name}`, `**/${name}/**`,
  ]),
  message: noProblemsMessage,
};

// The same spellings for `import()`, which the core rule does not read at all —
// see the note on noDynamicBotImport above.
const noDynamicProblemsImport = {
  selector: 'ImportExpression > Literal[value=/(^|\\/)(relay-bot|problem-bank)($|\\/)/]',
  message: noProblemsMessage,
};

// vitest.config.mts turns vitest's globals on, and every tsconfig types them, so
// a suite does not import `describe`, `it`, `expect` or `vi`. `import type` stays
// allowed: `Mock` and its kin have no global.
const noVitestImport = {
  name: 'vitest',
  allowTypeImports: true,
  message: "vitest's test API is global here; import only types from 'vitest'.",
};

// The half of the type-aware block below that asks the type checker a question,
// as opposed to reading the syntax tree. Hoisted so the off-list that follows can be
// derived from it rather than written out a second time: the pair cannot drift the
// way two hand-kept lists do.
// They are also where the time goes — no-deprecated alone is 38% of rule time, and
// no-misused-promises another 19%.
const typeAwareRules = {
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
};

// For the files that are a data literal with a type annotation on it. Asking the
// checker what a 16,000-line `Record<number, Record<string, number[]>>` means, then
// asking again per rule, is most of what linting them costs — and none of these rules
// has anything to find in a table of numbers. `tsc` still checks each table against
// its annotation on every `npm run typecheck`, which is the check that catches a
// mis-pasted one; this only stops ESLint redoing it to no purpose.
//
// Off by name rather than by ignoring the files, for the reason eslint.stylistic.mjs
// gives about the formatting rules: the syntactic rules, and above all the import
// bans that keep a bot's tables out of the live bundle, must keep applying. Naming
// the rules is what keeps that distinction visible.
const typeAwareRulesOff = Object.fromEntries(
  Object.keys(typeAwareRules).map(rule => [rule, 'off'])
);

export default defineConfig(
  {
    files: ['**/*.{js,mjs,cjs,mts,ts,tsx}'],
    extends: [
      eslint.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      tseslint.configs.strict,
    ],
    // Pinned, not inferred, in both configs — even for the files here that no
    // type-aware rule touches. `npm run lint` gives each workspace its own process,
    // so each loads one config; but a bare `npx eslint .` at the root, and the
    // editor's server, still load this one and apps/strategy-practice's together,
    // and typescript-eslint refuses to guess between two candidate roots.
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname },
    },
  },
  // Type-aware linting for source TypeScript files.
  // `projectService`, not `project: true`: one TypeScript project service shared
  // across the run, rather than a program held open per tsconfig — and there are
  // eleven tsconfigs here. It is what typescript-eslint 8 recommends for this
  // shape. What brings the run inside a small machine's default heap is giving
  // each workspace its own process, so that a run holds one project rather than
  // eleven — turbo.json says how, and .devcontainer/README.md has the
  // measurements.
  {
    files: ['**/*.{ts,tsx}'],
    ignores: ['**/*.config.{ts,mts}', '**/dist/**', '**/build/**'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    // 'error', not 'warn': the lint script fails on any warning anyway
    // (--max-warnings=0), so 'warn' only made the editor and a bare `npx eslint`
    // disagree with CI. The cap stays as a backstop, so a rule added at 'warn'
    // severity later cannot quietly accumulate either.
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-empty-function': 'error',
      '@typescript-eslint/no-empty-object-type': 'error',
      'prefer-const': 'error',
      ...typeAwareRules,
    },
  },
  // The same three hook rules apps/strategy-practice's config sets for its own code.
  // Repo-wide rather than on packages/common-frontend alone: every React component
  // this config lints ships in one of the three bundles it serves.
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/set-state-in-effect': 'error',
    },
  },
  // packages/strategy-engine is apps/strategy-practice code moved out of it, still
  // written in that app's dialect: `!` stands in for a guard the game's rules already
  // make redundant, and auditing several hundred of those would turn a move into a
  // rewrite. Off in apps/strategy-practice's own config too, for the same code.
  {
    files: ['packages/strategy-engine/**/*.{ts,tsx}'],
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
  // board importing a strategy file; the packages/game blocks below pin that.
  //
  // The exemptions are written as `ignores`, never as a later block switching the
  // rules off, and the ban rides the core `no-restricted-imports` while the React
  // bans below use the typescript-eslint rule of the same name. Both for one reason:
  // a flat config replaces a rule's options wholesale, so a block that names a rule
  // for files another block also covers is a way to disarm it silently. The two
  // blocks here cover disjoint files. The core rule differs only in having no
  // `allowTypeImports`, which this ban has no use for: nothing outside the bot needs
  // to name a bot's types either. `.mts` and the rest of the extensions are in
  // because a config or a script is as able to import the bot as a source file is.
  //
  // The relay problems ride the same ban, for the same reason, with one more exempt
  // app: relay-practise-frontend is the public practice site, which serves past
  // years' problem sets, public already, so it names `relay-bot` on purpose. It keeps
  // the bot ban, in a block of its own.
  {
    files: ['**/*.{js,mjs,cjs,mts,ts,tsx}'],
    ignores: ['apps/online-backend/**', 'apps/offline-frontend/**', 'apps/relay-practise-frontend/**'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [noBotInTheClient, noProblemsInTheClient],
      }],
      'no-restricted-syntax': ['error', noDynamicBotImport, noDynamicProblemsImport],
    },
  },
  {
    files: ['apps/relay-practise-frontend/**/*.{js,mjs,cjs,mts,ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', { patterns: [noBotInTheClient] }],
      'no-restricted-syntax': ['error', noDynamicBotImport],
    },
  },
  // Inside packages/game, the same boundary as import allowlists: only strategy-bots.ts
  // names a bot, so nothing the `game` and `game/client` entries reach can be one. In a
  // game folder the rules and the board import nothing from beside them but ./game and
  // ./board, which covers a lookup table under any name; the shared registry imports
  // only game.ts, which keeps the boards out of the server too. These ride the
  // typescript-eslint rule because the block above already sets the core one for
  // these files, and a second block would replace its options.
  {
    files: ['packages/game/src/games/strategy/*/{game.ts,board.tsx,main.tsx}'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [{
          regex: '^\\./(?!(game|board)(\\.jsx?)?$)',
          message: "A game folder's rules and board import only ./game and ./board from beside them; what the bot and the board both need goes in game.ts.",
        }],
      }],
    },
  },
  {
    files: ['packages/game/src/games/strategy/strategy-games.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [{
          regex: '^\\./[^/]+/(?!game(\\.js)?$)',
          message: "The `game` entry's registry imports only a game folder's game.ts.",
        }],
      }],
    },
  },
  {
    files: ['packages/game/src/games/strategy/strategy-client.ts'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [{
          regex: '^\\./[^/]+/(?!(game|board|main)(\\.jsx?)?$)',
          message: 'Only strategy-bots.ts imports a bot.',
        }],
      }],
    },
  },
  // The core of the package is what a bare node server imports; its React client half
  // lives in src/react/ and react.ts, and is exempt — that is the whole point of the
  // split. The path patterns keep a relative import from reaching into either, which
  // covers every .tsx too: they all live under src/react/. `import type` is allowed
  // because it is erased: types.ts has to name React's node type to say what a game's
  // rule text may be, and naming it costs a bare node nothing.
  {
    files: ['packages/strategy-engine/**/*.ts'],
    ignores: ['packages/strategy-engine/react.ts', 'packages/strategy-engine/src/react/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [{
          group: ['react', 'react/*', 'react-*', '*.tsx', '**/*.tsx', '**/react', '**/react/**', '**/react.*'],
          allowTypeImports: true,
          message: 'packages/strategy-engine runs with no framework attached; keep React on the app side.',
        }],
        // The engine's suites are covered here rather than by the suites' block
        // below, which would replace this rule's options for them.
        paths: [noVitestImport],
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
    files: ['packages/strategy-engine/**/*.{ts,tsx}'],
    rules: quotesRule,
  },
  {
    // The problem banks — several thousand lines of past rounds' problems, each file
    // a pair of annotated literals. The formatting rules stay on for them; see
    // typeAwareRulesOff for why the checker rules come off.
    files: ['packages/problem-bank/banks/*.ts'],
    rules: typeAwareRulesOff,
  },
  // The suites, but for the engine's, which the block above covers, and
  // apps/strategy-practice's, which its own config covers.
  {
    files: ['**/*.test.{ts,tsx,mjs}'],
    ignores: ['packages/strategy-engine/**', 'apps/strategy-practice/**'],
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', { paths: [noVitestImport] }],
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
  // TypeScript checks undefined names itself, so no-undef is off for .ts; these are
  // .mjs, where it reads vitest's globals as undefined without this list.
  {
    files: ['scripts/**/*.test.mjs'],
    languageOptions: {
      globals: Object.fromEntries(
        ['describe', 'it', 'test', 'expect', 'vi', 'beforeAll', 'beforeEach', 'afterAll', 'afterEach']
          .map(name => [name, 'readonly'])
      ),
    },
  },
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
      // The Python environment README.md's admin script setup creates. Gitignored, so CI never
      // has one, but a local run would lint the JavaScript its packages vendor.
      '.venv/**',
    ],
  }
);
