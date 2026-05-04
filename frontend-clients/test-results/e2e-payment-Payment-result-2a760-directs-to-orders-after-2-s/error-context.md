# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/payment.spec.ts >> Payment result – payment confirmation >> successful payment redirects to /orders after 2 s
- Location: e2e/payment.spec.ts:51:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/payment/result?session_id=sess_test&order_id=99", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Payment result – payment confirmation', () => {
  4  | 
  5  |   test('shows "Processing" while loading', async ({ page }) => {
  6  |     // Delay to capture loading state
  7  |     await page.route('**/payment/confirm**', async route => {
  8  |       await new Promise(r => setTimeout(r, 600));
  9  |       await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  10 |     });
  11 | 
  12 |     await page.goto('/payment/result?session_id=sess_test&order_id=99');
  13 |     await expect(page.locator('.state')).toContainText('Processing');
  14 |   });
  15 | 
  16 |   test('successful payment shows success message', async ({ page }) => {
  17 |     await page.route('**/payment/confirm**', route =>
  18 |       route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  19 |     );
  20 |     // Mock orders for redirect
  21 |     await page.route('**/catalog/orders', route =>
  22 |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [] }) })
  23 |     );
  24 | 
  25 |     await page.goto('/payment/result?session_id=sess_test&order_id=99');
  26 |     await expect(page.locator('.success')).toBeVisible();
  27 |     await expect(page.locator('.success')).toContainText('successful');
  28 |   });
  29 | 
  30 |   test('failed payment shows error message and back button', async ({ page }) => {
  31 |     await page.route('**/payment/confirm**', route =>
  32 |       route.fulfill({
  33 |         status: 400,
  34 |         contentType: 'application/json',
  35 |         body: JSON.stringify({ error: 'Payment declined' }),
  36 |       })
  37 |     );
  38 | 
  39 |     await page.goto('/payment/result?session_id=sess_bad&order_id=99');
  40 |     await expect(page.locator('.error')).toBeVisible();
  41 |     await expect(page.locator('.error')).toContainText('Payment failed');
  42 |     await expect(page.getByRole('button', { name: /cart/i })).toBeVisible();
  43 |   });
  44 | 
  45 |   test('missing params shows missing information error', async ({ page }) => {
  46 |     await page.goto('/payment/result');
  47 |     await expect(page.locator('.error')).toBeVisible();
  48 |     await expect(page.locator('.error')).toContainText('Missing payment information');
  49 |   });
  50 | 
  51 |   test('successful payment redirects to /orders after 2 s', async ({ page }) => {
  52 |     await page.route('**/payment/confirm**', route =>
  53 |       route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  54 |     );
  55 |     await page.route('**/catalog/orders', route =>
  56 |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [] }) })
  57 |     );
  58 | 
> 59 |     await page.goto('/payment/result?session_id=sess_test&order_id=99');
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  60 |     await expect(page.locator('.success')).toBeVisible();
  61 |     await expect(page).toHaveURL(/\/orders/, { timeout: 5000 });
  62 |   });
  63 | });
```