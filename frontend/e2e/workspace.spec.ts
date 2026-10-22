import { expect, test } from '@playwright/test';

test('login gagal tetap menampilkan error tanpa mengosongkan form', async ({ page }) => {
  await page.route('**/api/auth/login', route => route.fulfill({ status: 401, json: { message: 'Email atau password salah' } }));
  await page.goto('/login');
  await page.getByLabel('Email', { exact: true }).fill('operator@example.com');
  await page.getByLabel('Password', { exact: true }).fill('incorrect-password');
  await page.getByRole('button', { name: 'Masuk', exact: true }).click();
  await expect(page.locator('form [role="alert"]')).toHaveText('Email atau password salah');
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('operator@example.com');
  await page.screenshot({ path: '/tmp/orderhub-login.png', fullPage: true });
});

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('access_token', 'ui-test-token'));
  await page.route('**/api/auth/me', route => route.fulfill({ json: { data: { name: 'Budi Santoso', email: 'operator@example.com' } } }));
});

test('produk: konfirmasi hapus bisa dibatalkan dan tabel tetap terlihat', async ({ page }) => {
  await page.route('**/api/products?*', route => route.fulfill({ json: { data: [{ id: '1', productCode: 'P0001', productName: 'Hydrococo 150ml', stock: 3, price: '12000', updatedAt: '2026-10-21' }], meta: { page: 1, per_page: 10, total: 1, total_pages: 1 } } }));
  await page.goto('/products');
  await page.getByRole('button', { name: 'Hapus Hydrococo 150ml' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('button', { name: 'Batal', exact: true }).click();
  await expect(page.getByRole('dialog')).not.toBeVisible();
  await expect(page.getByText('Hydrococo 150ml', { exact: true })).toBeVisible();
  await page.screenshot({ path: '/tmp/orderhub-products.png', fullPage: true });
});

test('mobile: navigasi berlabel dan form produk tidak melebar keluar layar', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('**/api/products?*', route => route.fulfill({ json: { data: [], meta: { page: 1, total_pages: 1, per_page: 10, total: 0 } } }));
  await page.goto('/products');
  await page.getByRole('button', { name: 'Buka navigasi' }).click();
  await expect(page.getByRole('dialog').getByRole('link', { name: 'Pelanggan', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Tutup panel' }).click();
  await page.getByRole('button', { name: 'Tambah produk', exact: true }).click();
  await expect(page.getByLabel('Nama produk')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/orderhub-mobile.png', fullPage: true });
});

test('dashboard: liens pesanan membuka detail dan grafik memiliki data', async ({ page }) => {
  const order = { id: '7', orderNumber: 'INV-20261022-0007', orderDate: '2026-10-22', totalAmount: '24000', customer: { customerName: 'Dewi Lestari', customerAddress: 'Bandung' }, items: [{ id: '1', quantity: 2, unitPrice: '12000', subtotal: '24000', product: { productName: 'Hydrococo 150ml', productCode: 'P0001' } }] };
  await page.route('**/api/dashboard/summary*', route => route.fulfill({ json: { data: { total_transactions: 42, total_sales: '3265000', best_selling_products: [{ product: { productCode: 'P0001', productName: 'Hydrococo 150ml' }, quantity_sold: 24, sales_contribution: 288000 }], low_stock_products: [{ id: '1', productCode: 'P0001', productName: 'Hydrococo 150ml', stock: 3 }], daily_trend: [2, 5, 3, 7, 4, 8, 6].map((orders, i) => ({ date: `2026-10-${16 + i}`, orders, sales: orders * 12000 })) } } }));
  await page.route('**/api/products?*', route => route.fulfill({ json: { data: [], meta: { total: 20 } } }));
  await page.route('**/api/customers?*', route => route.fulfill({ json: { data: [] } }));
  await page.route('**/api/orders?*', route => route.fulfill({ json: { data: [order], meta: { page: 1, total_pages: 1, per_page: 10, total: 1 } } }));
  await page.route('**/api/orders/7', route => route.fulfill({ json: { data: order } }));
  await page.goto('/dashboard');
  await expect(page.locator('.trend-column')).toHaveCount(7);
  await page.waitForTimeout(700);
  await page.screenshot({ path: '/tmp/orderhub-dashboard.png', fullPage: true });
  await page.getByRole('link', { name: order.orderNumber, exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: order.orderNumber })).toBeVisible();
  await page.waitForTimeout(400);
  await page.screenshot({ path: '/tmp/orderhub-order.png', fullPage: true });
  await page.getByRole('button', { name: 'Tutup', exact: true }).click();
  await page.locator('.sidebar-create').click();
  await expect(page.getByRole('dialog').getByRole('heading', { name: 'Buat pesanan', exact: true })).toBeVisible();
});
