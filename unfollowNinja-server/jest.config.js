module.exports = {
    clearMocks: true,
    collectCoverage: false,
    collectCoverageFrom: [
        'src/tasks/*.ts',
    ],
    coverageDirectory: 'test-results/coverage',
    coveragePathIgnorePatterns: [
        'index.ts',
    ],
    coverageReporters: [
        'lcov',
    ],
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json',
        },
    },
    moduleFileExtensions: [
        'js',
        'ts',
        'tsx',
    ],
    reporters: [
        'default',
        [
            'jest-junit',
            {
                output: './test-results/junit/results.xml',
            },
        ],
        [
            'jest-html-reporter',
            {
                outputPath: './test-results/tests/test-report.html',
            },
        ],
    ],
    testEnvironment: 'node',
    testMatch: [
        '**/tests/**/*.spec.+(ts|tsx|js)',
    ],
    verbose: true,
    preset: 'ts-jest',
};