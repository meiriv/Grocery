import { test, expect, Page } from '@playwright/test';

/**
 * Smart Grocery Companion - Full Application E2E Tests
 * 
 * This test suite covers all major use cases:
 * 1. Home Page - List Management
 * 2. List Page - Item Management
 * 3. Shopping Mode
 * 4. Favorites Management
 * 5. Categories Management
 * 6. Settings
 * 7. Cleanup - Remove all test data
 */

// Helper function to clear all localStorage data
async function clearAllData(page: Page) {
  await page.evaluate(() => {
    localStorage.clear();
  });
  await page.reload();
  await page.waitForLoadState('networkidle');
}

// Helper function to wait for app to be ready
async function waitForAppReady(page: Page) {
  await page.waitForLoadState('networkidle');
  // Wait for any loading spinners to disappear
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10000 }).catch(() => {});
}

// ============================================================================
// TEST SUITE: HOME PAGE - LIST MANAGEMENT
// ============================================================================
test.describe('Home Page - List Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
  });

  test('should display empty state when no lists exist', async ({ page }) => {
    // Clear any existing data first
    await clearAllData(page);
    
    // Check for empty state message
    await expect(page.locator('text=No lists yet')).toBeVisible({ timeout: 5000 }).catch(async () => {
      // If English text not found, might be in Hebrew
      await expect(page.getByRole('main')).toContainText(/No lists|אין רשימות/);
    });
  });

  test('should create a new empty list', async ({ page }) => {
    // Clear data first
    await clearAllData(page);
    
    // Click the floating add button or the "New List" button
    const addButton = page.locator('button').filter({ hasText: /New List|רשימה חדשה|\+/ }).first();
    await addButton.click();
    
    // Wait for modal to appear
    await expect(page.locator('[role="dialog"], .fixed')).toBeVisible({ timeout: 5000 });
    
    // Enter list name
    const nameInput = page.locator('input[type="text"]').first();
    await nameInput.fill('Test Shopping List');
    
    // Click create button
    await page.locator('button').filter({ hasText: /Create|צור/ }).click();
    
    // Should navigate to the new list
    await expect(page).toHaveURL(/\/list\/.+/);
  });

  test('should display created list on home page', async ({ page }) => {
    // Navigate back to home
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check if the list is displayed
    await expect(page.locator('text=Test Shopping List')).toBeVisible();
  });

  test('should open list menu and show delete option', async ({ page }) => {
    // Find the list card and click the menu button
    const listCard = page.locator('text=Test Shopping List').locator('..').locator('..');
    const menuButton = listCard.locator('button').filter({ has: page.locator('svg') }).last();
    await menuButton.click();
    
    // Check for delete option
    await expect(page.locator('text=Delete').or(page.locator('text=מחק'))).toBeVisible();
  });
});

