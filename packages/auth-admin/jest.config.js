const base = require('../../config/jest.config.base.node');

module.exports = {
  ...base,
  displayName: '@zcatalyst/auth-admin',
  rootDir: '.',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};