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
    'comma-dangle': ['error', 'never'],
    'curly': ['error', 'multi-line'],
    'eqeqeq': ['error', 'always'],
    'max-len': ['error', { code: 120, ignoreStrings: true, ignoreTemplateLiterals: true }],
    'no-console': 'error',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'no-multiple-empty-lines': ['error', { max: 1 }],
    'no-trailing-spaces': 'error',
    'no-var': 'error',
    'object-curly-spacing': ['error', 'always'],
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
