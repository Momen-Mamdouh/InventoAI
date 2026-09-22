import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    setupFiles: ['./apps/owner-dashboard/src/app/tests/test-setup.ts'],
  },
});
