const base = require('../../config/jest.config.base.browser');

module.exports = {
  ...base,
  displayName: '@zcatalyst/auth-client',
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
