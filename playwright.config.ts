import { defineConfig, devices } from '@playwright/test';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Always load from .env at project root
dotenv.config({ path: path.resolve(__dirname, '.env') });
const environment = (process.env.ENV || process.env.NODE_ENV || 'staging').toUpperCase();

// Get configuration from environment variables
const APP_URL = process.env.APP_URL || 'https://app.sully.ai';
const TEST_TIMEOUT = parseInt(process.env.TEST_TIMEOUT || '120000');
const HEADLESS = process.env.HEADLESS === 'true';

console.log(`🌍 Running tests in ${environment} environment`);
console.log(`🔗 Base URL: ${APP_URL}`);
console.log(`⏱️ Test timeout: ${TEST_TIMEOUT}ms`);
console.log(`👁️ Headless mode: ${HEADLESS}`);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  timeout: TEST_TIMEOUT,
  expect: {
    timeout: 5000
  },
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html'],
    ['./utils/perf-reporter.ts'],
  ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    baseURL: APP_URL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: HEADLESS,
    viewport: { width: 1280, height: 720 },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  /* Output directories for test artifacts */
  outputDir: 'test-results/',
  
  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://127.0.0.1:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
