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
