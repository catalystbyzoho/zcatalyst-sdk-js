const base = require("../../jest.config.base.js");

module.exports =  {
  ...base,
  moduleNameMapper: {
    "^@zcatalyst/transport$": "../../transport/src/__mocks__",
  }
};