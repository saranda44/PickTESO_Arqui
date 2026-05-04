# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/auth.spec.ts >> Auth flows >> unauthenticated /cart redirects to /login
- Location: e2e/auth.spec.ts:11:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/cart", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { seedAuth } from './helpers';
  3  | 
  4  | test.describe('Auth flows', () => {
  5  | 
  6  |   test('unauthenticated / redirects to /login', async ({ page }) => {
  7  |     await page.goto('/');
  8  |     await expect(page).toHaveURL(/\/login/);
  9  |   });
  10 | 
  11 |   test('unauthenticated /cart redirects to /login', async ({ page }) => {
> 12 |     await page.goto('/cart');
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  13 |     await expect(page).toHaveURL(/\/login/);
  14 |   });
  15 | 
  16 |   test('unauthenticated /orders redirects to /login', async ({ page }) => {
  17 |     await page.goto('/orders');
  18 |     await expect(page).toHaveURL(/\/login/);
  19 |   });
  20 | 
  21 |   test('unauthenticated /profile redirects to /login', async ({ page }) => {
  22 |     await page.goto('/profile');
  23 |     await expect(page).toHaveURL(/\/login/);
  24 |   });
  25 | 
  26 |   test('unauthenticated /store/1 redirects to /login', async ({ page }) => {
  27 |     await page.goto('/store/1');
  28 |     await expect(page).toHaveURL(/\/login/);
  29 |   });
  30 | 
  31 |   test('/login?token= saves token and navigates to /', async ({ page }) => {
  32 |     // Valid JWT with exp in the future
  33 |     const fakeJwt =
  34 |       'eyJhbGciOiJIUzI1NiJ9.' +
  35 |       btoa(JSON.stringify({ id: '1', role: 'customer', exp: 4102444800 })) +
  36 |       '.fake-sig';
  37 | 
  38 |     // Mock the calls that /home makes on load
  39 |     await page.route('**/catalog/stores', route =>
  40 |       route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  41 |     );
  42 |     await page.route('**/catalog/orders', route =>
  43 |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [] }) })
  44 |     );
  45 |     await page.route('**/users/**', route =>
  46 |       route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  47 |     );
  48 | 
  49 |     await page.goto(`/login?token=${fakeJwt}&id=1&role=customer`);
  50 |     await expect(page).toHaveURL(/^\//);
  51 | 
  52 |     const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  53 |     expect(token).toBe(fakeJwt);
  54 |   });
  55 | 
  56 |   test('authenticated user on /login redirects to /', async ({ page }) => {
  57 |     await seedAuth(page);
  58 |     await page.route('**/catalog/stores', route =>
  59 |       route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  60 |     );
  61 |     await page.route('**/catalog/orders', route =>
  62 |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [] }) })
  63 |     );
  64 |     await page.route('**/users/**', route =>
  65 |       route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  66 |     );
  67 | 
  68 |     await page.goto('/login');
  69 |     await expect(page).toHaveURL(/^\//);
  70 |   });
  71 | 
  72 |   test('logout clears localStorage and redirects to /login', async ({ page }) => {
  73 |     await seedAuth(page);
  74 |     await page.route('**/catalog/stores', route =>
  75 |       route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  76 |     );
  77 |     await page.route('**/catalog/orders', route =>
  78 |       route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [] }) })
  79 |     );
  80 |     await page.route('**/users/**', route =>
  81 |       route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  82 |     );
  83 | 
  84 |     await page.goto('/profile');
  85 | 
  86 |     const logoutBtn = page.locator('button.logout-btn');
  87 |     await expect(logoutBtn).toBeVisible();
  88 |     await logoutBtn.click();
  89 | 
  90 |     await expect(page).toHaveURL(/\/login/);
  91 |     const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  92 |     expect(token).toBeNull();
  93 |   });
  94 | });
```