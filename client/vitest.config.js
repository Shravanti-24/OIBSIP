import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// Separate from vite.config.js so the test run doesn't pull in the Tailwind
// plugin or the dev-server proxy, neither of which a jsdom test needs.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.js'],
    include: ['src/**/*.test.{js,jsx}'],
    restoreMocks: true,
    clearMocks: true,
  },
});