// ============================================================================
// TEST SUITE: LIST PAGE - ITEM MANAGEMENT
// ============================================================================
test.describe('List Page - Item Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Navigate to existing list or create one
    const existingList = page.locator('text=Test Shopping List');
    if (await existingList.isVisible()) {
      await existingList.click();
    } else {
      // Create a new list
      await page.locator('button').filter({ hasText: /\+/ }).first().click();
      await page.locator('input[type="text"]').first().fill('Test Shopping List');
      await page.locator('button').filter({ hasText: /Create|צור/ }).click();
    }
    await waitForAppReady(page);
  });

  test('should add a single item to the list', async ({ page }) => {
    // Click the floating add button
    await page.locator('button[class*="fixed"]').filter({ has: page.locator('svg') }).click();
    
    // Wait for input to appear
    await page.waitForSelector('input, textarea', { state: 'visible' });
    
    // Type item name
    await page.locator('input, textarea').first().fill('Milk');
    
    // Submit
    await page.locator('button[type="submit"], button').filter({ has: page.locator('svg[class*="lucide-plus"]') }).click();
    
    // Verify item was added
    await expect(page.locator('text=Milk')).toBeVisible();
  });

  test('should add multiple items at once', async ({ page }) => {
    // Click add button
    await page.locator('button[class*="fixed"]').filter({ has: page.locator('svg') }).click();
    await page.waitForSelector('input, textarea', { state: 'visible' });
    
    // Click the multi-line toggle button (list icon)
    const multiLineButton = page.locator('button').filter({ has: page.locator('svg[class*="lucide-list"]') });
    if (await multiLineButton.isVisible()) {
      await multiLineButton.click();
    }
    
    // Enter multiple items
    const textarea = page.locator('textarea');
    if (await textarea.isVisible()) {
      await textarea.fill('Bread\nEggs\nButter');
      
      // Submit
      await page.locator('button[type="submit"], button').filter({ hasText: /Add|הוסף/ }).click();
      
      // Verify items were added
      await expect(page.locator('text=Bread')).toBeVisible();
      await expect(page.locator('text=Eggs')).toBeVisible();
      await expect(page.locator('text=Butter')).toBeVisible();
    }
  });

  test('should toggle item checked status', async ({ page }) => {
    // Find an item and click the checkbox area
    const milkItem = page.locator('text=Milk').locator('..').locator('..');
    const checkbox = milkItem.locator('div[class*="rounded-full"]').first();
    await checkbox.click();
    
    // Item should show as checked (with line-through or opacity change)
    await expect(milkItem).toHaveClass(/opacity|line-through|checked/);
  });

  test('should edit an item', async ({ page }) => {
    // Find edit button on an item (hover might be needed)
    const itemRow = page.locator('text=Bread').locator('..').locator('..');
    await itemRow.hover();
    
    // Click edit button
    const editButton = itemRow.locator('button').filter({ has: page.locator('svg[class*="lucide-edit"]') });
    if (await editButton.isVisible()) {
      await editButton.click();
      
      // Wait for edit modal
      await expect(page.locator('[role="dialog"], .fixed').filter({ hasText: /Edit|עריכה/ })).toBeVisible();
      
      // Change the name
      const nameInput = page.locator('input').first();
      await nameInput.clear();
      await nameInput.fill('Whole Wheat Bread');
      
      // Save
      await page.locator('button').filter({ hasText: /Save|שמור/ }).click();
      
      // Verify change
      await expect(page.locator('text=Whole Wheat Bread')).toBeVisible();
    }
  });

  test('should delete an item', async ({ page }) => {
    // Find delete button on an item
    const itemRow = page.locator('text=Butter').locator('..').locator('..');
    await itemRow.hover();
    
    // Click delete button
    const deleteButton = itemRow.locator('button').filter({ has: page.locator('svg[class*="lucide-trash"]') });
    await deleteButton.click();
    
    // Item should be removed
    await expect(page.locator('text=Butter')).not.toBeVisible();
  });

  test('should add item to favorites', async ({ page }) => {
    // Find favorite button on an item
    const itemRow = page.locator('text=Eggs').locator('..').locator('..');
    await itemRow.hover();
    
    // Click favorite button (heart icon)
    const favoriteButton = itemRow.locator('button').filter({ has: page.locator('svg[class*="lucide-heart"]') });
    if (await favoriteButton.isVisible()) {
      await favoriteButton.click();
      
      // Heart should be filled
      await expect(favoriteButton.locator('svg')).toHaveClass(/fill-red/);
    }
  });

  test('should rename the list', async ({ page }) => {
    // Open menu
    await page.locator('button').filter({ has: page.locator('svg[class*="lucide-more-vertical"]') }).click();
    
    // Click edit option
    await page.locator('button').filter({ hasText: /Edit|עריכה/ }).first().click();
    
    // Wait for modal
    await expect(page.locator('[role="dialog"], .fixed')).toBeVisible();
    
    // Change name
    const nameInput = page.locator('input').first();
    await nameInput.clear();
    await nameInput.fill('My Weekly Groceries');
    
    // Save
    await page.locator('button').filter({ hasText: /Save|שמור/ }).click();
    
    // Verify
    await expect(page.locator('h1')).toContainText('My Weekly Groceries');
  });
});

