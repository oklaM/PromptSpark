import { test as base } from '@playwright/test';

/**
 * Extended test fixtures for PromptSpark E2E tests
 */
export const test = base.extend({
  // Custom authenticated page fixture
  authenticatedPage: async ({ page }, use) => {
    // Set authentication token before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock_token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        username: 'e2e_test_user',
        email: 'e2e@test.com'
      }));
    });
    await use(page);
  }
});

export { expect } from '@playwright/test';
