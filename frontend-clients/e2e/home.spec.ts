import { test, expect } from '@playwright/test';
import { seedAuth, mockStores, mockMyOrders } from './helpers';

test.describe('Home – lista de tiendas', () => {

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockStores(page);
    await mockMyOrders(page);
    await page.route('**/catalog/user', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );
  });

  test('renderiza las tiendas en /', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.card')).toHaveCount(2, { timeout: 5000 });
  });

  test('muestra el nombre de cada tienda', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Tacos El Güero')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Sushi Panda')).toBeVisible();
  });

  test('hacer clic en una tienda navega a /store/:id', async ({ page }) => {
    await page.route('**/catalog/stores/1**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ id: 1, name: 'Tacos El Güero' }) })
    );
    await page.route('**/catalog/stores/1/products', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/');
    await page.locator('.card').first().click();
    await expect(page).toHaveURL(/\/store\/\d+/, { timeout: 5000 });
  });

  test('muestra estado vacío cuando no hay tiendas', async ({ page }) => {
    await page.route('**/catalog/stores', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/');
    await expect(page.locator('.card')).toHaveCount(0);
  });

  test('botones flotantes de navegación son visibles', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.floating-buttons')).toBeVisible({ timeout: 5000 });
  });
});