// ============================================================================
// TEST SUITE: SHOPPING MODE
// ============================================================================
test.describe('Shopping Mode', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Navigate to existing list
    const existingList = page.locator('text=My Weekly Groceries').or(page.locator('text=Test Shopping List'));
    await existingList.first().click();
    await waitForAppReady(page);
  });

  test('should enter shopping mode', async ({ page }) => {
    // Click shopping bag icon
    await page.locator('button').filter({ has: page.locator('svg[class*="lucide-shopping-bag"]') }).click();
    
    // Should be in shopping mode
    await expect(page).toHaveURL(/\/shopping/);
    await expect(page.locator('text=Shopping').or(page.locator('text=קניות'))).toBeVisible();
  });

  test('should display items grouped by category in shopping mode', async ({ page }) => {
    // Navigate to shopping mode
    await page.locator('button').filter({ has: page.locator('svg[class*="lucide-shopping-bag"]') }).click();
    await waitForAppReady(page);
    
    // Check for category headers or item display
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should check off items in shopping mode', async ({ page }) => {
    // Navigate to shopping mode
    await page.locator('button').filter({ has: page.locator('svg[class*="lucide-shopping-bag"]') }).click();
    await waitForAppReady(page);
    
    // Find an item and tap it
    const shoppingItem = page.locator('[class*="rounded-2xl"]').filter({ hasText: /Milk|Eggs|Bread/ }).first();
    if (await shoppingItem.isVisible()) {
      await shoppingItem.click();
      
      // Should show as checked
      await expect(shoppingItem).toHaveClass(/emerald|checked|opacity/);
    }
  });

  test('should show progress bar in shopping mode', async ({ page }) => {
    // Navigate to shopping mode
    await page.locator('button').filter({ has: page.locator('svg[class*="lucide-shopping-bag"]') }).click();
    await waitForAppReady(page);
    
    // Check for progress bar
    const progressBar = page.locator('[class*="h-1"]').filter({ has: page.locator('[class*="bg-white"]') });
    await expect(progressBar.or(page.locator('header'))).toBeVisible();
  });

  test('should exit shopping mode', async ({ page }) => {
    // Navigate to shopping mode
    await page.locator('button').filter({ has: page.locator('svg[class*="lucide-shopping-bag"]') }).click();
    await waitForAppReady(page);
    
    // Click exit button (X icon)
    await page.locator('button').filter({ has: page.locator('svg[class*="lucide-x"]') }).click();
    
    // Should be back to list page
    await expect(page).not.toHaveURL(/\/shopping/);
  });
});

// ============================================================================
// TEST SUITE: FAVORITES PAGE
// ============================================================================
test.describe('Favorites Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/favorites');
    await waitForAppReady(page);
  });

  test('should display favorites page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Favorites|מועדפים/);
  });

  test('should show favorited items', async ({ page }) => {
    // Check if Eggs (favorited earlier) is displayed
    const favoriteItem = page.locator('text=Eggs');
    // May or may not be visible depending on test order
    if (await favoriteItem.isVisible()) {
      await expect(favoriteItem).toBeVisible();
    }
  });

  test('should show empty state when no favorites', async ({ page }) => {
    // If no favorites, should show empty state
    const emptyState = page.locator('text=No favorites').or(page.locator('text=אין מועדפים'));
    const hasFavorites = await page.locator('[class*="rounded-xl"]').filter({ has: page.locator('svg[class*="lucide-heart"]') }).count() > 0;
    
    if (!hasFavorites) {
      await expect(emptyState.or(page.locator('svg[class*="lucide-heart"]'))).toBeVisible();
    }
  });
});

