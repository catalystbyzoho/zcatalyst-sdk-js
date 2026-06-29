/**
 * Base Jest Configuration for Browser Environment
 * 
 * Use this for packages that run in browser context (auth, auth-client)
 */

module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  
  testMatch: [
    '**/__tests__/**/*.+(ts|tsx|js)',
    '**/?(*.)+(spec|test).+(ts|tsx|js)'
  ],
  
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        jsx: 'react'
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
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
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
