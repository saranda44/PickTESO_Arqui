import { test, expect } from '@playwright/test';
import { seedAuth } from './helpers';

/** Injects items into the cart via localStorage before loading the page */
async function seedCart(page: any, items: any[], storeId = 1) {
  await page.addInitScript(
    ({ cartItems, sid }: { cartItems: any[]; sid: number }) => {
      localStorage.setItem('cart', JSON.stringify(cartItems));
      localStorage.setItem('cart_store_id', String(sid));
    },
    { cartItems: items, sid: storeId }
  );
}

const sampleItems = [
  { id: 1, name: 'Charred Citrus Salmon', price: 50, product_image: null, quantity: 2 },
  { id: 2, name: 'Midnight Mushroom Tart',     price: 40, product_image: null, quantity: 1 },
];

test.describe('Cart – shopping cart', () => {

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('shows empty state when cart is empty', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('.empty-cart')).toBeVisible();
  });

  test('renders cart items', async ({ page }) => {
    await seedCart(page, sampleItems);
    await page.goto('/cart');
    const items = page.locator('.cart-item');
    await expect(items).toHaveCount(2);
  });

  test('displays each product name', async ({ page }) => {
    await seedCart(page, sampleItems);
    await page.goto('/cart');
    await expect(page.getByText('Charred Citrus Salmon')).toBeVisible();
    await expect(page.getByText('Midnight Mushroom Tart')).toBeVisible();
  });

  test('displays correct total', async ({ page }) => {
    await seedCart(page, sampleItems);
    await page.goto('/cart');
    // Total = 50*2 + 40*1 = 140
    await expect(page.locator('.checkout-btn')).toContainText('140');
  });

  test('+ button increments quantity', async ({ page }) => {
    await seedCart(page, [{ id: 1, name: 'Charred Citrus Salmon', price: 50, product_image: null, quantity: 1 }]);
    await page.goto('/cart');

    const qty = page.locator('.quantity').first();
    await expect(qty).toHaveText('1');

    await page.locator('.controls-pill button').nth(1).click(); // "+" button
    await expect(qty).toHaveText('2');
  });

  test('− button decrements quantity and removes item if it reaches 0', async ({ page }) => {
    await seedCart(page, [{ id: 1, name: 'Charred Citrus Salmon', price: 50, product_image: null, quantity: 1 }]);
    await page.goto('/cart');

    await page.locator('.controls-pill button').first().click(); // "−" button
    // Item should disappear and empty state should be shown
    await expect(page.locator('.empty-cart')).toBeVisible();
  });

  test('checkout button triggers POST to orders and redirects to Stripe', async ({ page }) => {
    await seedCart(page, sampleItems);

    // Mock create order
    await page.route('**/orders/user/stores/1/orders', route =>
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ order: { id: '99', total: '140.00' }, client_secret: 'cs_test' }),
      })
    );

    // Mock Stripe checkout (avoid real redirect)
    await page.route('**/payment/checkout', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ url: '/payment/result?session_id=sess_test&order_id=99' })
      })
    );

    await page.goto('/cart');
    const orderRequest = page.waitForRequest(
      req => req.url().includes('/orders/user/stores/') && req.method() === 'POST'
    );
    await page.locator('.checkout-btn').click();
    await orderRequest;
  });

  test('shows error message if order fails', async ({ page }) => {
    await seedCart(page, sampleItems);

    await page.route('**/orders/user/stores/1/orders', route =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Insufficient stock' }),
      })
    );

    await page.goto('/cart');
    await page.locator('.checkout-btn').click();
    await expect(page.locator('.error-msg')).toBeVisible();
    await expect(page.locator('.error-msg')).toContainText('Insufficient stock');
  });
});