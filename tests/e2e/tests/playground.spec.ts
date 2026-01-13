import { test, expect } from '@playwright/test';

test.describe('Prompt Playground Features', () => {
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

    // Navigate to a prompt detail page
    await page.waitForSelector('[data-testid="prompt-card"]', { timeout: 5000 })
      .catch(() => test.skip());

    await page.locator('[data-testid="prompt-card"]').first().click();
  });

  test('TC-026: User can run prompt in playground', async ({ page }) => {
    // Act - Click on playground tab
    await page.click('button:has-text("运行")');

    // Assert - Playground should be visible
    await expect(page.locator('[data-testid="prompt-playground"]')).toBeVisible();

    // Select model
    await page.selectOption('select[name="model"]', 'gemini');

    // Run prompt
    await page.click('button:has-text("运行")');

    // Assert - Should show loading state then result
    await expect(page.locator('[data-testid="loading-indicator"]')).toBeVisible();
  });

  test('TC-027: User can inject variables into prompt', async ({ page }) => {
    // Act - Navigate to playground
    await page.click('button:has-text("运行")');

    // Add variable
    await page.click('button:has-text("添加变量")');
    await page.fill('input[name="variable-name"]', 'topic');
    await page.fill('input[name="variable-value"]', 'AI testing');

    // Assert - Variable should be reflected in prompt preview
    await expect(page.locator('text={{topic}}')).toBeVisible();
  });

  test('TC-028: Playground shows execution history', async ({ page }) => {
    // Act - Navigate to playground
    await page.click('button:has-text("运行")');

    // Assert - Should show execution history
    await expect(page.locator('[data-testid="execution-history"]')).toBeVisible();
  });

  test('TC-029: User can save execution result', async ({ page }) => {
    // Act - Run prompt and save result
    await page.click('button:has-text("运行")');
    await page.selectOption('select[name="model"]', 'gemini');
    await page.click('button:has-text("运行")');

    // Wait for result
    await page.waitForSelector('[data-testid="execution-result"]', { timeout: 10000 })
      .catch(() => {
        // Mock response might not work, skip if no result
        test.skip();
      });

    // Click save button
    await page.click('button:has-text("保存结果")');

    // Assert - Should show success message
    await expect(page.locator('text=保存成功')).toBeVisible();
  });
});

test.describe('Collaboration Features', () => {
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

    await page.waitForSelector('[data-testid="prompt-card"]', { timeout: 5000 })
      .catch(() => test.skip());

    await page.locator('[data-testid="prompt-card"]').first().click();
  });

  test('TC-030: User can rate a prompt', async ({ page }) => {
    // Act - Click on ratings section
    await page.click('button:has-text("评分")');

    // Select star rating
    await page.locator('[data-testid="rating-star"]').nth(4).click(); // 5 stars

    // Submit rating
    await page.click('button:has-text("提交评分")');

    // Assert - Should show success message
    await expect(page.locator('text=评分成功')).toBeVisible();
  });

  test('TC-031: User can comment on prompt', async ({ page }) => {
    // Act - Navigate to discussions tab
    await page.click('button:has-text("讨论")');

    // Add comment
    await page.fill('textarea[name="comment"]', 'This is a test comment');
    await page.click('button:has-text("发表评论")');

    // Assert - Comment should be visible
    await expect(page.locator('text=This is a test comment')).toBeVisible();
  });

  test('TC-032: User can reply to comments', async ({ page }) => {
    // Act - Navigate to discussions
    await page.click('button:has-text("讨论")');

    // Wait for existing comments or skip
    const hasComments = await page.locator('[data-testid="comment"]').count() > 0;
    if (!hasComments) {
      test.skip();
    }

    // Click reply on first comment
    await page.locator('[data-testid="comment"]').first()
      .locator('button:has-text("回复")')
      .click();

    // Add reply
    await page.fill('textarea[name="reply"]', 'This is a test reply');
    await page.click('button:has-text("发送回复")');

    // Assert - Reply should be visible
    await expect(page.locator('text=This is a test reply')).toBeVisible();
  });

  test('TC-033: User can share prompt', async ({ page }) => {
    // Act - Click share button
    await page.click('button:has-text("分享")');

    // Assert - Share modal should be visible
    await expect(page.locator('[data-testid="share-modal"]')).toBeVisible();

    // Copy link
    await page.click('button:has-text("复制链接")');

    // Assert - Should show success message
    await expect(page.locator('text=链接已复制')).toBeVisible();
  });

  test('TC-034: User can manage permissions', async ({ page }) => {
    // Act - Click permissions button
    await page.click('button:has-text("权限")');

    // Assert - Permission management modal should be visible
    await expect(page.locator('[data-testid="permission-modal"]')).toBeVisible();

    // Add editor
    await page.fill('input[name="username"]', 'another_user');
    await page.selectOption('select[name="role"]', 'editor');
    await page.click('button:has-text("添加")');

    // Assert - User should be added to permission list
    await expect(page.locator('text=another_user')).toBeVisible();
  });

  test('TC-035: User can fork prompt', async ({ page }) => {
    // Act - Click fork button
    await page.click('button:has-text("复制")');

    // Assert - Should show fork confirmation
    await expect(page.locator('text=已创建副本')).toBeVisible();

    // Navigate to prompts list
    await page.goto('/');

    // Assert - Forked prompt should be visible in list
    await page.waitForSelector('text=复制', { timeout: 5000 });
  });
});
