import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('landing page has correct roles', async ({ page }) => {
    await page.goto('/');
    
    // Check if the title is correct
    await expect(page).toHaveTitle(/ReMind AI/);

    // Check for role headings inside the cards
    await expect(page.getByRole('heading', { name: 'Patient Companion' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Caregiver Dashboard' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Family Portal' })).toBeVisible();
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');
    
    // Expect the login form to be visible
    await expect(page.getByText('Welcome Back')).toBeVisible();
    
    // Should have email and password inputs
    await expect(page.getByPlaceholder('you@example.com')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    
    // Check submit button
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
  });
});
