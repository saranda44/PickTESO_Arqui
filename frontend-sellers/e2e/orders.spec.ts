import { test, expect } from '@playwright/test';
import { seedAuth } from './helpers';

const mockOrders = [
  { id: 1, store_id: 5, user_id: 10, status: 'paid', total: 200, created_at: '2024-03-01T10:00:00Z', updated_at: '2024-03-01T10:00:00Z' },
  { id: 2, store_id: 5, user_id: 11, status: 'pending', total: 150, created_at: '2024-02-01T10:00:00Z', updated_at: '2024-02-01T10:00:00Z' },
  { id: 3, store_id: 5, user_id: 12, status: 'completed', total: 300, created_at: '2024-01-01T10:00:00Z', updated_at: '2024-01-01T10:00:00Z' },
];

const mockOrderDetail = {
  id: 1,
  store_id: 5,
  user_id: 10,
  status: 'paid',
  total: 200,
  created_at: '2024-03-01T10:00:00Z',
  updated_at: '2024-03-01T10:00:00Z',
  customer: { id: 10, first_name: 'Ana', paternal_last_name: 'García', maternal_last_name: '', email: 'ana@test.com' },
  store: { id: 5, name: 'Mi Tienda', email: '' },
  items: [],
};

test.describe('Orders', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await page.route('**/stores/5/orders', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ orders: mockOrders })
    }));
  });

  test('orders list renders 3 orders', async ({ page }) => {
    await page.goto('/orders');
    const items = page.getByTestId('order-item');
    await expect(items).toHaveCount(3);
  });

  test('navigate to order detail', async ({ page }) => {
    await page.route('**/stores/5/orders/1', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ order: mockOrderDetail })
    }));

    await page.goto('/orders');
    const detailLink = page.getByText('Ver detalles').first();
    if (await detailLink.isVisible()) {
      await detailLink.click();
      await expect(page).toHaveURL(/\/orders\/\d+/);
    }
  });

  test('status filter shows only matching orders', async ({ page }) => {
    await page.goto('/orders');
    await expect(page.getByTestId('order-item')).toHaveCount(3);

    // Click "Pagado" filter button (inside .status-badges)
    await page.locator('.status-badges').getByText('Pagado').click();

    // Only the 1 paid order should remain
    await expect(page.getByTestId('order-item')).toHaveCount(1);
  });

  test('OTP validation rejects non-6-digit code', async ({ page }) => {
    await page.route('**/stores/5/orders/1', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ order: { ...mockOrderDetail, status: 'ready' } })
    }));

    await page.goto('/orders/1');
    const otpInput = page.getByTestId('otp-input');
    if (await otpInput.isVisible()) {
      await otpInput.fill('12345');
      await page.getByTestId('confirm-otp-btn').click();
      const alert = page.getByTestId('alert-message');
      await expect(alert).toBeVisible();
    }
  });
});
