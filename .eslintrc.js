module.exports = {
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 2022,
        sourceType: 'module',
        project: './tsconfig.json',
    },
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
    ],
    env: {
        node: true,
        jest: true,
    },
    rules: {
        '@typescript-eslint/no-explicit-any': 'warn',
        '@typescript-eslint/explicit-function-return-type': 'warn',
        '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
        '@typescript-eslint/strict-boolean-expressions': 'off',
        'no-console': 'error',
        'no-eval': 'error',
        'no-implied-eval': 'error',
        'prefer-const': 'error',
        'no-var': 'error',
        eqeqeq: ['error', 'always'],
        curly: ['error', 'all'],
    },
    ignorePatterns: ['dist/', 'node_modules/', 'coverage/', 'circuits/', '*.js'],
};
