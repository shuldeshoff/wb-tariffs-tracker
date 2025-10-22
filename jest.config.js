/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest/presets/default-esm',
    testEnvironment: 'node',
    extensionsToTreatAsEsm: ['.ts'],
    moduleNameMapper: {
        '^#config/(.*)\\.(js|ts)$': '<rootDir>/src/config/$1',
        '^#postgres/(.*)\\.(js|ts)$': '<rootDir>/src/postgres/$1',
        '^#repositories/(.*)\\.(js|ts)$': '<rootDir>/src/repositories/$1',
        '^#services/(.*)\\.(js|ts)$': '<rootDir>/src/services/$1',
        '^#scheduler/(.*)\\.(js|ts)$': '<rootDir>/src/scheduler/$1',
        '^#types/(.*)\\.(js|ts)$': '<rootDir>/src/types/$1',
        '^#utils/(.*)\\.(js|ts)$': '<rootDir>/src/utils/$1',
        '^(\\.{1,2}/.*)\\.js$': '$1',
        '^log4js$': '<rootDir>/tests/mocks/log4js.mock.ts',
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
    transformIgnorePatterns: [
        'node_modules/(?!(log4js)/)',
    ],
};

