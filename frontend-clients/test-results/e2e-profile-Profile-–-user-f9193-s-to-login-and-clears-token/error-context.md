# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: e2e/profile.spec.ts >> Profile – user profile >> logout redirects to /login and clears token
- Location: e2e/profile.spec.ts:48:7

# Error details

```
Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
Call log:
  - navigating to "/profile", waiting until "load"

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { seedAuth } from './helpers';
  3  | 
  4  | const mockUser = {
  5  |   id: '1',
  6  |   email: 'ozzy@pickteso.com',
  7  |   role: 'customer',
  8  |   first_name: 'Ozzy',
  9  |   paternal_last_name: 'Osbourne',
  10 |   maternal_last_name: '',
  11 |   storeId: null,
  12 | };
  13 | 
  14 | test.describe('Profile – user profile', () => {
  15 | 
  16 |   test.beforeEach(async ({ page }) => {
  17 |     await seedAuth(page);
  18 |     await page.route('**/users/**', route =>
  19 |       route.fulfill({
  20 |         status: 200,
  21 |         contentType: 'application/json',
  22 |         body: JSON.stringify(mockUser),
  23 |       })
  24 |     );
  25 |   });
  26 | 
  27 |   test('displays user name', async ({ page }) => {
  28 |     await page.goto('/profile');
  29 |     await expect(page.locator('.user-name')).toContainText('Ozzy');
  30 |     await expect(page.locator('.user-name')).toContainText('Osbourne');
  31 |   });
  32 | 
  33 |   test('displays user email', async ({ page }) => {
  34 |     await page.goto('/profile');
  35 |     await expect(page.locator('.user-email')).toContainText('ozzy@pickteso.com');
  36 |   });
  37 | 
  38 |   test('displays avatar with user initial', async ({ page }) => {
  39 |     await page.goto('/profile');
  40 |     await expect(page.locator('.avatar')).toContainText('O');
  41 |   });
  42 | 
  43 |   test('logout button is visible', async ({ page }) => {
  44 |     await page.goto('/profile');
  45 |     await expect(page.locator('button.logout-btn')).toBeVisible();
  46 |   });
  47 | 
  48 |   test('logout redirects to /login and clears token', async ({ page }) => {
> 49 |     await page.goto('/profile');
     |                ^ Error: page.goto: Protocol error (Page.navigate): Cannot navigate to invalid URL
  50 |     await page.locator('button.logout-btn').click();
  51 |     await expect(page).toHaveURL(/\/login/);
  52 |     const token = await page.evaluate(() => localStorage.getItem('auth_token'));
  53 |     expect(token).toBeNull();
  54 |   });
  55 | 
  56 |   test('shows loader while user info is loading', async ({ page }) => {
  57 |     await page.route('**/users/**', async route => {
  58 |       await new Promise(r => setTimeout(r, 500));
  59 |       await route.fulfill({
  60 |         status: 200,
  61 |         contentType: 'application/json',
  62 |         body: JSON.stringify(mockUser),
  63 |       });
  64 |     });
  65 | 
  66 |     await page.goto('/profile');
  67 |     await expect(page.locator('.loading')).toBeVisible();
  68 |     await expect(page.locator('.user-name')).toBeVisible();
  69 |   });
  70 | });
```