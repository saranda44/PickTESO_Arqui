import { Page } from '@playwright/test';

export async function seedAuth(page: Page, overrides: Record<string, string> = {}) {
  await page.addInitScript((data: Record<string, string>) => {
    Object.entries(data).forEach(([k, v]) => localStorage.setItem(k, v));
  }, { token: 'test-jwt-token', userId: '1', store_id: '5', role: 'seller', ...overrides });
}
