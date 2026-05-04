import { test, expect } from '@playwright/test';
import { seedAuth } from './helpers';

test.describe('Auth flows', () => {

  test('unauthenticated / redirects to /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated /cart redirects to /login', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated /orders redirects to /login', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated /profile redirects to /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated /store/1 redirects to /login', async ({ page }) => {
    await page.goto('/store/1');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/login?token= saves token and navigates to /', async ({ page }) => {
    // Valid JWT with exp in the future
    const fakeJwt =
      'eyJhbGciOiJIUzI1NiJ9.' +
      btoa(JSON.stringify({ id: '1', role: 'customer', exp: 4102444800 })) +
      '.fake-sig';

    // Mock the calls that /home makes on load
    await page.route('**/catalog/stores', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route('**/catalog/orders', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [] }) })
    );
    await page.route('**/users/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );

    await page.goto(`/login?token=${fakeJwt}&id=1&role=customer`);
    await expect(page).toHaveURL(/^\//);

    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBe(fakeJwt);
  });

  test('authenticated user on /login redirects to /', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/catalog/stores', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route('**/catalog/orders', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [] }) })
    );
    await page.route('**/users/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );

    await page.goto('/login');
    await expect(page).toHaveURL(/^\//);
  });

  test('logout clears localStorage and redirects to /login', async ({ page }) => {
    await seedAuth(page);
    await page.route('**/catalog/stores', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.route('**/catalog/orders', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [] }) })
    );
    await page.route('**/users/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );

    await page.goto('/profile');

    const logoutBtn = page.locator('button.logout-btn');
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    await expect(page).toHaveURL(/\/login/);
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });
});