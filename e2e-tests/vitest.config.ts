import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    timeout: 120000, // Increased timeout for E2E tests
    testTimeout: 120000,
    hookTimeout: 60000,
    teardownTimeout: 60000,
    globals: true,
    environment: 'node',
    setupFiles: ['./setup.ts'],
    reporters: ['verbose', 'json'],
    outputFile: {
      json: './test-results.json',
      junit: './test-results.xml'
    },
    // Run tests sequentially to avoid conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    // Retry flaky tests
    retry: 2,
    // Better error reporting
    bail: 0,
    // Include/exclude patterns
    include: ['tests/**/*.test.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    // Environment variables for tests
    env: {
      NODE_ENV: 'test',
      FRONTEND_URL: 'http://localhost:5173',
      BACKEND_URL: 'http://localhost:8000'
    }
  },
})