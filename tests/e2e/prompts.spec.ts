import { test, expect } from '@playwright/test';

/**
 * E2E Tests for Prompt Management
 * Test Plan Reference: TC-101 through TC-112
 */

test.describe('Prompt Management E2E Tests', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000/login');
    await page.fill('input[name="email"]', 'test@example.com');
    await page.fill('input[name="password"]', 'Test@1234');
    await page.click('button[type="submit"]');
    await page.waitForURL(/.*\/(dashboard|prompts)/);
  });

  /**
   * TC-101: Create a new prompt with basic fields
   * Priority: P0
   */
  test('TC-101: should create new prompt successfully', async ({ page }) => {
    // Click "New Prompt" button
    await page.click('button:has-text("New Prompt"), [data-testid="create-prompt-btn"]');
    await expect(page.locator('h1:has-text("Create Prompt"), h1:has-text("New Prompt")')).toBeVisible();

    // Fill in the form
    await page.fill('input[name="title"]', 'E2E Test Prompt');
    await page.fill('textarea[name="content"]', 'This is an automated E2E test prompt for quality assurance.');

    // Save
    await page.click('button:has-text("Save"), button[type="submit"]');

    // Verify success
    await expect(page.locator('text=E2E Test Prompt')).toBeVisible();
    await expect(page.locator('text=This is an automated E2E test prompt')).toBeVisible();
  });

  /**
   * TC-102: Create prompt with all fields
   * Priority: P0
   */
  test('TC-102: should create prompt with all fields', async ({ page }) => {
    await page.click('button:has-text("New Prompt"), [data-testid="create-prompt-btn"]');

    // Fill all fields
    await page.fill('input[name="title"]', 'Complete Test Prompt');
    await page.fill('textarea[name="content"]', 'Detailed prompt content for testing');
    await page.fill('textarea[name="description"]', 'This is a test description');
    await page.selectOption('select[name="category"]', 'ai-art');

    // Add tags
    const tagInput = page.locator('input[placeholder*="tag"], input[placeholder*="Tag"]');
    await tagInput.fill('test');
    await page.keyboard.press('Enter');
    await tagInput.fill('e2e');
    await page.keyboard.press('Enter');

    // Save
    await page.click('button:has-text("Save")');

    // Verify all fields are saved
    await expect(page.locator('text=Complete Test Prompt')).toBeVisible();
    await expect(page.locator('text=test')).toBeVisible();
    await expect(page.locator('text=e2e')).toBeVisible();
  });

  /**
   * TC-103: Validation error for missing required fields
   * Priority: P1
   */
  test('TC-103: should show validation error for missing fields', async ({ page }) => {
    await page.click('button:has-text("New Prompt")');

    // Try to save without filling required fields
    await page.click('button:has-text("Save")');

    // Should show validation errors
    await expect(page.locator('text=required, text=Title is required, .error').first()).toBeVisible();
  });

  /**
   * TC-104: Edit existing prompt
   * Priority: P0
   */
  test('TC-104: should edit existing prompt and create version', async ({ page }) => {
    // Navigate to a prompt (assuming one exists)
    await page.goto('http://localhost:3000/prompts');

    // Click on first prompt in list
    await page.click('.prompt-card, [data-testid="prompt-card"]').first();

    // Click edit
    await page.click('button:has-text("Edit"), [data-testid="edit-btn"]');

    // Modify content
    const contentTextarea = page.locator('textarea[name="content"]');
    await contentTextarea.clear();
    await contentTextarea.fill('Updated content for E2E testing');

    // Save
    await page.click('button:has-text("Save")');

    // Verify update
    await expect(page.locator('text=Updated content for E2E testing')).toBeVisible();

    // Check version history
    await page.click('text=Version History, [data-testid="version-history-tab"]');
    await expect(page.locator('text=Version').or(page.locator('[data-testid="version-list"]'))).toBeVisible();
  });

  /**
   * TC-105: Delete prompt (soft delete)
   * Priority: P0
   */
  test('TC-105: should soft delete prompt', async ({ page }) => {
    await page.goto('http://localhost:3000/prompts');

    // Get initial count
    const initialCount = await page.locator('.prompt-card, [data-testid="prompt-card"]').count();

    // Click on first prompt
    await page.click('.prompt-card, [data-testid="prompt-card"]').first();

    // Click delete
    await page.click('button:has-text("Delete"), [data-testid="delete-btn"]');

    // Confirm deletion
    await page.click('button:has-text("Confirm"), button:has-text("Yes")');

    // Verify redirect back to list
    await expect(page).toHaveURL(/.*prompts/);

    // Verify count decreased (prompt should no longer be visible)
    const finalCount = await page.locator('.prompt-card, [data-testid="prompt-card"]').count();
    expect(finalCount).toBeLessThan(initialCount);
  });

  /**
   * TC-106: Search prompts by keyword
   * Priority: P1
   */
  test('TC-106: should search prompts by keyword', async ({ page }) => {
    await page.goto('http://localhost:3000/prompts');

    // Enter search keyword
    await page.fill('input[placeholder*="Search"], input[name="search"]', 'test');

    // Submit search or wait for results
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    // Verify filtered results
    const results = page.locator('.prompt-card, [data-testid="prompt-card"]');
    const count = await results.count();

    if (count > 0) {
      // Verify at least one result contains the search term
      const firstResultText = await results.first().textContent();
      expect(firstResultText?.toLowerCase()).toContain('test');
    }
  });

  /**
   * TC-110: View diff between versions
   * Priority: P0
   */
  test('TC-110: should display diff view for version comparison', async ({ page }) => {
    // Go to a prompt with multiple versions
    await page.goto('http://localhost:3000/prompts');
    await page.click('.prompt-card').first();

    // Open version history
    await page.click('text=Version History, [data-testid="version-history-tab"]');

    // Select two versions to compare
    await page.click('[data-testid="version-checkbox-1"]');
    await page.click('[data-testid="version-checkbox-2"]');

    // Click compare button
    await page.click('button:has-text("Compare"), [data-testid="compare-btn"]');

    // Verify diff view is displayed
    await expect(page.locator('.diff-view, [data-testid="diff-view"], .ins, .del').first()).toBeVisible();
  });

  /**
   * TC-401: Run prompt in playground
   * Priority: P0
   */
  test('TC-401: should run prompt in playground', async ({ page }) => {
    await page.goto('http://localhost:3000/prompts');
    await page.click('.prompt-card').first();

    // Click playground/run button
    await page.click('button:has-text("Run"), button:has-text("Playground"), [data-testid="run-btn"]');

    // Select model
    await page.selectOption('select[name="model"]', 'gemini');

    // Click run
    await page.click('button:has-text("Generate"), button:has-text("Run")');

    // Wait for streaming response (should see loading or result)
    await expect(page.locator('.loading, .ai-response, [data-testid="ai-result"]')).toBeVisible({ timeout: 15000 });
  });

  /**
   * TC-403: Variable injection in playground
   * Priority: P0
   */
  test('TC-403: should handle variable injection', async ({ page }) => {
    // Create a prompt with variables
    await page.click('button:has-text("New Prompt")');
    await page.fill('input[name="title"]', 'Variable Test');
    await page.fill('textarea[name="content"]', 'Create a {{type}} image of {{subject}}');
    await page.click('button:has-text("Save")');

    // Open playground
    await page.click('button:has-text("Run")');

    // Verify variable form is generated
    await expect(page.locator('input[name="type"], label:has-text("type")')).toBeVisible();
    await expect(page.locator('input[name="subject"], label:has-text("subject")')).toBeVisible();

    // Fill variables
    await page.fill('input[name="type"]', 'landscape');
    await page.fill('input[name="subject"]', 'mountains');

    // Run
    await page.click('button:has-text("Generate")');

    // Verify result contains substituted values
    await expect(page.locator('text=landscape, text=mountains')).toBeVisible({ timeout: 15000 });
  });
});
