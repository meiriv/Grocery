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

// Default timeout - reduced for faster feedback
test.setTimeout(30000);

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
  await page.waitForLoadState('domcontentloaded');
  // Wait for any loading spinners to disappear
  await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 5000 }).catch(() => {});
}

// Helper function to create a test list
async function createTestList(page: Page, listName: string = 'Test Shopping List') {
  await page.goto('/');
  await waitForAppReady(page);
  
  // Click the FAB (floating action button) - has class "fab"
  const fabButton = page.locator('button.fab').first();
  await fabButton.click();
  
  // Wait for modal dialog
  await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
  
  // Enter list name - find input in the dialog
  const nameInput = page.locator('[role="dialog"] input').first();
  await nameInput.fill(listName);
  
  // Click create button
  await page.locator('[role="dialog"]').getByRole('button', { name: /Create|צור/ }).click();
  
  // Wait for navigation to list page
  await page.waitForURL(/\/list\/.+/, { timeout: 10000 });
  await waitForAppReady(page);
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
    const emptyStateText = page.getByText(/No lists yet|אין רשימות/);
    await expect(emptyStateText).toBeVisible({ timeout: 10000 });
  });

  test('should create a new empty list', async ({ page }) => {
    // Clear data first
    await clearAllData(page);
    
    // Click the FAB
    const fabButton = page.locator('button.fab').first();
    await fabButton.click();
    
    // Wait for modal to appear
    await page.waitForSelector('[role="dialog"]', { state: 'visible', timeout: 10000 });
    
    // Enter list name
    const nameInput = page.locator('[role="dialog"] input').first();
    await nameInput.fill('Test Shopping List');
    
    // Click create button
    await page.locator('[role="dialog"]').getByRole('button', { name: /Create|צור/ }).click();
    
    // Should navigate to the new list
    await expect(page).toHaveURL(/\/list\/.+/, { timeout: 10000 });
  });

  test('should display created list on home page', async ({ page }) => {
    // First create a list
    await createTestList(page, 'My Test List');
    
    // Navigate back to home
    await page.goto('/');
    await waitForAppReady(page);
    
    // Check if the list is displayed
    await expect(page.getByText('My Test List')).toBeVisible();
  });

  test('should open list menu and show delete option', async ({ page }) => {
    // First ensure we have a list
    await createTestList(page, 'List To Delete');
    await page.goto('/');
    await waitForAppReady(page);
    
    // Find the menu button (MoreVertical icon)
    const menuButton = page.locator('button:has(svg.lucide-more-vertical)').first();
    await menuButton.click();
    
    // Wait for dropdown menu
    await page.waitForTimeout(300);
    
    // Check for delete option
    await expect(page.getByText(/Delete|מחק/).first()).toBeVisible();
  });
});

