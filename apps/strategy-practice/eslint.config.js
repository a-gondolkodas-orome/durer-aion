import reactPlugin from '@eslint-react/eslint-plugin';
import reactHooks from 'eslint-plugin-react-hooks';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
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
      'comma-dangle': ['error', 'never'],
      'curly': ['error', 'multi-line'],
      'max-len': ['error', { code: 120, ignoreUrls: true }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'no-trailing-spaces': 'error',
      'no-var': 'error',
      'object-curly-newline': ['error', { 'consistent': true }],
      'object-property-newline': ['error', { 'allowAllPropertiesOnSameLine': true }],
      'quotes': ['error', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'array-bracket-newline': ['error', 'consistent'],
      'array-element-newline': ['error', 'consistent'],
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
    rules: { 'array-element-newline': 'off' }
  }
];
