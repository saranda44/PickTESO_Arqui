import { test, expect } from '@playwright/test';
import { seedAuth, mockMyOrders } from './helpers';

const twoOrders = {
  orders: [
    {
      id: '10',
      user_id: '1',
      store_id: '1',
      total: '200.00',
      status: 'paid',
      created_at: '2024-03-01T10:00:00Z',
      updated_at: '2024-03-01T10:00:00Z',
      products: [
        { product_id: 1, name: 'Charred Citrus Salmon', product_image: null, quantity: 2, unit_price: 100 },
      ],
    },
    {
      id: '11',
      user_id: '1',
      store_id: '2',
      total: '150.00',
      status: 'pending',
      created_at: '2024-02-01T10:00:00Z',
      updated_at: '2024-02-01T10:00:00Z',
      products: [
        { product_id: 2, name: 'Midnight Mushroom Tart', product_image: null, quantity: 3, unit_price: 50 },
      ],
    },
  ],
};

test.describe('Orders – my orders', () => {

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await page.route('**/catalog/orders', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(twoOrders),
      })
    );
  });

  test('renders 2 orders', async ({ page }) => {
    await page.goto('/orders');
    const blocks = page.locator('.order-block');
    await expect(blocks).toHaveCount(2);
  });

  test('displays order id and total for each order', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByText('Order #10')).toBeVisible();
    await expect(page.getByText('200.00')).toBeVisible();
  });

  test('displays products within each order', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByText('Charred Citrus Salmon')).toBeVisible();
    await expect(page.getByText('Midnight Mushroom Tart')).toBeVisible();
  });

  test('shows empty state when there are no orders', async ({ page }) => {
    await page.route('**/catalog/orders', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ orders: [] }),
      })
    );
    await page.goto('/orders');
    await expect(page.locator('.empty-orders')).toBeVisible();
  });

  test('floating navigation buttons are visible', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.locator('.floating-buttons')).toBeVisible();
  });
});