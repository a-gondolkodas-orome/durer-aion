import react from 'eslint-plugin-react';

export default [
  {
    files: ['src/**/*.js'],
    plugins: { react },
    languageOptions: {
      parserOptions: {
        ecmaFeatures: {
          jsx: true
        }
      }
    },
    rules: {
      'comma-dangle': ['error', 'never'],
      'curly': ['error', 'multi-line'],
      'max-len': ['error', { code: 120, ignoreStrings: true, ignoreTemplateLiterals: true, ignoreComments: true }],
      'no-debugger': 'error',
      'no-duplicate-imports': 'error',
      'no-multiple-empty-lines': ['error', { max: 2 }],
      'no-trailing-spaces': 'error',
      'no-var': 'warn'
    }
  }
];
