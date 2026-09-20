import { test, expect, Page } from '@playwright/test';

/**
 * Regression tests for data handling that is easy to break:
 * - favorites must end up in the list the user picked
 * - items must never disappear because their category or unit is unknown
 */

// Dispatch a real left swipe. Playwright has no swipe helper, so the touch
// events are built in the page (the context must have touch enabled) and are
// sent one at a time - React has to re-render between them for the gesture
// state to advance.
async function swipeLeft(page: Page, selector: string) {
  const fire = async (type: string, offsetX: number, ended = false) => {
    await page.evaluate(
      ({ sel, type, offsetX, ended }) => {
        const el = document.querySelector(sel);
        if (!el) throw new Error(`No element for ${sel}`);
        const rect = el.getBoundingClientRect();
        const y = rect.top + rect.height / 2;
        const x = rect.right - 20 + offsetX;
        const touch = new Touch({ identifier: 1, target: el, clientX: x, clientY: y });

        el.dispatchEvent(
          new TouchEvent(type, {
            bubbles: true,
            cancelable: true,
            touches: ended ? [] : [touch],
            changedTouches: [touch],
          })
        );
      },
      { sel: selector, type, offsetX, ended }
    );
    await page.waitForTimeout(80);
  };

  await fire('touchstart', 0);
  await fire('touchmove', -40);
  await fire('touchmove', -140);
  await fire('touchend', -140, true);
  await page.waitForTimeout(300);
}

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

test.describe('Swipe to delete a list', () => {
  test.use({ hasTouch: true, viewport: { width: 393, height: 851 } });

  test('removes the list and can be undone', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.evaluate(() => {
      const now = new Date().toISOString();
      localStorage.setItem('grocery-lists', JSON.stringify([
        { id: 'swipe-1', name: 'Swipe Me Away', items: [], createdAt: now, updatedAt: now },
      ]));
    });

    await page.goto('/');
    const card = page.getByRole('heading', { name: 'Swipe Me Away' });
    await expect(card).toBeVisible();

    // Target the card itself - the swipe handlers sit on it, and touch events
    // bubble up from whatever is under the finger
    await swipeLeft(page, 'main .space-y-3 > div h3');

    // Gone from the list, and from storage
    await expect(card).toBeHidden();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('grocery-lists') || '[]').length)).toBe(0);

    // ...until it is undone
    await page.getByRole('button', { name: /Undo|בטל/ }).click();
    await expect(card).toBeVisible();
    expect(await page.evaluate(() => JSON.parse(localStorage.getItem('grocery-lists') || '[]').length)).toBe(1);
  });
});
