import { test, expect, Page } from '@playwright/test';

/**
 * Quick add from history, and the shopping (aisle) order.
 */

async function seed(page: Page, data: Record<string, unknown>) {
  await page.goto('/');
  await page.evaluate((entries) => {
    localStorage.clear();
    for (const [key, value] of Object.entries(entries)) {
      localStorage.setItem(key, JSON.stringify(value));
    }
  }, data);
}

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.close();
});

test.describe('Quick add from history', () => {
  test('offers frequently bought items and adds one in a tap', async ({ page }) => {
    const now = new Date().toISOString();

    await seed(page, {
      'grocery-lists': [
        { id: 'quick-1', name: 'Quick Add List', items: [], createdAt: now, updatedAt: now },
      ],
      'grocery-frequent': [
        { name: 'Coffee', categoryId: 'beverages', quantity: 1, unit: 'unit', useCount: 9, lastUsed: now },
        { name: 'Milk', categoryId: 'dairy', quantity: 1, unit: 'l', useCount: 4, lastUsed: now },
      ],
    });

    await page.goto('/list/quick-1');

    // An empty list offers the history straight away
    const coffeeChip = page.getByRole('button', { name: 'Coffee' });
    await expect(coffeeChip).toBeVisible();

    await coffeeChip.click();

    // It is in the list now...
    await expect(page.getByText('Coffee', { exact: true })).toBeVisible();
    expect(
      await page.evaluate(
        () => JSON.parse(localStorage.getItem('grocery-lists') || '[]')[0].items.length
      )
    ).toBe(1);

    // ...and the suggestions - now under the input - offer what is left
    await page.locator('button.fixed, button[class*="fixed"]').first().click();
    await expect(page.getByRole('button', { name: 'Milk' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Coffee' })).toBeHidden();
  });
});

test.describe('Shopping order', () => {
  test('reordering categories changes the order while shopping', async ({ page }) => {
    const now = new Date().toISOString();

    await seed(page, {
      'grocery-lists': [
        {
          id: 'aisle-1',
          name: 'Aisle List',
          items: [
            { id: 'a1', name: 'Apples', categoryId: 'fruits', quantity: 1, unit: 'kg', status: 'pending', addedAt: now },
            { id: 'a2', name: 'Milk', categoryId: 'dairy', quantity: 1, unit: 'l', status: 'pending', addedAt: now },
          ],
          createdAt: now,
          updatedAt: now,
        },
      ],
    });

    // The first item in shopping mode belongs to whichever category comes first
    const firstShoppingItem = async () => {
      await page.goto('/list/aisle-1/shopping');
      return page.locator('[role="checkbox"]').first();
    };

    // Default order has Fruits before Dairy
    await expect(await firstShoppingItem()).toContainText('Apples');

    // Walk Dairy up to the top of the aisle order. Two taps in a row also
    // covers the case where both land before React has re-rendered.
    await page.goto('/categories');
    const moveDairyUp = page.getByRole('button', { name: 'Move up: Dairy' });
    await moveDairyUp.click();
    await moveDairyUp.click();

    // Dairy is now top of the list, and stays there across a reload - the
    // arrow of the first category is the one that gets disabled
    await expect(moveDairyUp).toBeDisabled();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Move up: Dairy' })).toBeDisabled();

    // ...and shopping mode follows it
    await expect(await firstShoppingItem()).toContainText('Milk');
  });
});
