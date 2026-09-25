import { test, expect, Page } from '@playwright/test';

/**
 * The two jobs the app does on a phone: starting a list quickly, and keeping
 * it right while standing in the store.
 */

test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

const now = () => new Date().toISOString();

async function seed(page: Page, lists: unknown[] = []) {
  await page.goto('/');
  await page.evaluate((data) => {
    localStorage.clear();
    localStorage.setItem('grocery-lists', JSON.stringify(data));
  }, lists);
}

function storedLists(page: Page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem('grocery-lists') || '[]'));
}

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.close();
});

test.describe('Starting a list quickly', () => {
  test('the home-screen shortcut opens a new list in one tap, ready to type', async ({ page }) => {
    await seed(page);

    // What the "New List" shortcut on the app icon opens
    await page.goto('/?action=new-list');
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();

    // Named already, so Create works without typing anything
    await expect(dialog.locator('input').first()).toHaveValue(/^Shopping /);
    await dialog.getByRole('button', { name: 'Create List' }).click();

    // Lands on the new list with the add field open
    await page.waitForURL(/\/list\/[^?]+$/);
    await expect(page.locator('form textarea, form input[type="text"]').first()).toBeVisible();

    const lists = await storedLists(page);
    expect(lists).toHaveLength(1);
    expect(lists[0].name).toMatch(/^Shopping /);
  });

  test("the keyboard's Go key creates the list with the typed name", async ({ page }) => {
    await seed(page);
    await page.goto('/');
    await page.locator('button.fab').click();

    const name = page.locator('[role="dialog"] input').first();
    await name.fill('Barbecue');
    await name.press('Enter');

    await page.waitForURL(/\/list\//);
    await expect(page.locator('h1')).toHaveText('Barbecue');
  });
});

test.describe('Managing items while shopping', () => {
  const list = () => ({
    id: 'shop-1',
    name: 'In the store',
    createdAt: now(),
    updatedAt: now(),
    items: [
      { id: 'm', name: 'Milk', categoryId: 'dairy', quantity: 1, unit: 'l', status: 'pending', addedAt: now() },
      { id: 't', name: 'Tomatoes', categoryId: 'vegetables', quantity: 1, unit: 'kg', status: 'pending', addedAt: now() },
      { id: 'b', name: 'Bread', categoryId: 'bakery', quantity: 1, unit: 'unit', status: 'checked', addedAt: now() },
    ],
  });

  test('something forgotten is added without leaving shopping mode', async ({ page }) => {
    await seed(page, [list()]);
    await page.goto('/list/shop-1/shopping');

    await page.getByRole('button', { name: 'Add an item' }).click();
    const field = page.locator('[role="dialog"] form textarea, [role="dialog"] form input[type="text"]').first();
    await field.fill('Batteries');
    await page.locator('[role="dialog"] form button[type="submit"]').click();

    await expect(page).toHaveURL(/\/shopping$/);
    await expect(page.locator('[role="checkbox"]').filter({ hasText: 'Batteries' })).toBeVisible();
  });

  test('adding something already ticked off puts it back on the list', async ({ page }) => {
    await seed(page, [list()]);
    await page.goto('/list/shop-1/shopping');

    await page.getByRole('button', { name: 'Add an item' }).click();
    const field = page.locator('[role="dialog"] form textarea, [role="dialog"] form input[type="text"]').first();
    await field.fill('Bread');
    await page.locator('[role="dialog"] form button[type="submit"]').click();

    const bread = (await storedLists(page))[0].items.find((i: { id: string }) => i.id === 'b');
    expect(bread.status).toBe('pending');
  });

  test('an item can be changed, marked out of stock, brought back and deleted', async ({ page }) => {
    await seed(page, [list()]);
    await page.goto('/list/shop-1/shopping');

    // Quantity, saved as it changes
    await page.getByRole('button', { name: 'More for Milk' }).click();
    const sheet = page.locator('[role="dialog"]');
    await sheet.getByRole('button', { name: 'Increase quantity' }).click();
    await expect.poll(async () => (await storedLists(page))[0].items[0].quantity).toBeGreaterThan(1);

    // Out of stock
    await sheet.getByRole('button', { name: 'Out of Stock' }).click();
    await expect.poll(async () => (await storedLists(page))[0].items[0].status).toBe('out_of_stock');

    // ...and back again
    await page.getByRole('button', { name: 'More for Milk' }).click();
    await sheet.getByRole('button', { name: 'Back on the list' }).click();
    await expect.poll(async () => (await storedLists(page))[0].items[0].status).toBe('pending');

    // Delete
    await page.getByRole('button', { name: 'More for Tomatoes' }).click();
    await sheet.getByRole('button', { name: 'Delete' }).click();
    await expect(page.locator('[role="checkbox"]').filter({ hasText: 'Tomatoes' })).toHaveCount(0);
  });

  test('tapping the actions button does not tick the item off', async ({ page }) => {
    await seed(page, [list()]);
    await page.goto('/list/shop-1/shopping');

    await page.getByRole('button', { name: 'More for Milk' }).tap();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    expect((await storedLists(page))[0].items[0].status).toBe('pending');
  });
});

test.describe('What the phone actually draws', () => {
  // These classes are data in lib/categories.ts; Tailwind used to strip them
  test('every category keeps its colour', async ({ page }) => {
    const items = ['fruits', 'vegetables', 'dairy', 'meat', 'bakery', 'frozen', 'beverages', 'snacks'].map(
      (categoryId, i) => ({
        id: `c${i}`, name: `Item ${i}`, categoryId, quantity: 1, unit: 'unit', status: 'pending', addedAt: now(),
      })
    );
    await seed(page, [{ id: 'col', name: 'Colours', items, createdAt: now(), updatedAt: now() }]);
    await page.goto('/list/col');

    const dots = page.locator('main button span.rounded-full.w-3');
    await expect(dots).toHaveCount(8);
    const colours = await dots.evaluateAll((els) =>
      els.map((el) => getComputedStyle(el).backgroundColor)
    );
    for (const colour of colours) {
      expect(colour).not.toBe('rgba(0, 0, 0, 0)');
    }
  });

  test('the shopping checkbox has a visible ring', async ({ page }) => {
    await seed(page, [
      {
        id: 'ring', name: 'Ring', createdAt: now(), updatedAt: now(),
        items: [{ id: 'r', name: 'Milk', categoryId: 'dairy', quantity: 1, unit: 'l', status: 'pending', addedAt: now() }],
      },
    ]);
    await page.goto('/list/ring/shopping');

    const ring = page.locator('[role="checkbox"] > div.rounded-full').first();
    await expect(ring).toHaveCSS('border-top-width', '3px');
  });
});
