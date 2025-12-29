import { defineConfig } from 'vitest/config';
import { resolve } from 'path';
import { config as dotenvConfig } from 'dotenv';

// Load environment variables before tests
dotenvConfig();

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'client/src'),
      '@shared': resolve(__dirname, 'shared'),
      '@assets': resolve(__dirname, 'attached_assets'),
    },
  },
});