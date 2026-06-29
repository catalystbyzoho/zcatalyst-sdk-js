const base = require("../../jest.config.base.js");

module.exports =  {
  ...base,
    moduleNameMapper: {
    "^@zcatalyst/utils$": "<rootDir>/../utils/src",
    "^@zcatalyst/auth-admin$": "<rootDir>/../auth-admin/src",
    "^@zcatalyst/transport$": "../../transport/src/__mocks__",
  }
};
