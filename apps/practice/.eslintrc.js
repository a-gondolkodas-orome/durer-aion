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
    'arrow-parens': ['error', 'always'],
    'arrow-spacing': 'error',
    'curly': ['error', 'multi-line'],
    'eqeqeq': ['error', 'always'],
    'max-len': ['error', { code: 120, ignoreStrings: true, ignoreTemplateLiterals: true }],
    'no-var': 'error',
    'no-console': 'error',
    'no-debugger': 'error',
    'operator-linebreak': ['error', 'after', { overrides: { '?': 'before', ':': 'before' } }],
    'padded-blocks': ['error', 'never'],
    'semi': ['error', 'always']
  },
  parserOptions: {
    parser: '@babel/eslint-parser'
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
