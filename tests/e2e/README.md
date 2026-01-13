# PromptSpark E2E Tests

End-to-end tests for PromptSpark using Playwright.

## Test Structure

```
e2e/
├── tests/
│   ├── auth.spec.ts           # Authentication flows (login, register, logout)
│   ├── prompts.spec.ts        # Prompt CRUD operations
│   ├── search.spec.ts         # Search and filter functionality
│   ├── playground.spec.ts     # Prompt playground and collaboration features
│   └── setup.ts               # Test fixtures and extensions
├── playwright.config.ts       # Playwright configuration
└── test-results/              # Test reports (generated)
```

## Test Coverage

### Authentication (6 tests)
- TC-001: User registration
- TC-002: Login with valid credentials
- TC-003: Login with invalid credentials
- TC-004: Login field validation
- TC-005: User logout
- TC-006: Password validation

### Prompt CRUD (9 tests)
- TC-007: Create new prompt
- TC-008: View prompt details
- TC-009: Edit existing prompt
- TC-010: Delete prompt
- TC-011: Prompt validation
- TC-012: Copy prompt content
- TC-013: Add tags to prompt
- TC-014: Pagination
- TC-015: Version history

### Search & Filter (10 tests)
- TC-016: Keyword search
- TC-017: Category filter
- TC-018: Search metadata display
- TC-019: Advanced search
- TC-020: Search reset
- TC-021: Empty results handling
- TC-022: Search debouncing
- TC-023: URL state reflection
- TC-024: Tag filtering
- TC-025: Sort order

### Playground & Collaboration (10 tests)
- TC-026: Run prompt in playground
- TC-027: Variable injection
- TC-028: Execution history
- TC-029: Save execution result
- TC-030: Rate prompts
- TC-031: Comment on prompts
- TC-032: Reply to comments
- TC-033: Share prompts
- TC-034: Manage permissions
- TC-035: Fork prompts

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Ensure PostgreSQL is running:
```bash
docker-compose up postgres
```

3. Or have both backend and frontend running separately.

### Run All E2E Tests

```bash
npm run test:e2e
```

This will:
- Start backend server on port 5000
- Start frontend dev server on port 3000
- Run all E2E tests against both servers

### Run with UI (Interactive Mode)

```bash
npm run test:e2e:ui
```

Opens Playwright's test UI for interactive test running and debugging.

### Run in Debug Mode

```bash
npm run test:e2e:debug
```

Opens browser with inspector for step-by-step debugging.

### Run Headed (With Browser Window)

```bash
npm run test:e2e:headed
```

Runs tests with visible browser windows.

### Run Specific Test File

```bash
npx playwright test e2e/tests/auth.spec.ts
```

### Run Specific Test

```bash
npx playwright test -g "TC-001"
```

## Configuration

### Base URL

Default: `http://localhost:3000`

Can be overridden with environment variable:
```bash
BASE_URL=http://localhost:3000 npm run test:e2e
```

### Browsers

Default browsers: Chromium, Firefox, WebKit

To run only on Chromium:
```bash
npx playwright test --project=chromium
```

## Test Reports

After running tests, view the HTML report:

```bash
npx playwright show-report
```

Reports are generated in `test-results/` directory.

## Writing New Tests

1. Create a new test file in `e2e/tests/`:
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('TC-XXX: Test description', async ({ page }) => {
    // Arrange
    await page.goto('/');

    // Act
    await page.click('button');

    // Assert
    await expect(page).toHaveURL('/expected-path');
  });
});
```

2. Use existing test fixtures for authentication:
```typescript
import { test } from './setup';

test('uses authenticated page', async ({ authenticatedPage }) => {
  // Already authenticated
});
```

## Best Practices

1. **Use data-testid attributes**: Target elements with `data-testid` for stable selectors
2. **Wait for network idle**: Use `page.waitForLoadState('networkidle')` after API calls
3. **Handle async operations**: Use `waitForSelector` for dynamic content
4. **Clean up test data**: Use unique identifiers (timestamps) for test data
5. **Test error cases**: Verify validation and error messages
6. **Use test.skip()**: Skip tests gracefully when prerequisites aren't met

## Troubleshooting

### Tests timeout on server startup

Increase timeout in `playwright.config.ts`:
```typescript
webServer: {
  timeout: 180 * 1000, // 3 minutes
}
```

### Browser not installed

Install browsers:
```bash
npx playwright install
```

### Tests fail with "No prompts found"

Seed the database first:
```bash
cd backend && npm run seed
```

### Flaky tests

Add retries in `playwright.config.ts`:
```typescript
retries: 2,
```

## CI/CD Integration

Add to your CI pipeline:

```yaml
- name: Install dependencies
  run: npm ci

- name: Install Playwright browsers
  run: npx playwright install --with-deps

- name: Run E2E tests
  run: npm run test:e2e

- name: Upload test report
  if: always()
  uses: actions/upload-artifact@v3
  with:
    name: playwright-report
    path: test-results/
```

## Test Priorities

- **P0 (Critical)**: Authentication, Prompt CRUD, Basic search
- **P1 (Important)**: Advanced search, Collaboration features, Playground
- **P2 (Nice-to-have)**: Edge cases, Performance tests, Accessibility
