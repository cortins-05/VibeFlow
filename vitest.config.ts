import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    // Network-bound integration tests against YouTube need generous timeouts.
    testTimeout: 120_000,
    hookTimeout: 60_000,
    // Run files serially: parallel bursts of InnerTube requests from one IP
    // trigger YouTube's bot detection and poison unrelated tests.
    fileParallelism: false,
    sequence: { concurrent: false },
    include: ['tests/**/*.test.ts'],
  },
});
