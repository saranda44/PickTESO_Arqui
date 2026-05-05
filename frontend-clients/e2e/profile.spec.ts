import { test, expect } from '@playwright/test';
import { seedAuth, mockUser, mockUserRoute, mockMyOrders } from './helpers';

test.describe('Profile – perfil de usuario', () => {

  test.beforeEach(async ({ page }) => {
    await seedAuth(page);
    await mockUserRoute(page);
    await mockMyOrders(page);
  });

  test('muestra el nombre del usuario', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('.user-name')).toContainText('Ana', { timeout: 5000 });
    await expect(page.locator('.user-name')).toContainText('García');
  });

  test('muestra el email del usuario', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('.user-email')).toContainText('ana@pickteso.com', { timeout: 5000 });
  });

  test('muestra el avatar con la inicial del nombre', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('.avatar')).toContainText('A', { timeout: 5000 });
  });

  test('botón de cerrar sesión es visible', async ({ page }) => {
    await page.goto('/profile');
    // El HTML usa class="logout-btn" (sin etiqueta button en el selector)
    await expect(page.locator('.logout-btn')).toBeVisible({ timeout: 5000 });
  });

  test('cerrar sesión redirige a /login y limpia token', async ({ page }) => {
    await page.goto('/profile');
    await expect(page.locator('.logout-btn')).toBeVisible({ timeout: 5000 });
    await page.locator('.logout-btn').click();
    await expect(page).toHaveURL(/\/login/);
    const token = await page.evaluate(() => localStorage.getItem('auth_token'));
    expect(token).toBeNull();
  });

  test('muestra loader mientras carga la info del usuario', async ({ page }) => {
    // Reemplazar el mock con uno lento
    await page.route('**/catalog/user', async route => {
      await new Promise(r => setTimeout(r, 600));
      await route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(mockUser),
      });
    });

    await page.goto('/profile');
    await expect(page.locator('.loading')).toBeVisible();
    // Después de cargar desaparece y muestra el nombre
    await expect(page.locator('.user-name')).toBeVisible({ timeout: 5000 });
  });
});