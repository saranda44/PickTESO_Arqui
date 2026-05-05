import { test, expect } from '@playwright/test';
import { seedAuth, mockMyOrders } from './helpers';

const twoOrders = {
  orders: [
    {
      id: '10', user_id: '1', store_id: '1', total: '200.00', status: 'paid',
      created_at: '2024-03-01T10:00:00Z', updated_at: '2024-03-01T10:00:00Z',
      products: [{ product_id: 1, name: 'Taco pastor', product_image: null, quantity: 2, unit_price: 100 }],
    },
    {
      id: '11', user_id: '1', store_id: '2', total: '150.00', status: 'pending',
      created_at: '2024-02-01T10:00:00Z', updated_at: '2024-02-01T10:00:00Z',
      products: [{ product_id: 2, name: 'Quesadilla', product_image: null, quantity: 3, unit_price: 50 }],
    },
  ],
};

test.describe('Orders – mis pedidos', () => {

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await page.route('**/catalog/orders', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(twoOrders) })
    );
  });

  test('renderiza 2 órdenes', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('.order-block')).toHaveCount(2, { timeout: 5000 });
  });

  test('muestra el id de cada orden en español', async ({ page }) => {
    await page.goto('/orders');
    // El HTML renderiza "Orden #10" (en español)
    await expect(page.getByText('Orden #10')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Orden #11')).toBeVisible();
  });

  test('muestra el total de cada orden', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('.order-total').first()).toContainText('200.00', { timeout: 5000 });
  });

  test('muestra los productos dentro de cada orden', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByText('Taco pastor')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Quesadilla')).toBeVisible();
  });

  test('estado vacío cuando no hay órdenes', async ({ page }) => {
    await page.route('**/catalog/orders', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [] }) })
    );
    await page.goto('/orders');
    await expect(page.locator('.empty-orders')).toBeVisible({ timeout: 5000 });
  });

  test('botones flotantes de navegación visibles', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('.floating-buttons')).toBeVisible({ timeout: 5000 });
  });
});