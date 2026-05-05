import { Page } from '@playwright/test';

// JWT con exp en año 2099 para pasar el isAuthenticated() de Angular
const fakeJwt =
  'eyJhbGciOiJIUzI1NiJ9.' +
  btoa(JSON.stringify({ id: '1', role: 'customer', exp: 4102444800 })) +
  '.fake-sig';

export async function seedAuth(page: Page, overrides: Record<string, string> = {}) {
  await page.addInitScript(
    (data: Record<string, string>) => {
      Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
    },
    { auth_token: fakeJwt, id: '1', role: 'customer', ...overrides }
  );
}

export const mockUser = {
  id: '1', email: 'ana@pickteso.com', role: 'customer',
  first_name: 'Ana', paternal_last_name: 'García',
  maternal_last_name: 'López', storeId: null,
};

export async function mockUserRoute(page: Page) {
  await page.route('**/catalog/user', route =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockUser) })
  );
}

export async function mockMyOrders(page: Page) {
  await page.route('**/catalog/orders', route =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify({
        orders: [
          {
            id: '10', user_id: '1', store_id: '1', total: '200.00', status: 'paid',
            created_at: '2024-03-01T10:00:00Z', updated_at: '2024-03-01T10:00:00Z',
            products: [{ product_id: 1, name: 'Taco pastor', product_image: null, quantity: 2, unit_price: 100 }],
          },
          {
            id: '11', user_id: '1', store_id: '2', total: '150.00', status: 'pending',
            created_at: '2024-02-01T10:00:00Z', updated_at: '2024-02-01T10:00:00Z',
            products: [{ product_id: 2, name: 'Quesadilla', product_image: null, quantity: 3, unit_price: 50 }],
          },
        ],
      }),
    })
  );
}

export async function mockStores(page: Page) {
  await page.route('**/catalog/stores', route =>
    route.fulfill({
      status: 200, contentType: 'application/json',
      body: JSON.stringify([
        { id: 1, name: 'Tacos El Güero', location: 'Edificio A', image: null },
        { id: 2, name: 'Sushi Panda',    location: 'Edificio B', image: null },
      ]),
    })
  );
}