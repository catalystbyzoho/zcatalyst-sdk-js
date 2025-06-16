module.exports = {
	transform: {
		'^.+\\.ts?$': 'ts-jest'
	},
  testRegex: '(/tests/.*(\\.|/)(test|spec))\\.ts?$',
  moduleFileExtensions: ['ts', 'js', 'json', 'node'],
  collectCoverage: true,
  testEnvironment: "node",
  moduleDirectories: ["node_modules", "packages/**/src"]
};
