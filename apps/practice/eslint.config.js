import reactPlugin from '@eslint-react/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';

export default [
  {
    files: ['src/**/*.{js,ts,tsx}'],
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
    // run in plain Node. See docs/real-competitions-plan.md.
    files: ['src/components/games/**/gameplay.ts', 'src/components/strategy-game-factory/engine/**/*.ts'],
    plugins: { '@typescript-eslint': tsPlugin },
    languageOptions: { parser: tsParser },
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
    files: ['src/**/*-svg.{js,ts,tsx,jsx}'],
    rules: { 'max-len': 'off' }
  },
  {
    // test files may contain nicely formatted arrays such as for tictactoe
    files: ['src/**/*spec.{js,ts}'],
    rules: { 'array-element-newline': 'off' }
  }
];
