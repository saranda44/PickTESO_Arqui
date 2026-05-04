# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/cart.spec.ts >> Cart – shopping cart >> displays each product name
- Location: e2e/cart.spec.ts:38:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/cart", waiting until "load"

```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { seedAuth } from './helpers';
  3   | 
  4   | /** Injects items into the cart via localStorage before loading the page */
  5   | async function seedCart(page: any, items: any[], storeId = 1) {
  6   |   await page.addInitScript(
  7   |     ({ cartItems, sid }: { cartItems: any[]; sid: number }) => {
  8   |       localStorage.setItem('cart', JSON.stringify(cartItems));
  9   |       localStorage.setItem('cart_store_id', String(sid));
  10  |     },
  11  |     { cartItems: items, sid: storeId }
  12  |   );
  13  | }
  14  | 
  15  | const sampleItems = [
  16  |   { id: 1, name: 'Charred Citrus Salmon', price: 50, product_image: null, quantity: 2 },
  17  |   { id: 2, name: 'Midnight Mushroom Tart',     price: 40, product_image: null, quantity: 1 },
  18  | ];
  19  | 
  20  | test.describe('Cart – shopping cart', () => {
  21  | 
  22  |   test.beforeEach(async ({ page }) => {
  23  |     await seedAuth(page);
  24  |   });
  25  | 
  26  |   test('shows empty state when cart is empty', async ({ page }) => {
  27  |     await page.goto('/cart');
  28  |     await expect(page.locator('.empty-cart')).toBeVisible();
  29  |   });
  30  | 
  31  |   test('renders cart items', async ({ page }) => {
  32  |     await seedCart(page, sampleItems);
  33  |     await page.goto('/cart');
  34  |     const items = page.locator('.cart-item');
  35  |     await expect(items).toHaveCount(2);
  36  |   });
  37  | 
  38  |   test('displays each product name', async ({ page }) => {
  39  |     await seedCart(page, sampleItems);
> 40  |     await page.goto('/cart');
      |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  41  |     await expect(page.getByText('Charred Citrus Salmon')).toBeVisible();
  42  |     await expect(page.getByText('Midnight Mushroom Tart')).toBeVisible();
  43  |   });
  44  | 
  45  |   test('displays correct total', async ({ page }) => {
  46  |     await seedCart(page, sampleItems);
  47  |     await page.goto('/cart');
  48  |     // Total = 50*2 + 40*1 = 140
  49  |     await expect(page.locator('.checkout-btn')).toContainText('140');
  50  |   });
  51  | 
  52  |   test('+ button increments quantity', async ({ page }) => {
  53  |     await seedCart(page, [{ id: 1, name: 'Charred Citrus Salmon', price: 50, product_image: null, quantity: 1 }]);
  54  |     await page.goto('/cart');
  55  | 
  56  |     const qty = page.locator('.quantity').first();
  57  |     await expect(qty).toHaveText('1');
  58  | 
  59  |     await page.locator('.controls-pill button').nth(1).click(); // "+" button
  60  |     await expect(qty).toHaveText('2');
  61  |   });
  62  | 
  63  |   test('− button decrements quantity and removes item if it reaches 0', async ({ page }) => {
  64  |     await seedCart(page, [{ id: 1, name: 'Charred Citrus Salmon', price: 50, product_image: null, quantity: 1 }]);
  65  |     await page.goto('/cart');
  66  | 
  67  |     await page.locator('.controls-pill button').first().click(); // "−" button
  68  |     // Item should disappear and empty state should be shown
  69  |     await expect(page.locator('.empty-cart')).toBeVisible();
  70  |   });
  71  | 
  72  |   test('checkout button triggers POST to orders and redirects to Stripe', async ({ page }) => {
  73  |     await seedCart(page, sampleItems);
  74  | 
  75  |     // Mock create order
  76  |     await page.route('**/orders/user/stores/1/orders', route =>
  77  |       route.fulfill({
  78  |         status: 201,
  79  |         contentType: 'application/json',
  80  |         body: JSON.stringify({ order: { id: '99', total: '140.00' }, client_secret: 'cs_test' }),
  81  |       })
  82  |     );
  83  | 
  84  |     // Mock Stripe checkout (avoid real redirect)
  85  |     await page.route('**/payment/checkout', route =>
  86  |       route.fulfill({
  87  |         status: 200,
  88  |         contentType: 'application/json',
  89  |         body: JSON.stringify({ url: '/payment/result?session_id=sess_test&order_id=99' })
  90  |       })
  91  |     );
  92  | 
  93  |     await page.goto('/cart');
  94  |     const orderRequest = page.waitForRequest(
  95  |       req => req.url().includes('/orders/user/stores/') && req.method() === 'POST'
  96  |     );
  97  |     await page.locator('.checkout-btn').click();
  98  |     await orderRequest;
  99  |   });
  100 | 
  101 |   test('shows error message if order fails', async ({ page }) => {
  102 |     await seedCart(page, sampleItems);
  103 | 
  104 |     await page.route('**/orders/user/stores/1/orders', route =>
  105 |       route.fulfill({
  106 |         status: 400,
  107 |         contentType: 'application/json',
  108 |         body: JSON.stringify({ message: 'Insufficient stock' }),
  109 |       })
  110 |     );
  111 | 
  112 |     await page.goto('/cart');
  113 |     await page.locator('.checkout-btn').click();
  114 |     await expect(page.locator('.error-msg')).toBeVisible();
  115 |     await expect(page.locator('.error-msg')).toContainText('Insufficient stock');
  116 |   });
  117 | });
```