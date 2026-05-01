import { test, expect } from '@playwright/test';
import { seedAuth } from './helpers';

const mockProducts = [
  { id: 1, name: 'Zapatos', price: 300, product_image: null, tags: [], inventory: 5, active: true },
  { id: 2, name: 'Camiseta', price: 100, product_image: null, tags: [], inventory: 0, active: true },
];

test.describe('Products', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await page.route('**/products/store/**', route => route.fulfill({
      status: 200, contentType: 'application/json', body: JSON.stringify(mockProducts)
    }));
    await page.route('**/stores/**', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ id: 5, name: 'Mi Tienda', location: '', opening_time: '09:00', closing_time: '18:00', active: true, admin_id: 1, created_at: '', updated_at: '' })
    }));
    await page.route('**/tags/store/**', route => route.fulfill({
      status: 200, contentType: 'application/json', body: '[]'
    }));
    await page.route('**/tags', route => route.fulfill({
      status: 200, contentType: 'application/json', body: '[]'
    }));
    await page.route('**/inventory/product/**/stock', route => route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({ product_id: 1, stock: 5 })
    }));
  });

  test('product list renders on /home', async ({ page }) => {
    await page.goto('/home');
    const cards = page.getByTestId('product-card');
    await expect(cards).toHaveCount(2);
  });

  test('create product modal opens', async ({ page }) => {
    await page.goto('/home');
    const createBtn = page.getByTestId('create-product-btn');
    if (await createBtn.isVisible()) {
      await createBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  });

  test('delete product shows confirm and fires DELETE', async ({ page }) => {
    // Mock DELETE for specific product IDs (not matching /products/store/)
    await page.route(url => /\/products\/\d+$/.test(url), async route => {
      if (route.request().method() === 'DELETE') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
      } else {
        await route.continue();
      }
    });

    page.on('dialog', dialog => dialog.accept());
    await page.goto('/home');
    await expect(page.getByTestId('product-card')).toHaveCount(2);

    const deleteRequest = page.waitForRequest(req =>
      /\/products\/\d+$/.test(req.url()) && req.method() === 'DELETE'
    );
    await page.getByTestId('delete-product-btn').first().click();
    await deleteRequest;
  });
});
