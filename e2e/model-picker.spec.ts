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
  await page.route(MODELS_URL, (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body),
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
    await expect(page.getByText('gemini-2.5-flash')).toBeVisible();
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
    await expect(page.getByText('gemini-2.5-pro')).toBeVisible();
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
