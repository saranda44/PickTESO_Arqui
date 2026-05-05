import { test, expect } from '@playwright/test';
import { seedAuth, mockUserRoute, mockMyOrders, mockStores } from './helpers';

test.describe('Auth flows', () => {

  test('unauthenticated / redirige a /login', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated /cart redirige a /login', async ({ page }) => {
    await page.goto('/cart');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated /orders redirige a /login', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated /profile redirige a /login', async ({ page }) => {
    await page.goto('/profile');
    await expect(page).toHaveURL(/\/login/);
  });

  test('unauthenticated /store/1 redirige a /login', async ({ page }) => {
    await page.goto('/store/1');
    await expect(page).toHaveURL(/\/login/);
  });

  test('/login?token= guarda token y navega a /', async ({ page }) => {
    const fakeJwt =
      'eyJhbGciOiJIUzI1NiJ9.' +
      btoa(JSON.stringify({ id: '1', role: 'customer', exp: 4102444800 })) +
      '.fake-sig';

    await mockStores(page);
    await mockMyOrders(page);
    await mockUserRoute(page);

    await page.goto(`/login?token=${fakeJwt}&id=1&role=customer`);
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });

    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBe(fakeJwt);
  });

  test('usuario autenticado en /login redirige a /', async ({ page }) => {
    await seedAuth(page);
    await mockStores(page);
    await mockMyOrders(page);
    await mockUserRoute(page);

    await page.goto('/login');
    await expect(page).not.toHaveURL(/\/login/, { timeout: 5000 });
  });

  test('logout limpia localStorage y redirige a /login', async ({ page }) => {
    await seedAuth(page);
    await mockUserRoute(page);
    await mockMyOrders(page);
    await mockStores(page);

    await page.goto('/profile');
    // El botón usa clase CSS .logout-btn (sin "button.")
    await expect(page.locator('.logout-btn')).toBeVisible({ timeout: 5000 });
    await page.locator('.logout-btn').click();

    await expect(page).toHaveURL(/\/login/);
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });
});