/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    moduleNameMapper: {
        '^@core/(.*)$': '<rootDir>/src/core/$1',
        '^@api/(.*)$': '<rootDir>/src/api/$1',
        '^@config/(.*)$': '<rootDir>/src/config/$1',
        '^@utils/(.*)$': '<rootDir>/src/utils/$1',
        '^@types/(.*)$': '<rootDir>/src/types/$1',
    },
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/index.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'clover'],
    coverageThreshold: {
        global: {
            branches: 80,
            functions: 85,
            lines: 90,
            statements: 90,
        },
    },
    setupFiles: [],
    testTimeout: 30000,
    verbose: true,
};