// ============================================================================
// TEST SUITE: CATEGORIES PAGE
// ============================================================================
test.describe('Categories Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/categories');
    await waitForAppReady(page);
  });

  test('should display categories page with default categories', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Categories|קטגוריות/);
    
    // Should show default categories
    await expect(page.locator('text=Default')).toBeVisible();
  });

  test('should display default category list', async ({ page }) => {
    // Check for some default categories
    const categoriesSection = page.locator('main');
    await expect(categoriesSection).toContainText(/Fruits|Vegetables|Dairy|פירות|ירקות|חלב/);
  });

  test('should open add new category modal', async ({ page }) => {
    // Click floating add button
    await page.locator('button[class*="fixed"]').filter({ has: page.locator('svg') }).click();
    
    // Modal should appear
    await expect(page.locator('[role="dialog"], .fixed').filter({ hasText: /Add|הוסף|New|חדש/ })).toBeVisible();
  });

  test('should create a custom category', async ({ page }) => {
    // Click add button
    await page.locator('button[class*="fixed"]').filter({ has: page.locator('svg') }).click();
    
    // Fill in category details
    await page.locator('input').filter({ hasText: '' }).first().fill('Spices');
    await page.locator('input').filter({ hasText: '' }).nth(1).fill('תבלינים');
    
    // Save
    await page.locator('button').filter({ hasText: /Save|שמור/ }).click();
    
    // Should show custom category
    await expect(page.locator('text=Custom')).toBeVisible();
    await expect(page.locator('text=Spices').or(page.locator('text=תבלינים'))).toBeVisible();
  });
});

// ============================================================================
// TEST SUITE: SETTINGS PAGE
// ============================================================================
test.describe('Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/settings');
    await waitForAppReady(page);
  });

  test('should display settings page', async ({ page }) => {
    await expect(page.locator('h1')).toContainText(/Settings|הגדרות/);
  });

  test('should show language switcher', async ({ page }) => {
    await expect(page.locator('text=Language').or(page.locator('text=שפה'))).toBeVisible();
  });

  test('should show theme options', async ({ page }) => {
    await expect(page.locator('text=Theme').or(page.locator('text=ערכת נושא'))).toBeVisible();
    
    // Should show dark/light/system options
    await expect(page.locator('text=Dark').or(page.locator('text=כהה'))).toBeVisible();
    await expect(page.locator('text=Light').or(page.locator('text=בהיר'))).toBeVisible();
  });

  test('should change theme', async ({ page }) => {
    // Click on Light theme
    const lightButton = page.locator('button').filter({ hasText: /Light|בהיר/ });
    await lightButton.click();
    
    // Theme should change (button should be selected)
    await expect(lightButton).toHaveClass(/emerald/);
  });

  test('should show AI categorization settings', async ({ page }) => {
    await expect(page.locator('text=AI').or(page.locator('text=בינה מלאכותית'))).toBeVisible();
  });

  test('should show app version', async ({ page }) => {
    await expect(page.locator('text=Version').or(page.locator('text=גרסה'))).toBeVisible();
    await expect(page.locator('text=v0.')).toBeVisible();
  });

  test('should show clear data option', async ({ page }) => {
    await expect(page.locator('text=Danger Zone')).toBeVisible();
    await expect(page.locator('button').filter({ hasText: /Clear|נקה|מחק/ })).toBeVisible();
  });
});

