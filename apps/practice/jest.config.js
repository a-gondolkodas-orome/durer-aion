module.exports = {
  preset: '@vue/cli-plugin-unit-jest',
  setupFilesAfterEnv: [],
  clearMocks: true,
  restoreMocks: true,
  transform: {
    '^.+\\.js$': 'babel-jest',
    '^.+\\.html?$': 'html-loader-jest'
  },
  transformIgnorePatterns: [
    '/node_modules/(?!lodash-es)'
  ],
  testMatch: [
    '**/src/**/*.spec.js'
  ],
  testURL: 'http://localhost:9638'
}
