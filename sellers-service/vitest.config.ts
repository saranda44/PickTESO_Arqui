import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts'],
      exclude: ['src/app.ts', 'src/config/**', 'src/**/*.spec.ts'],
      thresholds: {
        lines: 73,
        branches: 60,
        functions: 73,
        statements: 73,
      },
    },
  },
});
