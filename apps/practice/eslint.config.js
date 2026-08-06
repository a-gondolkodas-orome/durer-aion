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
      'no-var': 'warn',
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
      parser: tsParser
    },
    rules: {
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-restricted-syntax': ['error', {
        selector: 'TSAsExpression > TSNeverKeyword.typeAnnotation',
        message: "'as never' is not allowed; use a more specific type or fix the underlying type instead."
      }]
    }
  },
  {
    // A game's gameplay.ts is its framework-free half — the module a future
    // server-authoritative competition mode validates moves with, so it has to
    // run in plain Node. See issue #313. The .ts half of games/shared/ is
    // engine-shaped for the same reason; its *-svg.tsx siblings are not matched.
    files: [
      'src/components/games/**/gameplay.ts',
      'src/components/games/shared/**/*.ts',
      'src/components/strategy-game-factory/engine/**/*.ts'
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
