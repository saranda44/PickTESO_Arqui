import { test, expect } from '@playwright/test';

test.describe('Payment result – payment confirmation', () => {

  test('shows "Processing" while loading', async ({ page }) => {
    // Delay to capture loading state
    await page.route('**/payment/confirm**', async route => {
      await new Promise(r => setTimeout(r, 600));
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/payment/result?session_id=sess_test&order_id=99');
    await expect(page.locator('.state')).toContainText('Processing');
  });

  test('successful payment shows success message', async ({ page }) => {
    await page.route('**/payment/confirm**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );
    // Mock orders for redirect
    await page.route('**/catalog/orders', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [] }) })
    );

    await page.goto('/payment/result?session_id=sess_test&order_id=99');
    await expect(page.locator('.success')).toBeVisible();
    await expect(page.locator('.success')).toContainText('successful');
  });

  test('failed payment shows error message and back button', async ({ page }) => {
    await page.route('**/payment/confirm**', route =>
      route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Payment declined' }),
      })
    );

    await page.goto('/payment/result?session_id=sess_bad&order_id=99');
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toContainText('Payment failed');
    await expect(page.getByRole('button', { name: /cart/i })).toBeVisible();
  });

  test('missing params shows missing information error', async ({ page }) => {
    await page.goto('/payment/result');
    await expect(page.locator('.error')).toBeVisible();
    await expect(page.locator('.error')).toContainText('Missing payment information');
  });

  test('successful payment redirects to /orders after 2 s', async ({ page }) => {
    await page.route('**/payment/confirm**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );
    await page.route('**/catalog/orders', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [] }) })
    );

    await page.goto('/payment/result?session_id=sess_test&order_id=99');
    await expect(page.locator('.success')).toBeVisible();
    await expect(page).toHaveURL(/\/orders/, { timeout: 5000 });
  });
});