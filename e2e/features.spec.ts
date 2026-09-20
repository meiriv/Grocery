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

    // Walk Dairy up to the top with the keyboard. Two presses in a row also
    // covers the case where both land before React has re-rendered.
    await page.goto('/categories');
    const dairyHandle = page.getByRole('button', { name: /^Reorder: Dairy/ });
    await dairyHandle.focus();
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowUp');

    // Dairy is now first, and stays there across a reload
    await expect(page.getByRole('button', { name: 'Reorder: Dairy, 1/13' })).toBeVisible();
    await page.reload();
    await expect(page.getByRole('button', { name: 'Reorder: Dairy, 1/13' })).toBeVisible();

    // ...and shopping mode follows it
    await expect(await firstShoppingItem()).toContainText('Milk');
  });
});

test.describe('Dragging categories', () => {
  test('drops a category into its new place and remembers it', async ({ page }) => {
    await seed(page, {});
    await page.goto('/categories');

    // Frozen starts sixth; drag it to the top of the store route
    const frozenHandle = page.getByRole('button', { name: /^Reorder: Frozen/ });
    await expect(frozenHandle).toBeVisible();

    const handle = await frozenHandle.boundingBox();
    const target = await page.getByRole('button', { name: /^Reorder: Fruits/ }).boundingBox();
    if (!handle || !target) throw new Error('Could not measure the rows');

    await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
    await page.mouse.down();
    // Past the middle of the first row, in steps, so pointermove events fire
    await page.mouse.move(handle.x + handle.width / 2, target.y, { steps: 12 });
    await page.mouse.up();

    await expect(page.getByRole('button', { name: 'Reorder: Frozen, 1/13' })).toBeVisible();

    // Saved, not just moved on screen
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem('grocery-category-order') || '[]')[0]
      )
    ).toBe('frozen');

    await page.reload();
    await expect(page.getByRole('button', { name: 'Reorder: Frozen, 1/13' })).toBeVisible();
  });
});

test.describe('Dragging categories with a finger', () => {
  test.use({ hasTouch: true, viewport: { width: 393, height: 851 } });

  test('a touch drag moves the category', async ({ page }) => {
    await seed(page, {});
    await page.goto('/categories');

    const source = await page.getByRole('button', { name: /^Reorder: Dairy/ }).boundingBox();
    const target = await page.getByRole('button', { name: /^Reorder: Fruits/ }).boundingBox();
    if (!source || !target) throw new Error('Could not measure the rows');

    // Playwright has no touch-drag, so the pointer events a finger produces
    // are dispatched directly on the handle
    await page.evaluate(
      async ({ from, to }) => {
        const handle = Array.from(document.querySelectorAll('button')).find((button) =>
          button.getAttribute('aria-label')?.startsWith('Reorder: Dairy')
        );
        if (!handle) throw new Error('No handle');

        const send = (type: string, y: number) =>
          handle.dispatchEvent(
            new PointerEvent(type, {
              bubbles: true,
              cancelable: true,
              pointerId: 1,
              pointerType: 'touch',
              isPrimary: true,
              button: 0,
              clientX: from.x,
              clientY: y,
            })
          );

        send('pointerdown', from.y);
        await new Promise((resolve) => setTimeout(resolve, 60));

        for (let step = 1; step <= 8; step++) {
          send('pointermove', from.y + ((to.y - from.y) * step) / 8);
          await new Promise((resolve) => setTimeout(resolve, 30));
        }

        send('pointerup', to.y);
      },
      {
        from: { x: source.x + source.width / 2, y: source.y + source.height / 2 },
        to: { x: target.x + target.width / 2, y: target.y },
      }
    );

    await expect(page.getByRole('button', { name: 'Reorder: Dairy, 1/13' })).toBeVisible();
    expect(
      await page.evaluate(() =>
        JSON.parse(localStorage.getItem('grocery-category-order') || '[]')[0]
      )
    ).toBe('dairy');
  });
});
