const base = require("../../jest.config.base.js");

module.exports =  {
  ...base,
    moduleNameMapper: {
    "^@zcatalyst/transport$": "<rootDir>/../transport/src/__mocks__",
  }
};
