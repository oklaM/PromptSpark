import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration for PromptSpark
 *
 * Tests are organized by feature:
 * - auth: Authentication flows (login, register)
 * - prompts: Prompt CRUD operations
 * - search: Search and filter functionality
 *
 * Base URL defaults to localhost:3000 (frontend dev server)
 */
export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: false, // Run sequentially for stability
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,

  reporter: [
    ['html'],
    ['list']
  ],

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3001',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 15000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],

  // Start dev servers before running tests
  webServer: [
    {
      command: 'cd backend && npm run dev',
      port: 5000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd frontend && npm run dev',
      port: 3000,
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
  ],
});
