const base = require('../../config/jest.config.base.browser');

module.exports = {
  ...base,
  displayName: '@zcatalyst/auth-client',
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // TODO: raise back towards the base 80% threshold as more tests are added.
  coverageThreshold: {
    global: {
      branches: 37,
      functions: 72,
      lines: 60,
      statements: 60
    }
  }
};
