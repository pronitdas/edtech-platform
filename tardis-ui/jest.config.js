module.exports = {
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
    },
    moduleNameMapper: {
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        'ws': '<rootDir>/src/stories/mocks.tsx',
    },
    transformIgnorePatterns: [
        '/node_modules/',
        '<rootDir>/dist/',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    moduleDirectories: ['node_modules', '<rootDir>'],
    clearMocks: true,
    resetMocks: true,
};