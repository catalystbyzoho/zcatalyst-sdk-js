/**
 * Root Jest Configuration
 * 
 * This configuration serves as the base for all packages in the monorepo.
 * Individual packages can extend this configuration with their own jest.config.js
 */

module.exports = {
  // Use projects to run tests across all packages
  projects: ['<rootDir>/packages/*/jest.config.js'],
  
  // Coverage configuration
  collectCoverage: false,
  coverageDirectory: '<rootDir>/coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  
  // Test environment
  testEnvironment: 'node',
  
  // Global setup/teardown
  // globalSetup: '<rootDir>/jest.global-setup.js',
  // globalTeardown: '<rootDir>/jest.global-teardown.js',
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist-.*/',
    '/.turbo/',
    '/coverage/'
  ],
  
  // Watch plugins
  watchPlugins: [
    'jest-watch-typeahead/filename',
    'jest-watch-typeahead/testname'
  ]
};
