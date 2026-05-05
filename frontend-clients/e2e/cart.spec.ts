import { test, expect } from '@playwright/test';
import { seedAuth } from './helpers';

async function seedCart(page: any, items: any[], storeId = 1) {
  await page.addInitScript(
    ({ cartItems, sid }: { cartItems: any[]; sid: number }) => {
      localStorage.setItem('cart', JSON.stringify(cartItems));
      localStorage.setItem('cart_store_id', String(sid));
    },
    { cartItems: items, sid: storeId }
  );
}

const sampleItems = [
  { id: 1, name: 'Taco al pastor', price: 50, product_image: null, quantity: 2 },
  { id: 2, name: 'Quesadilla',     price: 40, product_image: null, quantity: 1 },
];

test.describe('Cart – carrito de compras', () => {

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
  });

  test('muestra estado vacío cuando el carrito está vacío', async ({ page }) => {
    await page.goto('/cart');
    await expect(page.locator('.empty-cart')).toBeVisible({ timeout: 5000 });
  });

  test('renderiza los items del carrito', async ({ page }) => {
    await seedCart(page, sampleItems);
    await page.goto('/cart');
    await expect(page.locator('.cart-item')).toHaveCount(2, { timeout: 5000 });
  });

  test('muestra el nombre de cada producto', async ({ page }) => {
    await seedCart(page, sampleItems);
    await page.goto('/cart');
    await expect(page.getByText('Taco al pastor')).toBeVisible({ timeout: 5000 });
    await expect(page.getByText('Quesadilla')).toBeVisible();
  });

  test('muestra el total correcto', async ({ page }) => {
    await seedCart(page, sampleItems);
    await page.goto('/cart');
    // Total = 50*2 + 40*1 = 140
    await expect(page.locator('.checkout-btn')).toContainText('140', { timeout: 5000 });
  });

  test('botón + incrementa la cantidad', async ({ page }) => {
    await seedCart(page, [{ id: 1, name: 'Taco al pastor', price: 50, product_image: null, quantity: 1 }]);
    await page.goto('/cart');

    const qty = page.locator('.quantity').first();
    await expect(qty).toHaveText('1', { timeout: 5000 });

    await page.locator('.controls-pill button').nth(1).click();
    await expect(qty).toHaveText('2');
  });

  test('botón − elimina item cuando llega a 0', async ({ page }) => {
    await seedCart(page, [{ id: 1, name: 'Taco al pastor', price: 50, product_image: null, quantity: 1 }]);
    await page.goto('/cart');

    await page.locator('.controls-pill button').first().click();
    await expect(page.locator('.empty-cart')).toBeVisible({ timeout: 5000 });
  });

  test('botón de pago dispara POST a orders', async ({ page }) => {
    await seedCart(page, sampleItems);

    await page.route('https://mocking.so/api/orders/user/stores/1/orders', route =>
      route.fulfill({
        status: 201, contentType: 'application/json',
        body: JSON.stringify({ order: { id: '99', total: '140.00' }, client_secret: 'cs_test' }),
      })
    );
    await page.route('https://mocking.so/api/payments/checkout-session', route =>
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ url: 'http://localhost:4200/payment/result?session_id=sess_test&order_id=99' }),
      })
    );

    await page.goto('/cart');
    const orderRequest = page.waitForRequest(
      (req: any) => req.url().includes('/orders/user/stores/') && req.method() === 'POST'
    );
    await page.locator('.checkout-btn').click();
    await orderRequest;
  });

  test('muestra estado de carga al hacer checkout', async ({ page }) => {
    await seedCart(page, sampleItems);

    // Mock lento para capturar el estado "Procesando..."
    await page.route('https://mocking.so/api/orders/user/stores/1/orders', async route => {
      await new Promise(r => setTimeout(r, 1000));
      await route.fulfill({
        status: 201, contentType: 'application/json',
        body: JSON.stringify({ order: { id: '99', total: '140.00' } }),
      });
    });

    await page.goto('/cart');
    await page.locator('.checkout-btn').click();
    await expect(page.locator('.checkout-btn')).toContainText('Procesando...', { timeout: 3000 });
  });
});