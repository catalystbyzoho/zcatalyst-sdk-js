const base = require('../../config/jest.config.base.node');

module.exports = {
  ...base,
  displayName: '@zcatalyst/utils',
  rootDir: '.',
  // TODO: raise back towards the base 50% threshold as more tests are added
  // for helpers.ts, mime-types.ts, service-utils.ts and validators.ts.
  coverageThreshold: {
    global: {
      branches: 33,
      functions: 40,
      lines: 45,
      statements: 45
    }
  }
};