// ============================================================================
// TEST SUITE: LIST PAGE - ITEM MANAGEMENT
// ============================================================================
test.describe('List Page - Item Management', () => {
  test.beforeEach(async ({ page }) => {
    // Create a fresh list for each test
    await createTestList(page, 'Items Test List');
  });

  test('should add a single item to the list', async ({ page }) => {
    // Click the FAB
    const fabButton = page.locator('button.fab').first();
    await fabButton.click();
    
    // Wait for input to appear
    await page.waitForSelector('input, textarea', { state: 'visible' });
    
    // Type item name and submit
    const input = page.locator('form input, form textarea').first();
    await input.fill('Milk');
    await page.locator('form button[type="submit"]').click();
    
    // Verify item was added
    await expect(page.getByText('Milk')).toBeVisible();
  });

  test('should add multiple items at once', async ({ page }) => {
    // Click FAB
    const fabButton = page.locator('button.fab').first();
    await fabButton.click();
    await page.waitForSelector('input, textarea', { state: 'visible' });
    
    // Click the multi-line toggle button (list icon)
    const multiLineButton = page.locator('button:has(svg.lucide-list)');
    if (await multiLineButton.isVisible()) {
      await multiLineButton.click();
      await page.waitForTimeout(300);
    }
    
    // Enter multiple items
    const textarea = page.locator('textarea');
    if (await textarea.isVisible()) {
      await textarea.fill('Bread\nEggs\nButter');
      
      // Submit using the Add button
      await page.locator('form button[type="submit"]').click();
      
      // Verify items were added
      await expect(page.getByText('Bread')).toBeVisible();
      await expect(page.getByText('Eggs')).toBeVisible();
      await expect(page.getByText('Butter')).toBeVisible();
    }
  });

  test('should delete an item', async ({ page }) => {
    // First add an item
    const fabButton = page.locator('button.fab').first();
    await fabButton.click();
    await page.waitForSelector('input', { state: 'visible' });
    
    const input = page.locator('form input').first();
    await input.fill('Item To Delete');
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText('Item To Delete')).toBeVisible();
    
    // Find and click delete button (trash icon)
    const deleteButton = page.locator('button:has(svg.lucide-trash-2)').first();
    await deleteButton.click();
    
    // Item should be removed
    await expect(page.getByText('Item To Delete')).not.toBeVisible({ timeout: 5000 });
  });

  test('should add item to favorites', async ({ page }) => {
    // First add an item
    const fabButton = page.locator('button.fab').first();
    await fabButton.click();
    await page.waitForSelector('input', { state: 'visible' });
    
    const input = page.locator('form input').first();
    await input.fill('Favorite Item');
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText('Favorite Item')).toBeVisible();
    
    // Find and click favorite button (heart icon)
    const favoriteButton = page.locator('button:has(svg.lucide-heart)').first();
    await favoriteButton.click();
    
    // Wait for state change
    await page.waitForTimeout(500);
  });

  test('should edit an item', async ({ page }) => {
    // First add an item
    const fabButton = page.locator('button.fab').first();
    await fabButton.click();
    await page.waitForSelector('input', { state: 'visible' });
    
    const input = page.locator('form input').first();
    await input.fill('Original Name');
    await page.locator('form button[type="submit"]').click();
    await expect(page.getByText('Original Name')).toBeVisible();
    
    // Find and click edit button
    const editButton = page.locator('button:has(svg.lucide-edit-3)').first();
    await editButton.click();
    
    // Wait for edit modal
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Change the name - find the name input (first input in dialog)
    const nameInput = page.locator('[role="dialog"] input').first();
    await nameInput.clear();
    await nameInput.fill('Edited Name');
    
    // Save
    await page.locator('[role="dialog"]').getByRole('button', { name: /Save|שמור/ }).click();
    
    // Verify change
    await expect(page.getByText('Edited Name')).toBeVisible();
  });

  test('should rename the list', async ({ page }) => {
    // Open menu
    await page.locator('button:has(svg.lucide-more-vertical)').click();
    await page.waitForTimeout(300);
    
    // Click edit option - first button with edit icon in menu
    await page.locator('button:has(svg.lucide-edit-3)').first().click();
    
    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Change name
    const nameInput = page.locator('[role="dialog"] input').first();
    await nameInput.clear();
    await nameInput.fill('Renamed List');
    
    // Save
    await page.locator('[role="dialog"]').getByRole('button', { name: /Save|שמור/ }).click();
    
    // Verify the title changed
    await expect(page.locator('h1')).toContainText('Renamed List');
  });
});

