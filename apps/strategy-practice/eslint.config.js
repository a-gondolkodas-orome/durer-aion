import js from '@eslint/js';
import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';
import reactPlugin from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

// The house spelling: rules that say the same thing about any file, whatever it
// holds. Shared rather than repeated — the TypeScript under src/ and this app's
// own JavaScript are both held to it.
const houseStyle = {
  'comma-dangle': ['error', 'never'],
  'max-len': ['error', { code: 120, ignoreUrls: true }],
  'no-debugger': 'error',
  'no-duplicate-imports': 'error',
  'no-multiple-empty-lines': ['error', { max: 2 }],
  'no-trailing-spaces': 'error',
  'no-var': 'error',
  'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }]
};

// How code breaks across lines. Tuned for components — nested JSX props and
// option objects — and applied only to them: the same rules run over a dense
// numeric script explode a hand-aligned matrix into one entry per line, and
// brace a `for` chain written deliberately as one expression. Same reason
// max-len is off for *-svg and array-element-newline for specs, below.
const layout = {
  'curly': ['error', 'multi-line'],
  'object-curly-newline': ['error', { 'consistent': true }],
  'object-property-newline': ['error', { 'allowAllPropertiesOnSameLine': true }],
  'array-bracket-newline': ['error', 'consistent'],
  'array-element-newline': ['error', 'consistent']
};

