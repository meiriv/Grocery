import { test, expect } from '@playwright/test';

/**
 * Regression tests for data handling that is easy to break:
 * - favorites must end up in the list the user picked
 * - items must never disappear because their category or unit is unknown
 */

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.close();
});

test('favorites add-all lands in an existing list', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());

  // Seed a list and a favorite directly in storage
  await page.evaluate(() => {
    const now = new Date().toISOString();
    localStorage.setItem('grocery-lists', JSON.stringify([
      { id: 'list-1', name: 'Target List', items: [], createdAt: now, updatedAt: now },
    ]));
    localStorage.setItem('grocery-favorites', JSON.stringify([
      { id: 'fav-1', name: 'Coffee', categoryId: 'beverages', quantity: 1, unit: 'unit', addedAt: now },
    ]));
  });

  await page.goto('/favorites');
  await page.getByRole('button', { name: /Add All to List/ }).click();
  await page.waitForSelector('[role="dialog"]');
  await page.locator('[role="dialog"] button').filter({ hasText: /Select a list/ }).click();
  await page.getByText('Target List', { exact: true }).click();
  await page.locator('[role="dialog"]').getByRole('button', { name: /^Add$/ }).click();

  await page.waitForURL(/\/list\/list-1/);
  await expect(page.getByText('Coffee')).toBeVisible();
});

test('items whose category was deleted are still shown', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.evaluate(() => {
    const now = new Date().toISOString();
    localStorage.setItem('grocery-lists', JSON.stringify([
      {
        id: 'list-2',
        name: 'Orphans',
        items: [
          { id: 'i1', name: 'Mystery Item', categoryId: 'deleted-category', quantity: 1, unit: 'unit', status: 'pending', addedAt: now },
          { id: 'i2', name: 'Bad Unit Item', categoryId: 'dairy', quantity: 2, unit: 'not-a-unit', status: 'pending', addedAt: now },
        ],
        createdAt: now,
        updatedAt: now,
      },
    ]));
  });

  await page.goto('/list/list-2');
  await expect(page.getByText('Mystery Item')).toBeVisible();
  await expect(page.getByText('Uncategorized')).toBeVisible();
  // an unknown unit must not crash the page
  await expect(page.getByText('Bad Unit Item')).toBeVisible();

  // and in shopping mode too
  await page.goto('/list/list-2/shopping');
  await expect(page.getByText('Mystery Item')).toBeVisible();
});