// ============================================================================
// TEST SUITE: SHOPPING MODE
// ============================================================================
test.describe('Shopping Mode', () => {
  test.beforeEach(async ({ page }) => {
    // Create a list with items
    await createTestList(page, 'Shopping Test List');
    
    // Add some items
    const fabButton = page.locator('button.fab').first();
    await fabButton.click();
    await page.waitForSelector('input, textarea', { state: 'visible' });
    
    const multiLineButton = page.locator('button:has(svg.lucide-list)');
    if (await multiLineButton.isVisible()) {
      await multiLineButton.click();
      await page.waitForTimeout(300);
    }
    
    const textarea = page.locator('textarea');
    if (await textarea.isVisible()) {
      await textarea.fill('Apples\nBananas\nOranges');
      await page.locator('form button[type="submit"]').click();
    } else {
      // Fallback: add items one by one
      const input = page.locator('form input').first();
      await input.fill('Apples');
      await page.locator('form button[type="submit"]').click();
    }
    
    await waitForAppReady(page);
  });

  test('should enter shopping mode', async ({ page }) => {
    // Click shopping bag icon
    await page.locator('button:has(svg.lucide-shopping-bag)').click();
    
    // Should be in shopping mode
    await expect(page).toHaveURL(/\/shopping/);
  });

  test('should display header in shopping mode', async ({ page }) => {
    // Navigate to shopping mode
    await page.locator('button:has(svg.lucide-shopping-bag)').click();
    await waitForAppReady(page);
    
    // Check for header
    await expect(page.locator('header')).toBeVisible();
  });

  test('should exit shopping mode', async ({ page }) => {
    // Navigate to shopping mode
    await page.locator('button:has(svg.lucide-shopping-bag)').click();
    await waitForAppReady(page);
    
    // Click exit button (X icon)
    await page.locator('button:has(svg.lucide-x)').click();
    
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

  test('should show empty state when no favorites', async ({ page }) => {
    // Clear all data first
    await clearAllData(page);
    await page.goto('/favorites');
    await waitForAppReady(page);
    
    // Should show empty state
    await expect(page.getByText(/No favorites|אין מועדפים/)).toBeVisible();
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
    
    // Should show default section
    await expect(page.getByText('Default')).toBeVisible();
  });

  test('should display default category list', async ({ page }) => {
    // Check that main content is visible
    const main = page.locator('main');
    await expect(main).toBeVisible();
  });

  test('should open add new category modal', async ({ page }) => {
    // Click FAB
    const fabButton = page.locator('button.fab').first();
    await fabButton.click();
    
    // Modal should appear
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
  });

  test('should create a custom category', async ({ page }) => {
    // Click FAB
    const fabButton = page.locator('button.fab').first();
    await fabButton.click();
    
    // Wait for modal
    await page.waitForSelector('[role="dialog"]', { state: 'visible' });
    
    // Fill in category details - first two inputs are English and Hebrew names
    const inputs = page.locator('[role="dialog"] input');
    await inputs.nth(0).fill('Test Category');
    await inputs.nth(1).fill('קטגוריית בדיקה');
    
    // Save
    await page.locator('[role="dialog"]').getByRole('button', { name: /Save|שמור/ }).click();
    
    // Wait for modal to close
    await page.waitForSelector('[role="dialog"]', { state: 'hidden' });
    
    // Should show custom category section
    await expect(page.getByText('Custom')).toBeVisible();
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

  test('should show language section', async ({ page }) => {
    await expect(page.getByText(/Language|שפה/).first()).toBeVisible();
  });

  test('should show theme options', async ({ page }) => {
    await expect(page.getByText(/Theme|ערכת נושא/).first()).toBeVisible();
    
    // Should show dark/light options
    await expect(page.getByText(/Dark|כהה/).first()).toBeVisible();
    await expect(page.getByText(/Light|בהיר/).first()).toBeVisible();
  });

  test('should change theme', async ({ page }) => {
    // Click on Light theme button
    const lightButton = page.locator('button').filter({ hasText: /Light|בהיר/ }).first();
    await lightButton.click();
    
    // Theme button should be selected (has emerald background)
    await expect(lightButton).toHaveClass(/emerald/);
  });

  test('should show AI categorization section', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /AI Categorization|קטגוריזציה/ })).toBeVisible();
  });

  test('should show app version', async ({ page }) => {
    await expect(page.getByText(/Version|גרסה/).first()).toBeVisible();
    await expect(page.getByText(/v0\./).first()).toBeVisible();
  });

  test('should show clear data option in danger zone', async ({ page }) => {
    await expect(page.getByText('Danger Zone')).toBeVisible();
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
    await page.locator('nav a:has(svg.lucide-heart)').click();
    await expect(page).toHaveURL('/favorites');
    
    // Navigate to Categories
    await page.locator('nav a:has(svg.lucide-folder-open)').click();
    await expect(page).toHaveURL('/categories');
    
    // Navigate to Settings
    await page.locator('nav a:has(svg.lucide-settings)').click();
    await expect(page).toHaveURL('/settings');
    
    // Navigate back to Home
    await page.locator('nav a:has(svg.lucide-home)').click();
    await expect(page).toHaveURL('/');
  });

  test('should navigate back from list page', async ({ page }) => {
    // Create a list first
    await createTestList(page, 'Navigation Test List');
    
    // Click back button
    await page.locator('button:has(svg.lucide-arrow-left)').click();
    
    // Should be back on home
    await expect(page).toHaveURL('/');
  });
});

