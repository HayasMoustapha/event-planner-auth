const path = require('path');
const posixPath = (value) => value.replace(/\\/g, '/');

module.exports = {
  rootDir: __dirname,
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js', '**/tests/**/*.spec.js'],
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/server.js',
    '!src/config/**',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  globalSetup: posixPath(path.join(__dirname, 'tests/setup/global-setup.js')),
  setupFiles: [posixPath(path.join(__dirname, 'tests/setup/jest.env.setup.js'))],
  setupFilesAfterEnv: [posixPath(path.join(__dirname, 'tests/setup/jest.setup.js'))],
  testTimeout: 10000,
  verbose: true,
};
