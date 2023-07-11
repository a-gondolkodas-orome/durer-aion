const react = require('eslint-plugin-react');

module.exports = [{
  files: ['src/**/*.js'],
  plugins: {
    react
  },
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      }
    }
  },
  rules: {
    'arrow-spacing': 'error',
    'comma-dangle': ['error', 'never'],
    'curly': ['error', 'multi-line'],
    'eqeqeq': ['warn', 'always'],
    'max-len': ['error', { code: 120, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreComments: true }],
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-multiple-empty-lines': ['error', { max: 2 }],
    'no-trailing-spaces': 'error',
    'no-var': 'warn',
    'object-curly-spacing': ['warn', 'always'],
    'semi': 'warn'
  }
}];