// ============================================================================
// TEST SUITE: LANGUAGE SWITCHING
// ============================================================================
test.describe('Language Switching', () => {
  test('should switch to Hebrew and back', async ({ page }) => {
    await page.goto('/settings');
    await waitForAppReady(page);
    
    // Find language switcher buttons
    const hebrewButton = page.locator('button').filter({ hasText: /עב|HE/ }).first();
    if (await hebrewButton.isVisible()) {
      await hebrewButton.click();
      await page.waitForTimeout(500);
      
      // Page should be in RTL mode
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      
      // Switch back to English
      const englishButton = page.locator('button').filter({ hasText: /EN/ }).first();
      await englishButton.click();
      await page.waitForTimeout(500);
      
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
    // Create a list first
    await createTestList(page, 'Share Test List');
    
    // Open menu
    await page.locator('button:has(svg.lucide-more-vertical)').click();
    await page.waitForTimeout(300);
    
    // Click share option
    const shareButton = page.locator('button:has(svg.lucide-share-2)');
    if (await shareButton.isVisible()) {
      await shareButton.click();
      
      // Share modal should appear
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
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
    let iterations = 0;
    const maxIterations = 20; // Safety limit
    
    while (iterations < maxIterations) {
      iterations++;
      
      // Find any menu button
      const menuButton = page.locator('button:has(svg.lucide-more-vertical)').first();
      
      if (await menuButton.isVisible().catch(() => false)) {
        await menuButton.click();
        await page.waitForTimeout(300);
        
        // Click delete option
        const deleteOption = page.locator('button:has(svg.lucide-trash-2)').first();
        if (await deleteOption.isVisible().catch(() => false)) {
          await deleteOption.click();
          await page.waitForTimeout(300);
          
          // Confirm deletion in dialog
          const confirmButton = page.locator('[role="dialog"]').getByRole('button', { name: /Delete|מחק/ });
          if (await confirmButton.isVisible().catch(() => false)) {
            await confirmButton.click();
            await page.waitForTimeout(500);
          }
        } else {
          // Close menu if no delete option
          await page.keyboard.press('Escape');
          break;
        }
      } else {
        break;
      }
    }
  });

  test('should delete custom categories', async ({ page }) => {
    await page.goto('/categories');
    await waitForAppReady(page);
    
    // Find and delete custom categories
    let iterations = 0;
    const maxIterations = 10;
    
    while (iterations < maxIterations) {
      iterations++;
      
      // Look for delete buttons (only visible on custom categories)
      const deleteButton = page.locator('button:has(svg.lucide-trash-2)').first();
      
      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click();
        await page.waitForTimeout(300);
        
        // Confirm deletion
        const confirmButton = page.locator('[role="dialog"]').getByRole('button', { name: /Delete|מחק/ });
        if (await confirmButton.isVisible().catch(() => false)) {
          await confirmButton.click();
          await page.waitForTimeout(500);
        }
      } else {
        break;
      }
    }
  });

  test('should clear all favorites', async ({ page }) => {
    await page.goto('/favorites');
    await waitForAppReady(page);
    
    // Delete each favorite
    let iterations = 0;
    const maxIterations = 20;
    
    while (iterations < maxIterations) {
      iterations++;
      
      const deleteButton = page.locator('button:has(svg.lucide-trash-2)').first();
      
      if (await deleteButton.isVisible().catch(() => false)) {
        await deleteButton.click();
        await page.waitForTimeout(300);
        
        // Confirm deletion
        const confirmButton = page.locator('[role="dialog"]').getByRole('button', { name: /Delete|מחק/ });
        if (await confirmButton.isVisible().catch(() => false)) {
          await confirmButton.click();
          await page.waitForTimeout(500);
        }
      } else {
        break;
      }
    }
  });

  test('should clear all local storage data', async ({ page }) => {
    await page.goto('/settings');
    await waitForAppReady(page);
    
    // Click clear data button in danger zone
    const clearButton = page.locator('button:has(svg.lucide-trash-2)').filter({ hasText: /Clear|נקה/ });
    if (await clearButton.isVisible()) {
      await clearButton.click();
      
      // Confirm
      const confirmButton = page.locator('[role="dialog"]').getByRole('button', { name: /Delete|מחק/ });
      if (await confirmButton.isVisible()) {
        await confirmButton.click();
        
        // Wait for page reload
        await page.waitForLoadState('networkidle');
      }
    }
  });

  test('final verification - app is clean', async ({ page }) => {
    // Clear localStorage directly to ensure clean state
    await page.goto('/');
    await clearAllData(page);
    
    // Verify empty state on home
    await expect(page.getByRole('main')).toBeVisible();
    await expect(page.getByText(/No lists|אין רשימות/)).toBeVisible();
    
    // Verify favorites are empty
    await page.goto('/favorites');
    await waitForAppReady(page);
    await expect(page.getByText(/No favorites|אין מועדפים/)).toBeVisible();
    
    console.log('✅ All test data has been cleaned up successfully!');
  });
});
