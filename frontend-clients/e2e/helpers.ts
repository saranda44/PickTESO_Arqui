import { Page } from '@playwright/test';

/**
 * Injects a fake JWT into localStorage to simulate an authenticated user.
 * The token has an exp in the future to pass isAuthenticated() validation.
 */
export async function seedAuth(page: Page, overrides: Record<string, string> = {}) {
  // JWT with payload { exp: year 2099 } encoded in base64
  const fakeJwt =
    'eyJhbGciOiJIUzI1NiJ9.' +
    btoa(JSON.stringify({ id: '1', role: 'customer', exp: 4102444800 })) +
    '.fake-sig';

  await page.addInitScript(
    (data: Record<string, string>) => {
      Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
    },
    {
      auth_token: fakeJwt,
      id: '1',
      role: 'customer',
      ...overrides,
    }
  );
}

/** Standard mock: store list */
export async function mockStores(page: Page) {
  await page.route('**/catalog/stores', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'Marble & Finch', location: 'Building A', image: null },
        { id: 2, name: 'The Silver Apricot',    location: 'Building B', image: null },
      ]),
    })
  );
}

/** Standard mock: my orders */
export async function mockMyOrders(page: Page) {
  await page.route('**/catalog/orders', route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        orders: [
          {
            id: '10',
            user_id: '1',
            store_id: '1',
            total: '200.00',
            status: 'paid',
            created_at: '2024-03-01T10:00:00Z',
            updated_at: '2024-03-01T10:00:00Z',
            products: [
              { product_id: 1, name: 'Charred Citrus Salmon', product_image: null, quantity: 2, unit_price: 100 },
            ],
          },
          {
            id: '11',
            user_id: '1',
            store_id: '2',
            total: '150.00',
            status: 'pending',
            created_at: '2024-02-01T10:00:00Z',
            updated_at: '2024-02-01T10:00:00Z',
            products: [],
          },
        ],
      }),
    })
  );
}