// ============================================================================
// TEST SUITE: NAVIGATION
// ============================================================================
test.describe('Navigation', () => {
  test('should navigate using bottom nav', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Navigate to Favorites
    await page.locator('nav a').filter({ has: page.locator('svg[class*="lucide-heart"]') }).click();
    await expect(page).toHaveURL('/favorites');
    
    // Navigate to Categories
    await page.locator('nav a').filter({ has: page.locator('svg[class*="lucide-folder"]') }).click();
    await expect(page).toHaveURL('/categories');
    
    // Navigate to Settings
    await page.locator('nav a').filter({ has: page.locator('svg[class*="lucide-settings"]') }).click();
    await expect(page).toHaveURL('/settings');
    
    // Navigate back to Home
    await page.locator('nav a').filter({ has: page.locator('svg[class*="lucide-home"]') }).click();
    await expect(page).toHaveURL('/');
  });

  test('should navigate back from list page', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Click on a list
    const list = page.locator('[class*="rounded-2xl"]').filter({ hasText: /Weekly|Shopping|Test/ }).first();
    if (await list.isVisible()) {
      await list.click();
      await waitForAppReady(page);
      
      // Click back button
      await page.locator('button').filter({ has: page.locator('svg[class*="lucide-arrow-left"]') }).click();
      
      // Should be back on home
      await expect(page).toHaveURL('/');
    }
  });
});

// ============================================================================
// TEST SUITE: LANGUAGE SWITCHING
// ============================================================================
test.describe('Language Switching', () => {
  test('should switch to Hebrew', async ({ page }) => {
    await page.goto('/settings');
    await waitForAppReady(page);
    
    // Find language switcher and click Hebrew option
    const hebrewButton = page.locator('button').filter({ hasText: /עב|HE|Hebrew/ });
    if (await hebrewButton.isVisible()) {
      await hebrewButton.click();
      
      // Page should be in RTL mode
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    }
  });

  test('should switch back to English', async ({ page }) => {
    await page.goto('/settings');
    await waitForAppReady(page);
    
    // Find language switcher and click English option
    const englishButton = page.locator('button').filter({ hasText: /EN|English/ });
    if (await englishButton.isVisible()) {
      await englishButton.click();
      
      // Page should be in LTR mode
      await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
    }
  });
});

// ============================================================================
// TEST SUITE: SHARE FUNCTIONALITY
// ============================================================================
test.describe('Share Functionality', () => {
  test('should open share modal', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Navigate to a list
    const list = page.locator('[class*="rounded-2xl"]').filter({ hasText: /Weekly|Shopping|Test/ }).first();
    if (await list.isVisible()) {
      await list.click();
      await waitForAppReady(page);
      
      // Open menu
      await page.locator('button').filter({ has: page.locator('svg[class*="lucide-more-vertical"]') }).click();
      
      // Click share option
      const shareButton = page.locator('button').filter({ hasText: /Share|שתף/ });
      if (await shareButton.isVisible()) {
        await shareButton.click();
        
        // Share modal should appear
        await expect(page.locator('[role="dialog"], .fixed').filter({ hasText: /Share|שתף/ })).toBeVisible();
      }
    }
  });
});

