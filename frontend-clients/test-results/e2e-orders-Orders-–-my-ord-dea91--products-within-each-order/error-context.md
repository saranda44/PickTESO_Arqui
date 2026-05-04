# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/orders.spec.ts >> Orders – my orders >> displays products within each order
- Location: e2e/orders.spec.ts:58:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/orders", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { seedAuth, mockMyOrders } from './helpers';
  3  | 
  4  | const twoOrders = {
  5  |   orders: [
  6  |     {
  7  |       id: '10',
  8  |       user_id: '1',
  9  |       store_id: '1',
  10 |       total: '200.00',
  11 |       status: 'paid',
  12 |       created_at: '2024-03-01T10:00:00Z',
  13 |       updated_at: '2024-03-01T10:00:00Z',
  14 |       products: [
  15 |         { product_id: 1, name: 'Charred Citrus Salmon', product_image: null, quantity: 2, unit_price: 100 },
  16 |       ],
  17 |     },
  18 |     {
  19 |       id: '11',
  20 |       user_id: '1',
  21 |       store_id: '2',
  22 |       total: '150.00',
  23 |       status: 'pending',
  24 |       created_at: '2024-02-01T10:00:00Z',
  25 |       updated_at: '2024-02-01T10:00:00Z',
  26 |       products: [
  27 |         { product_id: 2, name: 'Midnight Mushroom Tart', product_image: null, quantity: 3, unit_price: 50 },
  28 |       ],
  29 |     },
  30 |   ],
  31 | };
  32 | 
  33 | test.describe('Orders – my orders', () => {
  34 | 
  35 |   test.beforeEach(async ({ page }) => {
  36 |     await seedAuth(page);
  37 |     await page.route('**/catalog/orders', route =>
  38 |       route.fulfill({
  39 |         status: 200,
  40 |         contentType: 'application/json',
  41 |         body: JSON.stringify(twoOrders),
  42 |       })
  43 |     );
  44 |   });
  45 | 
  46 |   test('renders 2 orders', async ({ page }) => {
  47 |     await page.goto('/orders');
  48 |     const blocks = page.locator('.order-block');
  49 |     await expect(blocks).toHaveCount(2);
  50 |   });
  51 | 
  52 |   test('displays order id and total for each order', async ({ page }) => {
  53 |     await page.goto('/orders');
  54 |     await expect(page.getByText('Order #10')).toBeVisible();
  55 |     await expect(page.getByText('200.00')).toBeVisible();
  56 |   });
  57 | 
  58 |   test('displays products within each order', async ({ page }) => {
> 59 |     await page.goto('/orders');
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  60 |     await expect(page.getByText('Charred Citrus Salmon')).toBeVisible();
  61 |     await expect(page.getByText('Midnight Mushroom Tart')).toBeVisible();
  62 |   });
  63 | 
  64 |   test('shows empty state when there are no orders', async ({ page }) => {
  65 |     await page.route('**/catalog/orders', route =>
  66 |       route.fulfill({
  67 |         status: 200,
  68 |         contentType: 'application/json',
  69 |         body: JSON.stringify({ orders: [] }),
  70 |       })
  71 |     );
  72 |     await page.goto('/orders');
  73 |     await expect(page.locator('.empty-orders')).toBeVisible();
  74 |   });
  75 | 
  76 |   test('floating navigation buttons are visible', async ({ page }) => {
  77 |     await page.goto('/orders');
  78 |     await expect(page.locator('.floating-buttons')).toBeVisible();
  79 |   });
  80 | });
```