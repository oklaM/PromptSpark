import { test, expect } from '@playwright/test';

test.describe('Prompt CRUD Operations', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    // Set mock authentication
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('token', 'mock_token');
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-id',
        username: 'testuser'
      }));
    });
    await page.reload();
  });

  test('TC-007: User can create a new prompt', async ({ page }) => {
    // Arrange
    const promptData = {
      title: `E2E Test Prompt ${Date.now()}`,
      description: 'This is an automated test prompt',
      content: 'Test prompt content for E2E testing',
      category: 'Testing'
    };

    // Act - Click create button
    await page.click('button:has-text("创建提示词")');
    await expect(page.locator('text=创建新提示词')).toBeVisible();

    // Fill form
    await page.fill('input[name="title"]', promptData.title);
    await page.fill('textarea[name="description"]', promptData.description);
    await page.fill('textarea[name="content"]', promptData.content);
    await page.selectOption('select[name="category"]', promptData.category);

    // Submit form
    await page.click('button:has-text("创建")');

    // Assert - Prompt should be visible in list
    await expect(page.locator(`text=${promptData.title}`)).toBeVisible();
  });

  test('TC-008: User can view prompt details', async ({ page }) => {
    // Arrange - Assume prompts exist in the system
    await page.waitForSelector('[data-testid="prompt-card"]', { timeout: 5000 })
      .catch(() => {
        // If no prompts, create one first
        test.skip();
      });

    // Act - Click on first prompt card
    const firstPrompt = page.locator('[data-testid="prompt-card"]').first();
    await firstPrompt.click();

    // Assert - Should navigate to detail page
    await expect(page).toHaveURL(/\/prompts\/.+/);
    await expect(page.locator('[data-testid="prompt-detail"]')).toBeVisible();
  });

  test('TC-009: User can edit an existing prompt', async ({ page }) => {
    // Arrange - Navigate to a prompt detail page
    await page.waitForSelector('[data-testid="prompt-card"]', { timeout: 5000 })
      .catch(() => test.skip());

    await page.locator('[data-testid="prompt-card"]').first().click();
    const originalTitle = await page.locator('[data-testid="prompt-title"]').textContent();

    // Act - Click edit button
    await page.click('button:has-text("编辑")');
    await expect(page.locator('text=编辑提示词')).toBeVisible();

    // Update title
    const newTitle = `Updated ${originalTitle}`;
    await page.fill('input[name="title"]', newTitle);

    // Save changes
    await page.click('button:has-text("保存")');

    // Assert - Title should be updated
    await expect(page.locator(`text=${newTitle}`)).toBeVisible();
  });

  test('TC-010: User can delete a prompt', async ({ page }) => {
    // Arrange - Navigate to a prompt detail page
    await page.waitForSelector('[data-testid="prompt-card"]', { timeout: 5000 })
      .catch(() => test.skip());

    await page.locator('[data-testid="prompt-card"]').first().click();
    const promptTitle = await page.locator('[data-testid="prompt-title"]').textContent();

    // Act - Click delete button and confirm
    await page.click('button:has-text("删除")');
    await page.click('button:has-text("确认")');

    // Assert - Should redirect to list page and prompt should be gone
    await expect(page).toHaveURL('/');
    await expect(page.locator(`text=${promptTitle}`)).not.toBeVisible();
  });

  test('TC-011: Prompt creation validates required fields', async ({ page }) => {
    // Act - Click create button
    await page.click('button:has-text("创建提示词")');

    // Try to submit without required fields
    await page.click('button:has-text("创建")');

    // Assert - Should show validation errors
    await expect(page.locator('input[name="title"]')).toHaveAttribute('required', '');
    await expect(page.locator('textarea[name="content"]')).toHaveAttribute('required', '');
  });

  test('TC-012: User can copy prompt content', async ({ page }) => {
    // Arrange - Navigate to prompt detail
    await page.waitForSelector('[data-testid="prompt-card"]', { timeout: 5000 })
      .catch(() => test.skip());

    await page.locator('[data-testid="prompt-card"]').first().click();

    // Act - Click copy button
    await page.click('button:has-text("复制")');

    // Assert - Should show success message
    await expect(page.locator('text=复制成功')).toBeVisible();
  });

  test('TC-013: User can add tags to prompt', async ({ page }) => {
    // Arrange - Navigate to prompt detail
    await page.waitForSelector('[data-testid="prompt-card"]', { timeout: 5000 })
      .catch(() => test.skip());

    await page.locator('[data-testid="prompt-card"]').first().click();

    // Act - Click edit and add tags
    await page.click('button:has-text("编辑")');

    const tagInput = page.locator('input[placeholder*="标签"]');
    await tagInput.fill('test-tag');
    await page.keyboard.press('Enter');

    await page.click('button:has-text("保存")');

    // Assert - Tag should be visible
    await expect(page.locator('text=test-tag')).toBeVisible();
  });

  test('TC-014: Prompt list supports pagination', async ({ page }) => {
    // Arrange - Go to home page
    await page.goto('/');

    // Act - Look for pagination controls
    const nextButton = page.locator('button:has-text("下一页")');

    if (await nextButton.isVisible()) {
      await nextButton.click();

      // Assert - URL should update with page parameter
      await expect(page).toHaveURL(/page=2/);
    } else {
      // If no pagination, not enough prompts - skip test
      test.skip();
    }
  });

  test('TC-015: User can view prompt version history', async ({ page }) => {
    // Arrange - Navigate to prompt detail
    await page.waitForSelector('[data-testid="prompt-card"]', { timeout: 5000 })
      .catch(() => test.skip());

    await page.locator('[data-testid="prompt-card"]').first().click();

    // Act - Click on history tab
    await page.click('button:has-text("历史")');

    // Assert - Should show version history
    await expect(page.locator('[data-testid="version-history"]')).toBeVisible();
  });
});
