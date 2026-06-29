/**
 * Base Jest Configuration for Node.js Environment
 * 
 * Use this for packages that run in Node.js context (auth-admin, transport, utils)
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true
      }
    }]
  },
  
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/**/index.ts',
    '!src/**/interfaces.ts',
    '!src/**/enums.ts',
    '!src/**/constants.ts'
  ],
  
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 50,
      lines: 50,
      statements: 50
    }
  },
  
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  
  verbose: true,
  
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist-.*/',
    '/.turbo/'
  ],
  
  modulePathIgnorePatterns: [
    '/dist-.*/',
    '/.turbo/'
  ]
};
