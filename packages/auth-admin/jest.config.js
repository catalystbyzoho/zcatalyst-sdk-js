const base = require('../../config/jest.config.base.node');

module.exports = {
  ...base,
  displayName: '@zcatalyst/auth-admin',
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  // TODO: raise back towards the base 50% threshold as more tests are added.
  coverageThreshold: {
    global: {
      branches: 1,
      functions: 2,
      lines: 12,
      statements: 12
    }
  }
};