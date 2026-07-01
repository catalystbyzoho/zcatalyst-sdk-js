const base = require("../../jest.config.base.js");

module.exports =  {
  ...base,
  moduleNameMapper: {
    "^@zcatalyst/utils$": "<rootDir>/../utils/src",
    "^@zcatalyst/auth-admin$": "<rootDir>/../auth-admin/src",
    "^@zcatalyst/transport$": "../../transport/src/__mocks__",
  },
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
