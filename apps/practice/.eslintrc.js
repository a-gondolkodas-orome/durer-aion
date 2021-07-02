module.exports = {
  root: true,
  env: {
    node: true
  },
  extends: [
    'plugin:vue/strongly-recommended',
    'eslint:recommended',
    'plugin:jest/recommended'
  ],
  rules: {
    'no-console': 'error',
    'no-debugger': 'error',
    'curly': ['error', 'multi-line'],
    'operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before' } }]
  },
  parserOptions: {
    parser: 'babel-eslint'
  },
  overrides: [
    {
      files: ['*.spec.js'],
      env: {
        jest: true
      }
    }
  ]
};
