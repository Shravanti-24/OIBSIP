import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./tests/setup.js'],
    // Makes config/env.js skip its "missing variable" warnings and keeps
    // request logging out of the reporter's output.
    env: { NODE_ENV: 'test' },
  },
});
