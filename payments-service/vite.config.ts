    import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: false,       // importamos explícitamente
    environment: 'node',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
    },
      env: {
    JWT_SECRET: 'test_secret',
  }
  },
});