module.exports = {
	transform: {
		'^.+\\.ts?$': 'ts-jest'
	},
  testRegex: '(/tests/.*(\\.|/)(test|spec))\\.ts?$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverage: true,
  testEnvironment: "node",
  moduleDirectories: ["node_modules", "packages/**/src"],
  moduleNameMapper: {
    // Source imports use explicit ".js" extensions (required for Node's
    // ESM loader), but the files on disk are ".ts". Strip the extension
    // so Jest resolves back to the ".ts" source under ts-jest.
    '^(\\.{1,2}/.*)\\.js$': '$1',
    "^@zcatalyst/utils$": "<rootDir>/../utils/src",
    "^@zcatalyst/auth-admin$": "<rootDir>/../auth-admin/src"
  },
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
