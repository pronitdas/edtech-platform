import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    timeout: 60000,
    testTimeout: 60000,
    hookTimeout: 30000,
    teardownTimeout: 30000,
    globals: true,
    environment: 'node',
    setupFiles: ['./setup.ts'],
  },
})