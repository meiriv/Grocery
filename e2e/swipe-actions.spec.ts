import { test, expect, Page } from '@playwright/test';

/**
 * Gestures on the items. Playwright has no swipe, so the touch events a finger
 * produces are built in the page and sent one at a time - React has to render
 * between them for the gesture to advance.
 */

test.use({ hasTouch: true, viewport: { width: 390, height: 844 } });

const now = () => new Date().toISOString();

async function seedList(page: Page) {
  await page.goto('/');
  await page.evaluate((stamp) => {
    localStorage.clear();
    const item = (id: string, name: string, categoryId: string) => ({
      id, name, categoryId, quantity: 1, unit: 'unit', status: 'pending', addedAt: stamp,
    });
    localStorage.setItem('grocery-lists', JSON.stringify([{
      id: 'g1', name: 'Gestures', createdAt: stamp, updatedAt: stamp,
      items: [item('a', 'Apples', 'fruits'), item('m', 'Milk', 'dairy'), item('b', 'Bread', 'bakery')],
    }]));
  }, now());
}

/**
 * Send a touch that moves by (dx, dy) in `steps`. The start point is measured
 * once - the element slides under the finger, so re-measuring it on each step
 * would add its own movement to the drag.
 */
async function drag(
  page: Page,
  target: { selector: string; text?: string },
  dx: number,
  dy: number,
  { steps = 8, stepMs = 30 } = {}
) {
  const origin = await page.evaluate(({ selector, text }) => {
    const el = Array.from(document.querySelectorAll(selector)).find(
      (candidate) => !text || candidate.textContent?.includes(text)
    ) as HTMLElement | undefined;
    if (!el) throw new Error(`Nothing matches ${selector} ${text ?? ''}`);
    document.querySelectorAll('[data-drag-target]').forEach((old) => old.removeAttribute('data-drag-target'));
    el.setAttribute('data-drag-target', '');
    const rect = el.getBoundingClientRect();
    return { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
  }, target);

  const send = (type: string, x: number, y: number) =>
    page.evaluate(({ type, x, y }) => {
      const el = document.querySelector('[data-drag-target]');
      if (!el) return; // acted on and re-rendered already
      const touch = new Touch({ identifier: 7, target: el, clientX: x, clientY: y });
      el.dispatchEvent(new TouchEvent(type, {
        bubbles: true, cancelable: true,
        touches: type === 'touchend' ? [] : [touch],
        changedTouches: [touch],
      }));
    }, { type, x, y });

  await send('touchstart', origin.x, origin.y);
  await page.waitForTimeout(stepMs);
  for (let i = 1; i <= steps; i++) {
    await send('touchmove', origin.x + (dx * i) / steps, origin.y + (dy * i) / steps);
    await page.waitForTimeout(stepMs);
  }
  await send('touchend', origin.x + dx, origin.y + dy);
  await page.waitForTimeout(400);
}

const status = (page: Page, id: string) =>
  page.evaluate(
    (itemId) => JSON.parse(localStorage.getItem('grocery-lists') || '[]')[0]
      .items.find((i: { id: string }) => i.id === itemId)?.status,
    id
  );

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.close();
});

test.describe('Shopping mode', () => {
  const apples = '[role="checkbox"][aria-checked]';

  async function openShopping(page: Page) {
    await seedList(page);
    await page.goto('/list/g1/shopping');
    await expect(page.locator(apples).first()).toContainText('Apples');
  }

  test('swiping right ticks an item off', async ({ page }) => {
    await openShopping(page);

    await drag(page, { selector: apples, text: 'Apples' }, 160, 0);

    expect(await status(page, 'a')).toBe('checked');
  });

  test('swiping left marks it out of stock', async ({ page }) => {
    await openShopping(page);

    await drag(page, { selector: apples, text: 'Apples' }, -160, 0);

    expect(await status(page, 'a')).toBe('out_of_stock');
  });

  test('a short swipe that is let go early does nothing', async ({ page }) => {
    await openShopping(page);

    await drag(page, { selector: apples, text: 'Apples' }, 60, 0);

    expect(await status(page, 'a')).toBe('pending');
  });

  test('a quick flick to scroll does not tick the item it started on', async ({ page }) => {
    await openShopping(page);

    // Fast and vertical: well under the time a tap may take
    await drag(page, { selector: apples, text: 'Apples' }, 0, -120, { steps: 3, stepMs: 10 });

    expect(await status(page, 'a')).toBe('pending');
  });

  test('a scroll that drifts sideways stays a scroll', async ({ page }) => {
    await openShopping(page);

    // Mostly up, but 130px across by the end - enough to have counted as a
    // swipe before the direction was locked on the first movement
    await drag(page, { selector: apples, text: 'Apples' }, -130, -260, { steps: 10, stepMs: 20 });

    expect(await status(page, 'a')).toBe('pending');
  });
});

test.describe('List view', () => {
  test('a deleted item can be put back, in the same place', async ({ page }) => {
    await seedList(page);
    await page.goto('/list/g1');

    // Swipe Milk (the middle item) away
    await expect(page.getByText('Milk', { exact: true })).toBeVisible();
    await drag(page, { selector: 'main [class*="touch-pan-y"]', text: 'Milk' }, -160, 0);

    expect(await status(page, 'm')).toBeUndefined();
    await expect(page.getByText('"Milk" deleted')).toBeVisible();

    await page.getByRole('button', { name: 'Undo' }).click();

    const names = await page.evaluate(() =>
      JSON.parse(localStorage.getItem('grocery-lists') || '[]')[0].items.map((i: { name: string }) => i.name)
    );
    expect(names).toEqual(['Apples', 'Milk', 'Bread']);
  });
});
