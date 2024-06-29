export default {
  setupFilesAfterEnv: ['jest-extended/all', './test-setup.js'],
  testEnvironment: 'jsdom',
  clearMocks: true,
  restoreMocks: true,
  testMatch: [
    '**/src/**/*.spec.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/vue_archive/'
  ]
};
