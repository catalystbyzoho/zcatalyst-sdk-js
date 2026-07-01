const base = require('../../jest.config.base.js');

module.exports = {
  ...base,
  moduleNameMapper: {
    "^@zcatalyst/auth-admin$": "../../auth-admin/src/__mocks__",
  },
  coverageThreshold: {
    global: {
      branches: 20,
      functions: 25,
      lines: 30,
      statements: 30
    }
  }
};