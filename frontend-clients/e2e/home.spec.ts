import { test, expect } from '@playwright/test';
import { seedAuth, mockStores, mockMyOrders } from './helpers';

const mockStoresData = [
  { id: 1, name: 'Marble & Finch', location: 'Building A', image: null },
  { id: 2, name: 'The Silver Apricot',    location: 'Building B', image: null },
];

test.describe('Home – store list', () => {

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await page.route('**/catalog/stores', route =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockStoresData),
      })
    );
    await mockMyOrders(page);
    await page.route('**/users/**', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );
  });

  test('renders stores on /home', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(2);
  });

  test('displays each store name', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Marble & Finch')).toBeVisible();
    await expect(page.getByText('The Silver Apricot')).toBeVisible();
  });

  test('clicking a store navigates to /store/:id', async ({ page }) => {
    await page.goto('/');
    await page.locator('.card').first().click();
    await expect(page).toHaveURL(/\/store\/\d+/);
  });

  test('shows empty state when there are no stores', async ({ page }) => {
    await page.route('**/catalog/stores', route =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
    );
    await page.goto('/');
    const cards = page.locator('.card');
    await expect(cards).toHaveCount(0);
  });

  test('floating navigation buttons are visible', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('.floating-buttons')).toBeVisible();
  });
});