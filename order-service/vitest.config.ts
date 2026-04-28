import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['src/__tests__/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      thresholds: {
        lines: 80,
        branches: 75,
        functions: 80,
        statements: 80,
      },
      include: ['src/**/*.ts'],
      exclude: ['src/index.ts', 'src/mock-server.ts', 'src/**/*.model.ts', 'src/clients/**', 'src/routes/**'],
    },
  },
})
