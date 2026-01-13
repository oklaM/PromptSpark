import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Authentication Flow
 * Test Plan Reference: TC-001 through TC-009
 */

test.describe('Authentication E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  /**
   * TC-003: User login with valid credentials
   * Priority: P0
   */
  test('TC-003: should login with valid credentials', async ({ page }) => {
    // Navigate to login page
    await page.click('text=Login');
    await expect(page).toHaveURL(/.*login/);

    // Fill in credentials
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@1234');

    // Submit form
    await page.click('button[type="submit"]');

    // Verify successful login - should redirect to dashboard
    await expect(page).toHaveURL(/.*\/(dashboard|prompts)/);
    await expect(page.locator('text=Welcome').or(page.locator('[data-testid="user-menu"]'))).toBeVisible();
  });

  /**
   * TC-004: User login with invalid password
   * Priority: P0
   */
  test('TC-004: should reject invalid password', async ({ page }) => {
    await page.click('text=Login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'WrongPassword123!');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials').or(page.locator('.error'))).toBeVisible();
    await expect(page).toHaveURL(/.*login/);
  });

  /**
   * TC-001: User registration with valid data
   * Priority: P0
   */
  test('TC-001: should register new user successfully', async ({ page }) => {
    const timestamp = Date.now();
    const testEmail = `testuser${timestamp}@example.com`;

    await page.click('text=Sign Up');
    await expect(page).toHaveURL(/.*register/);

    // Fill registration form
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!');

    // Submit
    await page.click('button[type="submit"]');

    // Verify successful registration
    await expect(page).toHaveURL(/.*\/(dashboard|prompts)/);
    await expect(page.locator(`text=${testEmail}`).or(page.locator('[data-testid="user-menu"]'))).toBeVisible({ timeout: 10000 });
  });

  /**
   * TC-002: Registration with duplicate email
   * Priority: P0
   */
  test('TC-002: should reject duplicate email registration', async ({ page }) => {
    await page.click('text=Sign Up');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'SecurePass123!');
    await page.fill('input[name="confirmPassword"]', 'SecurePass123!');
    await page.click('button[type="submit"]');

    // Should show error about existing email
    await expect(page.locator('text=already exists').or(page.locator('.error'))).toBeVisible();
  });

  /**
   * TC-005: Token expiry handling
   * Priority: P0
   */
  test('TC-005: should handle token expiry gracefully', async ({ page }) => {
    // Login first
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(dashboard|prompts)/);

    // Simulate token expiry by clearing localStorage
    await page.evaluate(() => {
      localStorage.removeItem('token');
    });

    // Try to navigate to a protected route
    await page.goto('http://localhost:3000/prompts');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});
