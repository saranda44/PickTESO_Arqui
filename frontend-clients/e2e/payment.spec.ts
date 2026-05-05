import { test, expect } from '@playwright/test';

const fakeJwt =
  'eyJhbGciOiJIUzI1NiJ9.' +
  Buffer.from(JSON.stringify({ id: '1', role: 'customer', exp: 4102444800 })).toString('base64') +
  '.fake-sig';

async function seedPaymentAuth(page: any) {
  await page.addInitScript((token: string) => {
    localStorage.setItem('auth_token', token);
    localStorage.setItem('id', '1');
  }, fakeJwt);
}

test.describe('Payment result – confirmación de pago', () => {

  test('muestra "Processing" mientras carga', async ({ page }) => {
    await seedPaymentAuth(page);
    await page.route('**/payments/confirm-session', async route => {
      await new Promise(r => setTimeout(r, 600));
      await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
    });

    await page.goto('/payment/result?session_id=sess_test&order_id=99');
    await expect(page.locator('.state')).toContainText('Processing');
  });

  test('sin parámetros muestra error de información faltante', async ({ page }) => {
    await seedPaymentAuth(page);
    await page.goto('/payment/result');
    await expect(page.locator('.state.error')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.state.error')).toContainText('Missing payment information');
  });

  test('sin sesión válida muestra error', async ({ page }) => {
    await seedPaymentAuth(page);
    await page.goto('/payment/result');
    await expect(page.locator('.state.error')).toBeVisible({ timeout: 5000 });
  });

  test('pago exitoso redirige a /orders', async ({ page }) => {
    await seedPaymentAuth(page);
    await page.route('**/payments/confirm-session', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );
    await page.route('**/catalog/orders', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [] }) })
    );

    await page.goto('/payment/result?session_id=sess_test&order_id=99');
    await expect(page).toHaveURL(/\/orders/, { timeout: 8000 });
  });
});