import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright configuration for Smart Grocery Companion E2E tests
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './e2e',
  /* Run tests in files in parallel */
  fullyParallel: false,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Single worker for consistent state */
  workers: 1,
  /* Faster timeout */
  timeout: 30000,
  /* Reporter - use line for faster feedback */
  reporter: process.env.CI ? 'html' : 'line',
  /* Shared settings for all the projects below. */
  use: {
    /* Base URL */
    baseURL: 'http://localhost:3000',
    /* Faster action timeout */
    actionTimeout: 10000,
    /* Only trace on retry */
    trace: 'on-first-retry',
    /* Screenshot only on failure */
    screenshot: 'only-on-failure',
    /* No video for speed */
    video: 'off',
    /* Faster navigation */
    navigationTimeout: 15000,
  },

  /* Configure projects - only chromium for speed */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Reuse existing dev server for faster tests */
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
    timeout: 60 * 1000,
  },
});