export default defineConfig(
  // The same four presets the root eslint.config.mjs extends. Until these were
  // added this app ran 27 rules to the root's 97, and the missing 70 were not
  // dialect: no-fallthrough, no-dupe-else-if, no-invalid-regexp and the rest of
  // the baseline never ran over the game logic, which is the code where a wrong
  // branch decides a competition.
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      tseslint.configs.stylistic,
      tseslint.configs.strict
    ],
    // See the matching note in the root eslint.config.mjs: with both configs in
    // one process this has to be named rather than inferred.
    languageOptions: {
      parserOptions: { tsconfigRootDir: import.meta.dirname }
    }
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'error',
      'react-hooks/set-state-in-effect': 'error'
    }
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { '@eslint-react': reactPlugin },
    rules: {
      ...houseStyle,
      ...layout,
      '@eslint-react/no-missing-key': ['error']
    }
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: true,
        tsconfigRootDir: import.meta.dirname
      }
    },
    rules: {
      'no-unused-vars': 'off',
      // A parameter whose slot is fixed by a contract has to be written even
      // when unused — a move's `meta` sits before its game-specific args. `^_`
      // is how such a parameter says it is ignored on purpose; `args: 'all'`
      // is what stops an ordinary name from going unnoticed in that slot.
      '@typescript-eslint/no-unused-vars': ['error', {
        args: 'all',
        argsIgnorePattern: '^_',
        caughtErrors: 'all',
        caughtErrorsIgnorePattern: '^_'
      }],
      '@typescript-eslint/consistent-type-imports': 'error',
      // 448 of them, across 175 files: this code leans on `!` to say "the rules
      // guarantee this square is on the board", and each one is a judgement about
      // what the right guard would be rather than a mechanical edit. The root
      // config already turns this rule off for packages/engine and packages/games
      // — this app's code, moved out — so leaving it on here is what would be
      // inconsistent. Turning it on is a project of its own.
      '@typescript-eslint/no-non-null-assertion': 'off',
      // Off here for the same reason the root config turns it off for
      // packages/engine and packages/games — this app's code, moved out, in this
      // app's dialect. 78 violations, every one mechanically fixable; the next
      // commit fixes all three workspaces and removes both exemptions.
      '@typescript-eslint/consistent-type-definitions': 'off',
      // The same type-aware rules as the root eslint.config.mjs, kept in step
      // with it — this config lints what that one skips.
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
      'no-restricted-syntax': ['error', {
        selector: 'TSAsExpression > TSNeverKeyword.typeAnnotation',
        message: "'as never' is not allowed; use a more specific type or fix the underlying type instead."
      }]
    }
  },
  {
    // The React-free half of the repo, which has to run in plain Node
    // (AGENTS.md § Files in a game folder). Beyond each game's gameplay.ts that
    // is start-boards.ts, the curated data a competition hands out, and the .ts
    // half of games/shared/ — its *-svg.tsx siblings are deliberately unmatched.
    // The engine's own React-free half is no longer here to list; it is guarded
    // by the root config, which is what lints packages/engine.
    files: [
      'src/components/games/**/gameplay.ts',
      'src/components/games/**/start-boards.ts',
      'src/components/games/shared/**/*.ts'
    ],
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      '@typescript-eslint/no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['react', 'react/*', 'react-*', '*.tsx', '**/*.tsx'],
            message: 'Must stay framework-free; move anything React-flavoured into the game .tsx.'
          },
          {
            group: ['**/strategy-game-factory', '**/strategy-game-factory/index'],
            allowTypeImports: true,
            message: 'Only types may come from the strategy-game-factory barrel — it pulls in React.'
          }
        ]
      }]
    }
  },
  {
    // SVG files contain inline path data that cannot be meaningfully reformatted
    files: ['src/**/*-svg.{ts,tsx}'],
    rules: { 'max-len': 'off' }
  },
  {
    // test files may contain nicely formatted arrays such as for tictactoe
    files: ['src/**/*spec.{ts,tsx}'],
    rules: {
      'array-element-newline': 'off',
      // `() => {}` as a prop or a stubbed DOM method is a test double saying "this
      // is never called, and if it is, do nothing" — which is the assertion. In
      // application code an empty function is a hole; here it is the point.
      '@typescript-eslint/no-empty-function': 'off'
    }
  },
  // This app's own JavaScript: the Vite config, this config, the repo scripts and
  // the skill driver. None of the blocks above reach it — they are all src/*.ts(x)
  // — so until this block existed ESLint governed these files with no rules at
  // all, reporting them clean because it checked them for nothing. Not type-aware:
  // tsconfig.json is `include: ["src"]`, so `project: true` would reject them.
  {
    files: [
      'scripts/**/*.mjs',
      'src/**/*.mjs',
      '.claude/**/*.mjs',
      'vite.config.js',
      'eslint.config.js'
    ],
    languageOptions: {
      globals: { process: 'readonly', console: 'readonly', URL: 'readonly', fetch: 'readonly' }
    },
    rules: { ...js.configs.recommended.rules, ...houseStyle }
  },
  // The pre-generated AI move tables are built by CommonJS scripts; package.json
  // is `"type": "module"`, so the .cjs extension is what makes them so.
  {
    files: ['scripts/**/*.cjs'],
    languageOptions: {
      globals: { module: 'readonly', require: 'readonly', console: 'readonly', __dirname: 'readonly' }
    },
    rules: { ...js.configs.recommended.rules, ...houseStyle }
  },
  // These one-off generators write their search as blocks of parallel lines — four
  // compass directions, the same guard on each. Wrapping them to 120 turns eight
  // lines into twenty-four and hides the symmetry that shows the walk covers every
  // direction, which is the only reason the code is readable at all.
  {
    files: ['scripts/pre-generate-ai-moves/**'],
    rules: { 'max-len': 'off' }
  },
  // vite.config.js sets `test.globals: true`, so these specs take describe/it/expect
  // from the environment. The root's scripts/*.test.mjs import them from 'vitest'
  // instead — the two conventions differ, and this is the one that needs declaring.
  {
    files: ['scripts/**/*.spec.mjs'],
    languageOptions: {
      globals: { describe: 'readonly', it: 'readonly', expect: 'readonly' }
    }
  },
  // The root config's `**/dist/**` does not reach in here: ESLint picks a directory's
  // config from its *parent*, so everything under this one is judged by this file.
  {
    ignores: ['dist/**', 'coverage/**']
  }
);
