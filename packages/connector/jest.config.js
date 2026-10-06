const base = require("../../jest.config.base.js");

module.exports =  {
  ...base,
    moduleNameMapper: {
    // Source imports use explicit ".js" extensions (required for Node's
    // ESM loader), but the files on disk are ".ts". Strip the extension
    // so Jest resolves back to the ".ts" source under ts-jest.
    '^(\\.{1,2}/.*)\\.js$': '$1',
    "^@zcatalyst/utils$": "<rootDir>/../utils/src",
    "^@zcatalyst/auth-admin$": "<rootDir>/../auth-admin/src",
    "^@zcatalyst/transport$": "../../transport/src/__mocks__",
  },
  // TODO: raise back towards the base 80% threshold as more tests are added.
  coverageThreshold: {
    global: {
      branches: 21,
      functions: 54,
      lines: 55,
      statements: 55
    }
  }
};
