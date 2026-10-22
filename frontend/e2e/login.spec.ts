import { expect, test } from '@playwright/test';

test('login page menampilkan form autentikasi', async ({ page }) => {
  await page.goto('/login');

  await expect(page).toHaveTitle(/Azatech|OrderHub/i);
  await expect(page.getByRole('heading', { name: /Masuk ke OrderHub/i })).toBeVisible();
  await expect(page.getByLabel('Email')).toHaveValue('admin@azatech.id');
  await expect(page.getByLabel('Password')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Masuk' })).toBeEnabled();
});
