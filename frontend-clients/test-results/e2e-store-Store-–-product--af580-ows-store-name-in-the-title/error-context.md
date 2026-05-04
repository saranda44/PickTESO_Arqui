# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/store.spec.ts >> Store – product catalog >> shows store name in the title
- Location: e2e/store.spec.ts:48:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/store/1", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { seedAuth, mockMyOrders } from './helpers';
  3  | 
  4  | const mockProducts = [
  5  |   { id: 1, name: 'Charred Citrus Salmon', description: 'Delicious', price: 50,  product_image: null, tags: [] },
  6  |   { id: 2, name: 'Midnight Mushroom Tart', description: 'Earthy, crisp, quietly rich',  price: 40,  product_image: null, tags: [] },
  7  |   { id: 3, name: 'Vanilla Bean Panna Cotta', description: null, price: 25,  product_image: null, tags: [] },
  8  | ];
  9  | 
  10 | test.describe('Store – product catalog', () => {
  11 | 
  12 |   test.beforeEach(async ({ page }) => {
  13 |     await seedAuth(page);
  14 | 
  15 |     // Store info
  16 |     await page.route('**/catalog/stores/1', route =>
  17 |       route.fulfill({
  18 |         status: 200,
  19 |         contentType: 'application/json',
  20 |         body: JSON.stringify({ id: 1, name: 'Marble & Finch', location: 'Building A' }),
  21 |       })
  22 |     );
  23 | 
  24 |     // Store products
  25 |     await page.route('**/catalog/stores/1/products', route =>
  26 |       route.fulfill({   
  27 |         status: 200,
  28 |         contentType: 'application/json',
  29 |         body: JSON.stringify(mockProducts),
  30 |       })
  31 |     );
  32 | 
  33 |     await mockMyOrders(page);
  34 |   });
  35 | 
  36 |   test('renders store products', async ({ page }) => {
  37 |     await page.goto('/store/1');
  38 |     const cards = page.locator('.product-card');
  39 |     await expect(cards).toHaveCount(3);
  40 |   });
  41 | 
  42 |   test('displays product name and price', async ({ page }) => {
  43 |     await page.goto('/store/1');
  44 |     await expect(page.getByText('Charred Citrus Salmon')).toBeVisible();
  45 |     await expect(page.getByText('$50')).toBeVisible();
  46 |   });
  47 | 
  48 |   test('shows store name in the title', async ({ page }) => {
> 49 |     await page.goto('/store/1');
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  50 |     await expect(page.locator('.store-title')).toContainText('Marble & Finch');
  51 |   });
  52 | 
  53 |   test('adding a product increments cart badge', async ({ page }) => {
  54 |     await page.goto('/store/1');
  55 |     await page.locator('.add-btn').first().click();
  56 |     const badge = page.locator('.fab.cart .badge');
  57 |     await expect(badge).toBeVisible();
  58 |     await expect(badge).toHaveText('1');
  59 |   });
  60 | 
  61 |   test('adding products from another store shows alert', async ({ page }) => {
  62 |     // Simulate cart already containing a product from store 2
  63 |     await page.addInitScript(() => {
  64 |       localStorage.setItem('cart', JSON.stringify([
  65 |         { id: 99, name: 'Other product', price: 100, quantity: 1 }
  66 |       ]));
  67 |       localStorage.setItem('cart_store_id', '2');
  68 |     });
  69 | 
  70 |     await page.goto('/store/1');
  71 |     await page.locator('.add-btn').first().click();
  72 |     await expect(page.locator('.store-alert')).toBeVisible();
  73 |   });
  74 | 
  75 |   test('empty state when store has no products', async ({ page }) => {
  76 |     await page.route('**/catalog/stores/1/products', route =>
  77 |       route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  78 |     );
  79 |     await page.goto('/store/1');
  80 |     const cards = page.locator('.product-card');
  81 |     await expect(cards).toHaveCount(0);
  82 |   });
  83 | });
```