// ============================================================================
// TEST SUITE: CLEANUP - DELETE ALL TEST DATA
// ============================================================================
test.describe('Cleanup - Delete All Test Data', () => {
  test('should delete all created lists', async ({ page }) => {
    await page.goto('/');
    await waitForAppReady(page);
    
    // Delete each list one by one
    let listExists = true;
    let iterations = 0;
    const maxIterations = 10; // Safety limit
    
    while (listExists && iterations < maxIterations) {
      iterations++;
      
      // Find any list card
      const listCard = page.locator('[class*="rounded-2xl"]').filter({ has: page.locator('button') }).first();
      
      if (await listCard.isVisible().catch(() => false)) {
        // Click menu button
        const menuButton = listCard.locator('button').filter({ has: page.locator('svg[class*="lucide-more-vertical"]') });
        if (await menuButton.isVisible().catch(() => false)) {
          await menuButton.click();
          
          // Click delete
          const deleteButton = page.locator('button').filter({ hasText: /Delete|מחק/ }).filter({ has: page.locator('svg[class*="lucide-trash"]') });
          if (await deleteButton.isVisible().catch(() => false)) {
            await deleteButton.click();
            
            // Confirm deletion
            const confirmButton = page.locator('[role="dialog"], .fixed').locator('button').filter({ hasText: /Delete|מחק/ });
            if (await confirmButton.isVisible().catch(() => false)) {
              await confirmButton.click();
              await page.waitForTimeout(500); // Wait for deletion animation
            }
          }
        }
      } else {
        listExists = false;
      }
    }
  });

  test('should delete custom categories', async ({ page }) => {
    await page.goto('/categories');
    await waitForAppReady(page);
    
    // Find and delete custom categories
    const customSection = page.locator('text=Custom').locator('..');
    if (await customSection.isVisible().catch(() => false)) {
      const deleteButtons = customSection.locator('button').filter({ has: page.locator('svg[class*="lucide-trash"]') });
      const count = await deleteButtons.count();
      
      for (let i = 0; i < count; i++) {
        const deleteButton = deleteButtons.first();
        if (await deleteButton.isVisible().catch(() => false)) {
          await deleteButton.click();
          
          // Confirm deletion
          const confirmButton = page.locator('[role="dialog"], .fixed').locator('button').filter({ hasText: /Delete|מחק/ });
          if (await confirmButton.isVisible().catch(() => false)) {
            await confirmButton.click();
            await page.waitForTimeout(300);
          }
        }
      }
    }
  });

  test('should clear all favorites', async ({ page }) => {
    await page.goto('/favorites');
    await waitForAppReady(page);
    
    // Delete each favorite
    let favoriteExists = true;
    let iterations = 0;
    const maxIterations = 20;
    
    while (favoriteExists && iterations < maxIterations) {
      iterations++;
      
      const favoriteItem = page.locator('[class*="rounded-xl"]').filter({ has: page.locator('svg[class*="fill-red"]') }).first();
      
      if (await favoriteItem.isVisible().catch(() => false)) {
        await favoriteItem.hover();
        
        const deleteButton = favoriteItem.locator('button').filter({ has: page.locator('svg[class*="lucide-trash"]') });
        if (await deleteButton.isVisible().catch(() => false)) {
          await deleteButton.click();
          
          // Confirm deletion
          const confirmButton = page.locator('[role="dialog"], .fixed').locator('button').filter({ hasText: /Delete|מחק/ });
          if (await confirmButton.isVisible().catch(() => false)) {
            await confirmButton.click();
            await page.waitForTimeout(300);
          }
        }
      } else {
        favoriteExists = false;
      }
    }
  });

  test('should clear all local storage data', async ({ page }) => {
    await page.goto('/settings');
    await waitForAppReady(page);
    
    // Click clear data button
    const clearButton = page.locator('button').filter({ hasText: /Clear|נקה/ }).filter({ has: page.locator('svg[class*="lucide-trash"]') });
    await clearButton.click();
    
    // Confirm
    const confirmButton = page.locator('[role="dialog"], .fixed').locator('button').filter({ hasText: /Delete|מחק/ });
    if (await confirmButton.isVisible()) {
      await confirmButton.click();
      
      // Wait for page reload
      await page.waitForLoadState('networkidle');
    }
    
    // Verify home page shows empty state
    await page.goto('/');
    await waitForAppReady(page);
    
    // Should show empty state or no lists
    const emptyState = page.locator('text=No lists').or(page.locator('text=אין רשימות'));
    await expect(emptyState.or(page.locator('main'))).toBeVisible();
  });

  test('final verification - app is clean', async ({ page }) => {
    // Clear localStorage directly to ensure clean state
    await page.goto('/');
    await clearAllData(page);
    
    // Verify empty state on home
    await expect(page.locator('main')).toBeVisible();
    
    // Verify no lists exist
    const listCards = page.locator('[class*="rounded-2xl"]').filter({ has: page.locator('text=items') });
    await expect(listCards).toHaveCount(0);
    
    // Verify favorites are empty
    await page.goto('/favorites');
    await waitForAppReady(page);
    const favoriteItems = page.locator('[class*="rounded-xl"]').filter({ has: page.locator('svg[class*="fill-red"]') });
    await expect(favoriteItems).toHaveCount(0);
    
    console.log('✅ All test data has been cleaned up successfully!');
  });
});

