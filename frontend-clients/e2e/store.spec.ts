import { test, expect } from '@playwright/test';
import { seedAuth, mockMyOrders } from './helpers';

const mockProducts = [
  { id: 1, name: 'Taco al pastor', description: 'Delicioso', price: 50, product_image: null, tags: [] },
  { id: 2, name: 'Quesadilla',     description: 'Con queso',  price: 40, product_image: null, tags: [] },
  { id: 3, name: 'Agua de horchata', description: null,       price: 25, product_image: null, tags: [] },
];

test.describe('Store – catálogo de productos', () => {

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockMyOrders(page);

    await page.route('**/catalog/stores/1', route =>
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ id: 1, name: 'Tacos El Güero', location: 'Edificio A' }),
      })
    );
    await page.route('**/catalog/stores/1/products', route =>
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(mockProducts),
      })
    );
  });

  test('renderiza los productos de la tienda', async ({ page }) => {
    await page.goto('/store/1');
    await expect(page.locator('.product-card')).toHaveCount(3, { timeout: 5000 });
  });

  test('muestra el nombre y precio de cada producto', async ({ page }) => {
    await page.goto('/store/1');
    await expect(page.getByText('Taco al pastor')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('$50')).toBeVisible();
  });

  test('muestra el nombre de la tienda en el título', async ({ page }) => {
    await page.goto('/store/1');
    await expect(page.locator('.store-title')).toContainText('Tacos El Güero', { timeout: 5000 });
  });

  test('añadir producto incrementa el badge del carrito', async ({ page }) => {
    await page.goto('/store/1');
    await page.locator('.add-btn').first().click();
    await expect(page.locator('.fab.cart .badge')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.fab.cart .badge')).toHaveText('1');
  });

  test('añadir productos de otra tienda muestra alerta', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('cart', JSON.stringify([
        { id: 99, name: 'Otro producto', price: 100, quantity: 1 }
      ]));
      localStorage.setItem('cart_store_id', '2');
    });

    await page.goto('/store/1');
    await page.locator('.add-btn').first().click();
    await expect(page.locator('.store-alert')).toBeVisible({ timeout: 5000 });
  });

  test('estado vacío cuando la tienda no tiene productos', async ({ page }) => {
    await page.route('**/catalog/stores/1/products', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/store/1');
    await expect(page.locator('.product-card')).toHaveCount(0);
  });
});