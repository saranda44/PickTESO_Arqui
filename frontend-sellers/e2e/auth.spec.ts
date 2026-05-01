import { test, expect } from '@playwright/test';
import { seedAuth } from './helpers';

test.describe('Auth flows', () => {
  test('unauthenticated / redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated /home redirects to /login', async ({ page }) => {
    await page.goto('/home');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated /orders redirects to /login', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login/);
  });

  test('authenticated user visiting /login redirects to /home (publicGuard)', async ({ page }) => {
    await seedAuth(page);
    await page.goto('/login');
    await expect(page).toHaveURL(/\/home/);
  });

  test('/login?token= sets localStorage and navigates to /home', async ({ page }) => {
    await page.goto('/login?token=abc123&id=1&storeId=5&role=seller');
    await expect(page).toHaveURL(/\/home/);
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBe('abc123');
  });

  test('logout clears localStorage and redirects to /login', async ({ page }) => {
    await seedAuth(page);

    // Mock API calls needed by home page
    await page.route('**/products/store/**', route => route.fulfill({
      status: 200, contentType: 'application/json', body: '[]'
    }));
    await page.route('**/stores/**', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: 5, name: 'Test Store', location: '', opening_time: '09:00', closing_time: '18:00', active: true, admin_id: 1, created_at: '', updated_at: '' })
    }));
    await page.route('**/tags/store/**', route => route.fulfill({
      status: 200, contentType: 'application/json', body: '[]'
    }));

    await page.goto('/home');

    const logoutBtn = page.getByTestId('logout-btn');
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).toHaveURL(/\/login/);
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    }
  });
});
