'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, ArrowUpRight, Banknote, ClipboardList, Package, ShoppingBag, TriangleAlert } from 'lucide-react';
import { AppShell } from '../components/app-shell';
import { DashboardReveal } from '../components/motion/dashboard-reveal';
import { apiFetch, ApiResponse, formatDate, formatRupiah } from '../lib/api';

type Summary = {
  total_transactions: number;
  total_sales: string;
  best_selling_products: Array<{ product?: { productCode: string; productName: string }; quantity_sold: number; sales_contribution: number }>;
  low_stock_products: Array<{ id: string; productCode: string; productName: string; stock: number }>;
  daily_trend: Array<{ date: string; orders: number; sales: number }>;
};
type Order = { id: string; orderNumber: string; orderDate: string; totalAmount: string; customer: { customerName: string } };
const shortDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', timeZone: 'Asia/Jakarta' });

export default function DashboardPage() {
  const [summary, setSummary] = useState<Summary>();
  const [orders, setOrders] = useState<Order[]>([]);
  const [productCount, setProductCount] = useState<number>();
  const [error, setError] = useState('');
  useEffect(() => {
    Promise.all([
      apiFetch<{ data: Summary }>('/dashboard/summary'),
      apiFetch<ApiResponse<Order[]>>('/orders?per_page=5'),
      apiFetch<ApiResponse<unknown[]>>('/products?per_page=1'),
    ]).then(([summaryResult, orderResult, productResult]) => {
      setSummary(summaryResult.data);
      setOrders(orderResult.data);
      setProductCount(productResult.meta?.total ?? 0);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Ringkasan gagal dimuat'));
  }, []);

  const maxOrders = Math.max(1, ...(summary?.daily_trend.map((day) => day.orders) ?? []));
  const today = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date());

  return <AppShell><DashboardReveal>
    <header className="page-header dashboard-heading"><div><p className="eyebrow">Ikhtisar toko · {today}</p><h1>Ringkasan operasional</h1><p className="muted">Penjualan, pesanan, dan kondisi stok dalam satu tampilan.</p></div><Link className="btn" href="/orders"><ShoppingBag size={16} /> Lihat pesanan</Link></header>
    {error && <p className="error" role="alert">{error}</p>}
    <section className="dashboard-metrics" aria-label="Metrik utama">
      <article><span className="metric-heading"><ClipboardList size={17} /> Total pesanan</span><strong>{summary?.total_transactions ?? '—'}</strong><small>Transaksi tercatat</small></article>
      <article><span className="metric-heading"><Banknote size={17} /> Penjualan kotor</span><strong>{summary ? formatRupiah(summary.total_sales) : '—'}</strong><small>Dari seluruh pesanan</small></article>
      <article><span className="metric-heading"><Package size={17} /> Produk aktif</span><strong>{productCount ?? '—'}</strong><small>SKU dalam katalog</small></article>
      <article><span className="metric-heading"><TriangleAlert size={17} /> Perlu restock</span><strong>{summary?.low_stock_products.length ?? '—'}</strong><small>Stok di bawah 5 unit</small></article>
    </section>
    <section className="dashboard-grid dashboard-grid-prd">
      <article className="dashboard-panel trend-panel"><div className="panel-heading"><div><p className="section-kicker"><Activity size={15} /> Aktivitas 7 hari</p><h2>Pesanan harian</h2><p className="muted">Klik batang untuk melihat pesanan pada tanggal tersebut. Arahkan kursor untuk melihat omzet.</p></div><span className="subtle-badge">7 hari terakhir</span></div><div className="trend-chart" aria-label="Grafik jumlah pesanan harian">{summary?.daily_trend.map((day, index) => <Link className="trend-column" key={day.date} href={`/orders?from=${day.date}&to=${day.date}`} title={`${day.orders} ${day.orders === 1 ? 'pesanan' : 'pesanan'} · ${formatRupiah(day.sales)}`} aria-label={`Lihat ${day.orders} pesanan tanggal ${shortDate.format(new Date(day.date))}`}><span className="trend-value">{day.orders}</span><div className="bar-track"><span className={index === 6 ? 'bar-fill current' : 'bar-fill'} style={{ height: `${day.orders === 0 ? 0 : day.orders / maxOrders * 100}%` }} /></div><small>{shortDate.format(new Date(day.date))}</small></Link>)}{!summary && <div className="chart-loading">Memuat tren…</div>}</div></article>
      <article className="dashboard-panel top-products-panel"><div className="panel-heading"><div><p className="section-kicker">Katalog</p><h2>Produk terlaris</h2></div><Link className="panel-link" href="/products">Lihat produk <ArrowUpRight size={15} /></Link></div>{summary?.best_selling_products.length ? <div className="top-products-list">{summary.best_selling_products.map((item, index) => <div className="top-product-row" key={item.product?.productCode ?? index}><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><span className="product-info"><strong>{item.product?.productName ?? 'Produk tidak tersedia'}</strong><small>{item.product?.productCode ?? '—'}</small></span><span className="product-quantity">{item.quantity_sold} terjual</span><strong className="product-sales">{formatRupiah(item.sales_contribution)}</strong></div>)}</div> : <p className="table-message">Belum ada data penjualan produk.</p>}</article>
      <article className="dashboard-panel stock-panel"><div className="panel-heading"><div><p className="section-kicker">Inventaris</p><h2>Stok perlu perhatian</h2></div><span className="subtle-badge">{summary?.low_stock_products.length ?? 0} produk</span></div>{summary?.low_stock_products.length ? <div className="stock-rows">{summary.low_stock_products.slice(0, 5).map((product) => <div className="stock-row" key={product.id}><span className="product-info"><strong>{product.productName}</strong><small>{product.productCode}</small></span><span className={`status-chip ${product.stock === 0 ? 'status-danger' : 'status-warning'}`}>{product.stock === 0 ? 'Habis' : `${product.stock} tersisa`}</span></div>)}</div> : <p className="table-message">Stok seluruh produk masih aman.</p>}<Link className="panel-footer-link" href="/products">Kelola stok <ArrowUpRight size={15} /></Link></article>
      <article className="dashboard-panel recent-panel"><div className="panel-heading"><div><p className="section-kicker">Transaksi terbaru</p><h2>Pesanan masuk</h2></div><Link className="panel-link" href="/orders">Lihat semua <ArrowUpRight size={15} /></Link></div><div className="table-wrap"><table className="workspace-table"><thead><tr><th>Nomor pesanan</th><th>Pelanggan</th><th>Tanggal</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><Link className="table-link mono" href="/orders">{order.orderNumber}</Link></td><td>{order.customer.customerName}</td><td className="subdued">{formatDate(order.orderDate)}</td><td className="numeric">{formatRupiah(order.totalAmount)}</td><td><span className="status-chip status-success">Selesai</span></td></tr>)}</tbody></table>{!orders.length && <p className="table-message">Belum ada pesanan terbaru.</p>}</div></article>
    </section>
  </DashboardReveal></AppShell>;
}
