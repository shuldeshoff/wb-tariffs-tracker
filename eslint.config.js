import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import prettier from 'eslint-plugin-prettier';
import jsdoc from 'eslint-plugin-jsdoc';
import unusedImports from 'eslint-plugin-unused-imports';
import prettierConfig from 'eslint-config-prettier';

export default [
    // Базовые рекомендованные правила для JavaScript
    js.configs.recommended,

    // Игнорируемые файлы и директории
    {
        ignores: [
            'node_modules/**',
            'dist/**',
            'coverage/**',
            'logs/**',
            '*.js', // игнорируем скомпилированные JS файлы в корне
            'jest.config.js',
            'eslint.config.js',
        ],
    },

    // Конфигурация для TypeScript файлов в src
    {
        files: ['src/**/*.ts'],
        
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: './tsconfig.json',
            },
            globals: {
                // Node.js globals
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'writable',
                global: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                // Jest globals
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                jest: 'readonly',
            },
        },

        plugins: {
            '@typescript-eslint': tsPlugin,
            prettier,
            jsdoc,
            'unused-imports': unusedImports,
        },

        rules: {
            // Prettier integration
            'prettier/prettier': 'error',

            // TypeScript specific
            '@typescript-eslint/no-unused-vars': 'off', // используем unused-imports вместо этого
            '@typescript-eslint/no-explicit-any': 'warn',
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/explicit-module-boundary-types': 'off',

            // Unused imports
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': [
                'warn',
                {
                    vars: 'all',
                    varsIgnorePattern: '^_',
                    args: 'after-used',
                    argsIgnorePattern: '^_',
                },
            ],

            // JSDoc
            'jsdoc/check-alignment': 'warn',
            'jsdoc/check-indentation': 'warn',
            'jsdoc/check-param-names': 'warn',
            'jsdoc/check-tag-names': 'warn',
            'jsdoc/check-types': 'warn',
            'jsdoc/require-description': 'off',
            'jsdoc/require-param': 'off',
            'jsdoc/require-param-description': 'off',
            'jsdoc/require-param-type': 'off', // TypeScript handles types
            'jsdoc/require-returns': 'off',
            'jsdoc/require-returns-description': 'off',
            'jsdoc/require-returns-type': 'off', // TypeScript handles types

            // Best practices
            'no-console': 'off', // we use logger instead, but allow for quick debugging
            'no-debugger': 'error',
            'no-alert': 'error',
            'no-var': 'error',
            'prefer-const': 'error',
            'prefer-arrow-callback': 'warn',
            'prefer-template': 'warn',
            'no-unused-expressions': 'warn',
            'no-duplicate-imports': 'error',
            
            // Error handling
            'no-throw-literal': 'error',
            'prefer-promise-reject-errors': 'error',

            // Code quality
            'eqeqeq': ['error', 'always'],
            'curly': ['error', 'all'],
            'no-eval': 'error',
            'no-implied-eval': 'error',
            'no-return-await': 'warn',
            'require-await': 'warn',
            'no-async-promise-executor': 'error',

            // Node.js best practices
            'no-process-exit': 'off', // we use it in graceful shutdown
            'callback-return': 'off',
            'handle-callback-err': 'error',
            'no-mixed-requires': 'warn',
            'no-new-require': 'error',
            'no-path-concat': 'error',

            // Style (handled by Prettier mostly)
            'quotes': ['error', 'double', { avoidEscape: true }],
            'semi': ['error', 'always'],
            'comma-dangle': ['error', 'always-multiline'],
            'max-len': [
                'warn',
                {
                    code: 120,
                    ignoreStrings: true,
                    ignoreTemplateLiterals: true,
                    ignoreComments: true,
                },
            ],
        },
    },

    // Конфигурация для тестов (без project)
    {
        files: ['tests/**/*.ts'],
        
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
            globals: {
                // Node.js globals
                console: 'readonly',
                process: 'readonly',
                Buffer: 'readonly',
                __dirname: 'readonly',
                __filename: 'readonly',
                module: 'readonly',
                require: 'readonly',
                exports: 'writable',
                global: 'readonly',
                setTimeout: 'readonly',
                setInterval: 'readonly',
                clearTimeout: 'readonly',
                clearInterval: 'readonly',
                // Jest globals
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                jest: 'readonly',
            },
        },

        plugins: {
            '@typescript-eslint': tsPlugin,
            prettier,
            jsdoc,
            'unused-imports': unusedImports,
        },

        rules: {
            'prettier/prettier': 'error',
            'unused-imports/no-unused-imports': 'error',
            'no-console': 'off',
            '@typescript-eslint/no-explicit-any': 'off', // allow any in tests
        },
    },

    // Отключаем конфликтующие с Prettier правила
    prettierConfig,
];

