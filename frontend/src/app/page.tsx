'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Activity, Banknote, ClipboardList, Package, ShoppingBag, TriangleAlert } from 'lucide-react';
import { AppShell } from '../components/app-shell';
import { DashboardReveal } from '../components/motion/dashboard-reveal';
import { apiFetch, ApiResponse, formatDate, formatRupiah } from '../lib/api';

type Summary = {
  total_transactions: number;
  total_sales: string;
  period: string;
  period_label: string;
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
  const [revision, setRevision] = useState(0);
  const [period, setPeriod] = useState('weekly');
  const [selectedDate, setSelectedDate] = useState('');
  const [dateFromInput, setDateFromInput] = useState('');
  const [dateToInput, setDateToInput] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  useEffect(() => {
    setError('');
    Promise.all([
      apiFetch<{ data: Summary }>(`/dashboard/summary?period=${period}${selectedDate ? `&date=${selectedDate}` : ''}${dateFrom && dateTo ? `&from=${dateFrom}&to=${dateTo}` : ''}`),
      apiFetch<ApiResponse<Order[]>>(`/orders?per_page=5${selectedDate ? `&from=${selectedDate}&to=${selectedDate}` : dateFrom && dateTo ? `&from=${dateFrom}&to=${dateTo}` : ''}`),
      apiFetch<ApiResponse<unknown[]>>('/products?per_page=1'),
    ]).then(([summaryResult, orderResult, productResult]) => {
      setSummary(summaryResult.data);
      setOrders(orderResult.data);
      setProductCount(productResult.meta?.total ?? 0);
    }).catch((cause) => setError(cause instanceof Error ? cause.message : 'Ringkasan gagal dimuat'));
  }, [revision, period, selectedDate, dateFrom, dateTo]);

  const maxOrders = Math.max(1, ...(summary?.daily_trend.map((day) => day.orders) ?? []));
  const focusDay = summary?.daily_trend.find((day) => day.date === selectedDate);
  const today = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Jakarta' }).format(new Date());

  return <AppShell><DashboardReveal>
    <header className="page-header dashboard-heading"><div><p className="eyebrow">Ikhtisar toko · {today}</p><h1>Ringkasan operasional</h1><p className="muted">Penjualan, pesanan, dan kondisi stok dalam satu tampilan.</p></div><Link className="btn" href="/orders?create=1"><ShoppingBag size={16} /> Buat pesanan</Link></header>
    {error && <div className="error" role="alert">{error} <button className="btn btn-secondary" onClick={() => setRevision((value) => value + 1)}>Coba lagi</button></div>}
    <section className="dashboard-metrics" aria-label="Metrik utama">
      <article><span className="metric-heading"><ClipboardList size={17} /> Total pesanan</span><strong>{focusDay ? focusDay.orders : summary?.total_transactions ?? '—'}</strong><small>{focusDay ? `Pada ${shortDate.format(new Date(focusDay.date))}` : summary?.period_label ?? 'Transaksi tercatat'}</small></article>
      <article><span className="metric-heading"><Banknote size={17} /> Penjualan kotor</span><strong>{summary ? formatRupiah(focusDay?.sales ?? summary.total_sales) : '—'}</strong><small>{focusDay ? 'Pada tanggal terpilih' : 'Dari periode terpilih'}</small></article>
      <article><span className="metric-heading"><Package size={17} /> Produk aktif</span><strong>{productCount ?? '—'}</strong><small>SKU dalam katalog</small></article>
      <article><span className="metric-heading"><TriangleAlert size={17} /> Perlu restock</span><strong>{summary?.low_stock_products.length ?? '—'}</strong><small>Stok di bawah 5 unit</small></article>
    </section>
    <section className="dashboard-grid dashboard-grid-prd">
      <article className="dashboard-panel trend-panel"><div className="panel-heading"><div><p className="section-kicker"><Activity size={15} /> Performa penjualan</p><h2>Pesanan per periode</h2><p className="muted">Pilih batang untuk memfilter ringkasan dashboard ke tanggal tersebut.</p></div><div className="chart-actions"><label className="period-select"><span className="sr-only">Periode grafik</span><select value={period} onChange={(event) => { setPeriod(event.target.value); setSelectedDate(''); setDateFrom(''); setDateTo(''); setDateFromInput(''); setDateToInput(''); }}><option value="weekly">7 hari</option><option value="quarterly">3 bulan</option><option value="semesterly">6 bulan</option><option value="yearly">12 bulan</option></select></label><div className="date-range-actions"><label><span>Dari</span><input type="date" value={dateFromInput} onChange={(event) => setDateFromInput(event.target.value)} /></label><label><span>Sampai</span><input type="date" min={dateFromInput || undefined} value={dateToInput} onChange={(event) => setDateToInput(event.target.value)} /></label><button type="button" disabled={!dateFromInput || !dateToInput} onClick={() => { setDateFrom(dateFromInput); setDateTo(dateToInput); setSelectedDate(''); }}>Terapkan</button>{dateFrom && <button type="button" className="date-reset" onClick={() => { setDateFrom(''); setDateTo(''); setDateFromInput(''); setDateToInput(''); }}>Reset</button>}</div></div></div>{selectedDate && <div className="active-chart-filter">Menampilkan <strong>{shortDate.format(new Date(selectedDate))}</strong><button type="button" onClick={() => setSelectedDate('')}>Hapus filter</button></div>}<div className="trend-chart" aria-label="Grafik jumlah pesanan"><div className="chart-legend"><span><i className="legend-dot current" /> Periode ini</span></div>{summary?.daily_trend.map((day) => <button type="button" className={`trend-column ${selectedDate === day.date ? 'selected' : ''} ${selectedDate && selectedDate !== day.date ? 'dimmed' : ''}`} key={day.date} onClick={() => setSelectedDate((current) => current === day.date ? '' : day.date)} title={`${day.orders} pesanan · ${formatRupiah(day.sales)}`} aria-label={`Filter dashboard ke ${shortDate.format(new Date(day.date))}`}><span className="chart-tooltip">{formatRupiah(day.sales)} · {day.orders} pesanan</span><span className="trend-value">{day.orders}</span><div className="bar-track"><span className="bar-fill current" style={{ height: `${day.orders === 0 ? 0 : day.orders / maxOrders * 100}%` }} /></div><small>{shortDate.format(new Date(day.date))}</small></button>)}{!summary && <div className="chart-loading">Memuat tren…</div>}</div></article>
      <article className="dashboard-panel top-products-panel"><div className="panel-heading"><div><p className="section-kicker">Katalog</p><h2>Produk terlaris</h2></div><Link className="panel-link" href="/products">Lihat produk</Link></div>{summary?.best_selling_products.length ? <div className="top-products-list">{summary.best_selling_products.map((item, index) => <div className="top-product-row" key={item.product?.productCode ?? index}><span className="rank-number">{String(index + 1).padStart(2, '0')}</span><span className="product-info"><strong>{item.product?.productName ?? 'Produk tidak tersedia'}</strong><small>{item.product?.productCode ?? '—'}</small></span><span className="product-quantity">{item.quantity_sold} terjual</span><strong className="product-sales">{formatRupiah(item.sales_contribution)}</strong></div>)}</div> : <p className="table-message">{summary ? 'Belum ada data penjualan produk.' : error ? 'Data tidak tersedia.' : 'Memuat produk terlaris…'}</p>}</article>
      <article className="dashboard-panel stock-panel"><div className="panel-heading"><div><p className="section-kicker">Inventaris</p><h2>Stok perlu perhatian</h2></div><span className="subtle-badge">{summary?.low_stock_products.length ?? 0} produk</span></div>{summary?.low_stock_products.length ? <div className="stock-rows">{summary.low_stock_products.slice(0, 5).map((product) => <Link href={`/products?search=${encodeURIComponent(product.productCode)}`} className="stock-row" key={product.id}><span className="product-info"><strong>{product.productName}</strong><small>{product.productCode}</small></span><span className={`status-chip ${product.stock === 0 ? 'status-danger' : 'status-warning'}`}>{product.stock === 0 ? 'Habis' : `${product.stock} tersisa`}</span></Link>)}</div> : <p className="table-message">{summary ? 'Stok seluruh produk masih aman.' : error ? 'Data tidak tersedia.' : 'Memuat kondisi stok…'}</p>}<Link className="panel-footer-link" href="/products?stock_status=low">Kelola stok</Link></article>
      <article className="dashboard-panel recent-panel"><div className="panel-heading"><div><p className="section-kicker">Transaksi terbaru</p><h2>Pesanan masuk</h2></div><Link className="panel-link" href="/orders">Lihat semua</Link></div><div className="table-wrap"><table className="workspace-table"><thead><tr><th>Nomor pesanan</th><th>Pelanggan</th><th>Tanggal</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.map((order) => <tr key={order.id}><td><Link className="table-link mono" href={`/orders?detail=${order.id}`}>{order.orderNumber}</Link></td><td>{order.customer.customerName}</td><td className="subdued">{formatDate(order.orderDate)}</td><td className="numeric">{formatRupiah(order.totalAmount)}</td><td><span className="status-chip status-success">Selesai</span></td></tr>)}</tbody></table>{!orders.length && <p className="table-message">{summary ? 'Belum ada pesanan terbaru.' : error ? 'Data tidak tersedia.' : 'Memuat pesanan…'}</p>}</div></article>
    </section>
  </DashboardReveal></AppShell>;
}
