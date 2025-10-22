/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^#(.*)$': '<rootDir>/src/$1',
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    transform: {
        '^.+\\.ts$': [
            'ts-jest',
            {
                useESM: true,
                tsconfig: {
                    module: 'ESNext',
                    moduleResolution: 'node',
                },
            },
        ],
    },
    testMatch: [
        '**/tests/**/*.test.ts',
        '**/tests/**/*.spec.ts',
    ],
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/index.ts',
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    verbose: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true,
};

