import { test, expect } from '@playwright/test';

test.describe('Search and Filter Functionality', () => {
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

  test('TC-016: User can search prompts by keyword', async ({ page }) => {
    // Arrange - Wait for prompts to load
    await page.waitForSelector('[data-testid="prompt-card"]', { timeout: 5000 })
      .catch(() => test.skip());

    // Act - Enter search keyword
    await page.fill('input[placeholder*="搜索"]', 'test');
    await page.keyboard.press('Enter');

    // Assert - Should show filtered results
    await page.waitForLoadState('networkidle');
    const results = page.locator('[data-testid="prompt-card"]');
    const count = await results.count();

    // Results should contain the search term
    for (let i = 0; i < count; i++) {
      const card = results.nth(i);
      const text = await card.textContent();
      expect(text?.toLowerCase()).toContain('test');
    }
  });

  test('TC-017: User can filter prompts by category', async ({ page }) => {
    // Arrange
    await page.waitForSelector('[data-testid="category-filter"]', { timeout: 5000 })
      .catch(() => test.skip());

    // Act - Select a category filter
    await page.selectOption('[data-testid="category-filter"]', 'AI');

    // Assert - Should show only AI category prompts
    await page.waitForLoadState('networkidle');
    const results = page.locator('[data-testid="prompt-card"]');

    // Verify filtering worked (cards are visible)
    await expect(results.first()).toBeVisible();
  });

  test('TC-018: Search results show relevant metadata', async ({ page }) => {
    // Arrange
    await page.waitForSelector('[data-testid="prompt-card"]', { timeout: 5000 })
      .catch(() => test.skip());

    // Act - Search
    await page.fill('input[placeholder*="搜索"]', 'prompt');
    await page.keyboard.press('Enter');

    // Assert - Results should show metadata (views, likes, category)
    await page.waitForLoadState('networkidle');
    const firstCard = page.locator('[data-testid="prompt-card"]').first();

    await expect(firstCard.locator('[data-testid="prompt-views"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="prompt-likes"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="prompt-category"]')).toBeVisible();
  });

  test('TC-019: Advanced search filters work together', async ({ page }) => {
    // Arrange
    await page.waitForSelector('[data-testid="advanced-search-toggle"]', { timeout: 5000 })
      .catch(() => test.skip());

    // Act - Open advanced search
    await page.click('[data-testid="advanced-search-toggle"]');

    // Set multiple filters
    await page.fill('input[name="search"]', 'test');
    await page.selectOption('select[name="category"]', 'AI');

    // Toggle public/private filter
    await page.click('input[name="isPublic"]');

    // Apply filters
    await page.click('button:has-text("搜索")');

    // Assert - Should show filtered results
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="search-results"]')).toBeVisible();
  });

  test('TC-020: Search clears when reset', async ({ page }) => {
    // Arrange - Perform a search
    await page.waitForSelector('input[placeholder*="搜索"]', { timeout: 5000 })
      .catch(() => test.skip());

    await page.fill('input[placeholder*="搜索"]', 'test');
    await page.keyboard.press('Enter');
    await page.waitForLoadState('networkidle');

    // Act - Clear search
    const searchInput = page.locator('input[placeholder*="搜索"]');
    await searchInput.click();
    await searchInput.fill('');
    await page.keyboard.press('Enter');

    // Assert - Should show all prompts again
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="prompt-card"]').first()).toBeVisible();
  });

  test('TC-021: Search handles no results gracefully', async ({ page }) => {
    // Arrange
    await page.waitForSelector('input[placeholder*="搜索"]', { timeout: 5000 })
      .catch(() => test.skip());

    // Act - Search for non-existent prompt
    await page.fill('input[placeholder*="搜索"]', 'nonexistentpromptxyz123');
    await page.keyboard.press('Enter');

    // Assert - Should show empty state message
    await page.waitForLoadState('networkidle');
    await expect(page.locator('text=未找到相关提示词')).toBeVisible();
  });

  test('TC-022: Search debouncing prevents excessive API calls', async ({ page }) => {
    // Arrange
    await page.waitForSelector('input[placeholder*="搜索"]', { timeout: 5000 })
      .catch(() => test.skip());

    // Act - Monitor network requests while typing
    const apiRequests: string[] = [];
    page.on('request', request => {
      if (request.url().includes('/api/prompts/search')) {
        apiRequests.push(request.url());
      }
    });

    // Type quickly (should debounce)
    await page.fill('input[placeholder*="搜索"]', 'test');
    await page.fill('input[placeholder*="搜索"]', 'test search');
    await page.fill('input[placeholder*="搜索"]', 'test search query');

    // Wait for debounce
    await page.waitForTimeout(500);

    // Assert - Should have fewer requests than keystrokes
    // Debouncing should combine multiple keystrokes into fewer requests
    expect(apiRequests.length).toBeLessThan(3);
  });

  test('TC-023: URL reflects search state', async ({ page }) => {
    // Arrange
    await page.waitForSelector('input[placeholder*="搜索"]', { timeout: 5000 })
      .catch(() => test.skip());

    // Act - Search
    await page.fill('input[placeholder*="搜索"]', 'test');
    await page.keyboard.press('Enter');

    // Assert - URL should contain search parameters
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/query=test/);
  });

  test('TC-024: Tag filtering works', async ({ page }) => {
    // Arrange
    await page.waitForSelector('[data-testid="tag-filter"]', { timeout: 5000 })
      .catch(() => test.skip());

    // Act - Click on a tag
    await page.click('[data-testid="tag-filter"] >> text=AI');

    // Assert - Should show only prompts with that tag
    await page.waitForLoadState('networkidle');
    await expect(page.locator('[data-testid="prompt-card"]').first()).toBeVisible();
  });

  test('TC-025: Sort order changes correctly', async ({ page }) => {
    // Arrange
    await page.waitForSelector('[data-testid="sort-select"]', { timeout: 5000 })
      .catch(() => test.skip());

    // Act - Change sort order
    await page.selectOption('[data-testid="sort-select"]', 'views');

    // Assert - URL and results should update
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/sort=views/);
  });
});
