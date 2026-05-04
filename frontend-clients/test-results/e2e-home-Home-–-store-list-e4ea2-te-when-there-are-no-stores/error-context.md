# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/home.spec.ts >> Home – store list >> shows empty state when there are no stores
- Location: e2e/home.spec.ts:44:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { seedAuth, mockStores, mockMyOrders } from './helpers';
  3  | 
  4  | const mockStoresData = [
  5  |   { id: 1, name: 'Marble & Finch', location: 'Building A', image: null },
  6  |   { id: 2, name: 'The Silver Apricot',    location: 'Building B', image: null },
  7  | ];
  8  | 
  9  | test.describe('Home – store list', () => {
  10 | 
  11 |   test.beforeEach(async ({ page }) => {
  12 |     await seedAuth(page);
  13 |     await page.route('**/catalog/stores', route =>
  14 |       route.fulfill({
  15 |         status: 200,
  16 |         contentType: 'application/json',
  17 |         body: JSON.stringify(mockStoresData),
  18 |       })
  19 |     );
  20 |     await mockMyOrders(page);
  21 |     await page.route('**/users/**', route =>
  22 |       route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  23 |     );
  24 |   });
  25 | 
  26 |   test('renders stores on /home', async ({ page }) => {
  27 |     await page.goto('/');
  28 |     const cards = page.locator('.card');
  29 |     await expect(cards).toHaveCount(2);
  30 |   });
  31 | 
  32 |   test('displays each store name', async ({ page }) => {
  33 |     await page.goto('/');
  34 |     await expect(page.getByText('Marble & Finch')).toBeVisible();
  35 |     await expect(page.getByText('The Silver Apricot')).toBeVisible();
  36 |   });
  37 | 
  38 |   test('clicking a store navigates to /store/:id', async ({ page }) => {
  39 |     await page.goto('/');
  40 |     await page.locator('.card').first().click();
  41 |     await expect(page).toHaveURL(/\/store\/\d+/);
  42 |   });
  43 | 
  44 |   test('shows empty state when there are no stores', async ({ page }) => {
  45 |     await page.route('**/catalog/stores', route =>
  46 |       route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
  47 |     );
> 48 |     await page.goto('/');
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  49 |     const cards = page.locator('.card');
  50 |     await expect(cards).toHaveCount(0);
  51 |   });
  52 | 
  53 |   test('floating navigation buttons are visible', async ({ page }) => {
  54 |     await page.goto('/');
  55 |     await expect(page.locator('.floating-buttons')).toBeVisible();
  56 |   });
  57 | });
```