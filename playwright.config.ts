import { defineConfig, devices } from '@playwright/test'

/**
 * Playwright E2E test configuration for OpenScans
 *
 * Focus: Medical imaging workflows on Chromium only
 * Strategy: Sequential execution (DICOM files share state)
 * Timeouts: Generous (DICOM loading is CPU-intensive)
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Run tests in files in parallel, but run each test sequentially
  fullyParallel: false,

  // Fail the build on CI if you accidentally left test.only in the source code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI for DICOM file state consistency
  workers: 1,

  // Reporter to use
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report' }],
  ],

  // Shared settings for all the projects below
  use: {
    // Base URL to use in actions like `await page.goto('/')`
    baseURL: 'http://localhost:3001',

    // Collect trace when retrying the failed test
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on failure
    video: 'retain-on-failure',

    // Generous timeout for DICOM loading (30s per action)
    actionTimeout: 30000,
  },

  // Configure projects for major browsers
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Permissions for file system access (DICOM file upload)
        permissions: ['clipboard-read', 'clipboard-write'],
      },
    },

    // Uncomment for cross-browser testing (medical imaging primarily uses Chrome)
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },
  ],

  // Run your local dev server before starting the tests
  webServer: {
    command: 'pnpm dev',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start server
  },

  // Global timeout for each test
  timeout: 60000, // 60s per test (DICOM loading can be slow)

  // Expect timeout
  expect: {
    timeout: 10000, // 10s for expect assertions
  },
})
