import { test, expect } from '@playwright/test';
import { seedAuth, mockMyOrders } from './helpers';

const mockProducts = [
  { id: 1, name: 'Charred Citrus Salmon', description: 'Delicious', price: 50,  product_image: null, tags: [] },
  { id: 2, name: 'Midnight Mushroom Tart', description: 'Earthy, crisp, quietly rich',  price: 40,  product_image: null, tags: [] },
  { id: 3, name: 'Vanilla Bean Panna Cotta', description: null, price: 25,  product_image: null, tags: [] },
];

test.describe('Store – product catalog', () => {

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);

    // Store info
    await page.route('**/catalog/stores/1', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ id: 1, name: 'Marble & Finch', location: 'Building A' }),
      })
    );

    // Store products
    await page.route('**/catalog/stores/1/products', route =>
      route.fulfill({   
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockProducts),
      })
    );

    await mockMyOrders(page);
  });

  test('renders store products', async ({ page }) => {
    await page.goto('/store/1');
    const cards = page.locator('.product-card');
    await expect(cards).toHaveCount(3);
  });

  test('displays product name and price', async ({ page }) => {
    await page.goto('/store/1');
    await expect(page.getByText('Charred Citrus Salmon')).toBeVisible();
    await expect(page.getByText('$50')).toBeVisible();
  });

  test('shows store name in the title', async ({ page }) => {
    await page.goto('/store/1');
    await expect(page.locator('.store-title')).toContainText('Marble & Finch');
  });

  test('adding a product increments cart badge', async ({ page }) => {
    await page.goto('/store/1');
    await page.locator('.add-btn').first().click();
    const badge = page.locator('.fab.cart .badge');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText('1');
  });

  test('adding products from another store shows alert', async ({ page }) => {
    // Simulate cart already containing a product from store 2
    await page.addInitScript(() => {
      localStorage.setItem('cart', JSON.stringify([
        { id: 99, name: 'Other product', price: 100, quantity: 1 }
      ]));
      localStorage.setItem('cart_store_id', '2');
    });

    await page.goto('/store/1');
    await page.locator('.add-btn').first().click();
    await expect(page.locator('.store-alert')).toBeVisible();
  });

  test('empty state when store has no products', async ({ page }) => {
    await page.route('**/catalog/stores/1/products', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/store/1');
    const cards = page.locator('.product-card');
    await expect(cards).toHaveCount(0);
  });
});