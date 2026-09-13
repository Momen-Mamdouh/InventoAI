import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./apps/user-site/src/app/tests/test-setup.ts'],
  },
});
