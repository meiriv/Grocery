import { test, expect, Page } from '@playwright/test';

/**
 * The Gemini model is discovered from the key rather than hardcoded. These
 * tests stub the models endpoint, so they never touch Google and never need a
 * real key - everything else (encryption, storage, the picker) runs for real.
 */

const MODELS_URL = '**/v1beta/models*';

// Deliberately out of order, with traps: a preview of a newer generation, an
// embedding model, a pinned build, and a thinking variant.
const API_RESPONSE = {
  models: [
    {
      name: 'models/gemini-2.0-flash-001',
      displayName: 'Gemini 2.0 Flash 001',
      supportedGenerationMethods: ['generateContent'],
    },
    {
      name: 'models/gemini-2.5-flash',
      displayName: 'Gemini 2.5 Flash',
      supportedGenerationMethods: ['generateContent'],
    },
    {
      name: 'models/gemini-2.5-pro',
      displayName: 'Gemini 2.5 Pro',
      supportedGenerationMethods: ['generateContent'],
    },
    {
      name: 'models/gemini-3-flash-preview',
      displayName: 'Gemini 3 Flash Preview',
      supportedGenerationMethods: ['generateContent'],
    },
    {
      name: 'models/text-embedding-004',
      displayName: 'Text Embedding',
      supportedGenerationMethods: ['embedContent'],
    },
  ],
};

async function stubModels(page: Page, body: unknown = API_RESPONSE, status = 200) {
  await page.route(MODELS_URL, (route) => {
    // The generateContent endpoint lives under the same path - leave it to its
    // own stub (or to fail, when a test did not set one)
    if (route.request().url().includes(':generateContent')) {
      return route.fallback();
    }
    
    return route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
  });
}

// What the SDK expects back from generateContent
function generateContentBody(text: string) {
  return {
    candidates: [{ content: { parts: [{ text }], role: 'model' }, finishReason: 'STOP' }],
  };
}

async function stubGeneration(page: Page, text = 'dairy', status = 200) {
  await page.route('**/v1beta/models/*:generateContent*', (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body:
        status === 200
          ? JSON.stringify(generateContentBody(text))
          : JSON.stringify({ error: { message: 'API key not valid' } }),
    })
  );
}

async function saveApiKey(page: Page) {
  await page.goto('/settings');
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await page.getByRole('button', { name: /Enter your Gemini API key/ }).click();
  await page.waitForSelector('[role="dialog"]');
  await page.locator('[role="dialog"] input[type="password"]').fill('AIzaTestKey1234567890');
  await page.locator('[role="dialog"]').getByRole('button', { name: /Test Connection/ }).click();
  await expect(page.getByText(/Connection successful/)).toBeVisible();
}

test.afterAll(async ({ browser }) => {
  const page = await browser.newPage();
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.close();
});

test.describe('Gemini model selection', () => {
  test('picks the best available model when the key is saved', async ({ page }) => {
    await stubModels(page);
    await saveApiKey(page);

    // Newest stable flash wins: the 3.x candidate is a preview, the pinned
    // -001 build loses to its rolling alias, and pro is slower for this job
    expect(await page.evaluate(() => localStorage.getItem('gemini-model-name'))).toBe(
      'gemini-2.5-flash'
    );

    // and it is shown in Settings
    await expect(page.getByText('gemini-2.5-flash').first()).toBeVisible();
  });

  test('lets a different model be chosen, and keeps it', async ({ page }) => {
    await stubModels(page);
    await saveApiKey(page);

    await page.getByRole('button', { name: /^Change$/ }).click();
    await page.waitForSelector('[role="dialog"]');

    // Embedding models cannot generate content, so they are not offered
    await expect(page.getByText('text-embedding-004')).toBeHidden();

    await page.getByRole('button', { name: /gemini-2\.5-pro/ }).click();

    expect(await page.evaluate(() => localStorage.getItem('gemini-model-name'))).toBe(
      'gemini-2.5-pro'
    );

    // A later key check must not overwrite a choice that is still available
    await page.reload();
    await expect(page.getByText('gemini-2.5-pro').first()).toBeVisible();
  });

  test('reports a key the API rejects', async ({ page }) => {
    await stubModels(page, { error: { message: 'API key not valid' } }, 400);

    await page.goto('/settings');
    await page.evaluate(() => localStorage.clear());
    await page.reload();

    await page.getByRole('button', { name: /Enter your Gemini API key/ }).click();
    await page.waitForSelector('[role="dialog"]');
    await page.locator('[role="dialog"] input[type="password"]').fill('not-a-real-key-at-all');
    await page.locator('[role="dialog"]').getByRole('button', { name: /Test Connection/ }).click();

    await expect(page.getByText(/Connection failed/)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('gemini-model-name'))).toBeNull();
  });
});

test.describe('Confirming the connection works', () => {
  test('a passing test reports the model and how long it took', async ({ page }) => {
    await stubModels(page);
    await stubGeneration(page);
    await saveApiKey(page);

    await page.getByRole('button', { name: /^Test$/ }).click();

    await expect(page.getByText(/Working - answered in \d+ ms/)).toBeVisible();
    // Shown twice now: the model row, and the result of the test
    await expect(page.getByText('gemini-2.5-flash').first()).toBeVisible();
  });

  test('a rejected key is reported in plain words', async ({ page }) => {
    await stubModels(page);
    await stubGeneration(page);
    await saveApiKey(page);

    // The key stops working after it was saved
    await stubGeneration(page, '', 400);

    await page.getByRole('button', { name: /^Test$/ }).click();

    await expect(page.getByText('The API key was rejected')).toBeVisible();
  });

  test('a failure while adding items is shown, not swallowed', async ({ page }) => {
    await stubModels(page);
    await stubGeneration(page);
    await saveApiKey(page);

    // Make the categorization call fail
    await stubGeneration(page, '', 400);

    // A list with an item no keyword matches, so AI is actually called
    await page.evaluate(() => {
      const now = new Date().toISOString();
      localStorage.setItem(
        'grocery-lists',
        JSON.stringify([
          { id: 'ai-1', name: 'AI List', items: [], createdAt: now, updatedAt: now },
        ])
      );
    });

    await page.goto('/list/ai-1');
    await page.locator('button.fixed, button[class*="fixed"]').first().click();
    const field = page.locator('form textarea, form input[type="text"]').first();
    await field.waitFor({ state: 'visible' });
    await field.fill('zzqqx');
    await page.locator('form button[type="submit"]').click();

    // The item is still added, and the failure is visible
    await expect(page.getByText('zzqqx')).toBeVisible();
    await expect(page.getByText(/AI categorization did not run/)).toBeVisible();
  });
});
