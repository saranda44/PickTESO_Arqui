import { test, expect } from '@playwright/test';
import { seedAuth } from './helpers';

const mockUser = {
  id: '1',
  email: 'ozzy@pickteso.com',
  role: 'customer',
  first_name: 'Ozzy',
  paternal_last_name: 'Osbourne',
  maternal_last_name: '',
  storeId: null,
};

test.describe('Profile – user profile', () => {

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await page.route('**/users/**', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      })
    );
  });

  test('displays user name', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('.user-name')).toContainText('Ozzy');
    await expect(page.locator('.user-name')).toContainText('Osbourne');
  });

  test('displays user email', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('.user-email')).toContainText('ozzy@pickteso.com');
  });

  test('displays avatar with user initial', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('.avatar')).toContainText('O');
  });

  test('logout button is visible', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('button.logout-btn')).toBeVisible();
  });

  test('logout redirects to /login and clears token', async ({ page }) => {
    await page.goto('/profile');
    await page.locator('button.logout-btn').click();
    await expect(page).toHaveURL(/\/login/);
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });

  test('shows loader while user info is loading', async ({ page }) => {
    await page.route('**/users/**', async route => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    await page.goto('/profile');
    await expect(page.locator('.loading')).toBeVisible();
    await expect(page.locator('.user-name')).toBeVisible();
  });
});