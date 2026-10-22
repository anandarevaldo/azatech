'use client';

import { FormEvent, Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Download, Eye, Plus, Printer, Search, ShoppingCart, Trash2 } from 'lucide-react';
import { AppShell } from '../../components/app-shell';
import { Button } from '../../components/ui/button';
import { Drawer } from '../../components/ui/drawer';
import { Input } from '../../components/ui/input';
import { Pagination } from '../../components/ui/pagination';
import { ApiError, apiFetch, ApiResponse, downloadFile, formatDate, formatRupiah } from '../../lib/api';

import { TableState } from '../../components/ui/table-state';
import { QuantityStepper } from '../../components/ui/quantity-stepper';
import { getCustomerAvatar, initials } from '../../lib/catalog';

type Product = { id: string; productCode: string; productName: string; stock: number; price: string };
type Customer = { id: string; customerName: string; phone?: string; customerAddress: string; gender?: 'PRIA' | 'WANITA' };
type Order = { id: string; orderNumber: string; orderDate: string; totalAmount: string; customer: Customer };
type OrderDetail = Order & { items: Array<{ id: string; quantity: number; unitPrice: string; subtotal: string; product: Product }> };
type Line = { product_id: string; quantity: number };

export default function OrdersPage() {
  return <Suspense fallback={<main className="centered">Memuat pesanan…</main>}><OrdersWorkspace /></Suspense>;
}

function OrdersWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<ApiResponse<Order[]>>();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [query, setQuery] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [historyCustomerId, setHistoryCustomerId] = useState('');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailId, setDetailId] = useState<string>();
  const [detail, setDetail] = useState<OrderDetail>();
  const [customerSearch, setCustomerSearch] = useState('');
  const [customerPickerOpen, setCustomerPickerOpen] = useState(false);
  const [customerId, setCustomerId] = useState('');
  const [lines, setLines] = useState<Line[]>([{ product_id: '', quantity: 1 }]);
  const [lineErrors, setLineErrors] = useState<Record<string, string[]>>({});
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);

  useEffect(() => {
    const params = searchParams;
    const initialFrom = params.get('from') ?? '';
    const initialTo = params.get('to') ?? '';
    if (initialFrom) setFrom(initialFrom);
    if (initialTo) setTo(initialTo);
    if (params.get('create') === '1') {
      setCreateOpen(true);
      const remaining = new URLSearchParams(params.toString());
      remaining.delete('create');
      router.replace(`/orders${remaining.size ? `?${remaining}` : ''}`, { scroll: false });
    }
    if (params.get('detail')) setDetailId(params.get('detail')!);
  }, [searchParams, router]);

  useEffect(() => {
    apiFetch<ApiResponse<Customer[]>>('/customers?per_page=100')
      .then((result) => setCustomers(result.data))
      .catch((cause) => setError(cause.message));
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), per_page: '10', search: query });
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (historyCustomerId) params.set('customer_id', historyCustomerId);
      apiFetch<ApiResponse<Order[]>>(`/orders?${params}`, { signal: controller.signal })
        .then((result) => { setOrders(result); setError(''); })
        .catch((cause) => { if (!controller.signal.aborted) setError(cause.message); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, query ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, query, from, to, historyCustomerId, revision]);

  useEffect(() => {
    if (!createOpen) return;
    Promise.all([
      apiFetch<ApiResponse<Product[]>>('/products?per_page=100'),
      apiFetch<ApiResponse<Customer[]>>('/customers?per_page=100'),
    ]).then(([productResult, customerResult]) => { setProducts(productResult.data); setCustomers(customerResult.data); })
      .catch((cause) => setError(cause.message));
  }, [createOpen, revision]);

  useEffect(() => {
    if (!detailId) { setDetail(undefined); return; }
    setDetail(undefined);
    setError('');
    apiFetch<{ data: OrderDetail }>(`/orders/${detailId}`).then((result) => setDetail(result.data)).catch((cause) => setError(cause.message));
  }, [detailId]);

  const customerOptions = customers.filter((customer) => `${customer.customerName} ${customer.phone ?? ''}`.toLowerCase().includes(customerSearch.toLowerCase()));
  const estimatedTotal = useMemo(() => lines.reduce((total, line) => total + Number(products.find((product) => product.id === line.product_id)?.price ?? 0) * line.quantity, 0), [lines, products]);
  const hasInvalidLine = lines.some((line, index) => {
    const product = products.find((item) => item.id === line.product_id);
    return !product || line.quantity < 1 || line.quantity > product.stock || lines.findIndex((item) => item.product_id === line.product_id) !== index;
  });

  async function exportOrders() {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (from) params.set('from', from);
      if (to) params.set('to', to);
      if (historyCustomerId) params.set('customer_id', historyCustomerId);
      if (query) params.set('search', query);
      await downloadFile(`/orders/export?${params}`, 'riwayat-order.csv');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Export order gagal');
    } finally { setExporting(false); }
  }

  function openCreate() {
    setError(''); setLineErrors({});
    const draft = localStorage.getItem('orderhub-order-draft');
    if (draft) {
      try { const parsed = JSON.parse(draft) as { customerId?: string; customerSearch?: string; lines?: Line[] }; setCustomerId(parsed.customerId ?? ''); setCustomerSearch(parsed.customerSearch ?? ''); setLines(parsed.lines?.length ? parsed.lines : [{ product_id: '', quantity: 1 }]); }
      catch { localStorage.removeItem('orderhub-order-draft'); }
    } else { setCustomerSearch(''); setCustomerId(''); setLines([{ product_id: '', quantity: 1 }]); }
    setCreateOpen(true);
  }
  function requestCloseCreate() {
    const hasContent = Boolean(customerId || customerSearch.trim() || lines.some((line) => line.product_id || line.quantity > 1));
    if (!hasContent) {
      setCustomerPickerOpen(false);
      setCreateOpen(false);
      return;
    }
    setCloseConfirmOpen(true);
  }
  function saveDraftAndClose() { localStorage.setItem('orderhub-order-draft', JSON.stringify({ customerId, customerSearch, lines })); setCloseConfirmOpen(false); setCreateOpen(false); setNotice('Draft pesanan disimpan.'); }
  function discardAndClose() { localStorage.removeItem('orderhub-order-draft'); setCloseConfirmOpen(false); setCreateOpen(false); }
  function updateLine(index: number, patch: Partial<Line>) {
    setLines((current) => current.map((line, position) => {
      if (position !== index) return line;
      const next = { ...line, ...patch };
      const selected = products.find((product) => product.id === next.product_id);
      if (selected && selected.stock > 0) next.quantity = Math.min(Math.max(1, next.quantity), selected.stock);
      return next;
    }));
    setLineErrors({});
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customerId || hasInvalidLine) return;
    setSaving(true); setError(''); setLineErrors({});
    try {
      const result = await apiFetch<{ data: { id: string; orderNumber: string } }>('/orders', {
        method: 'POST',
        body: JSON.stringify({ customer_id: customerId, items: lines.map((line) => ({ product_id: Number(line.product_id), quantity: line.quantity })) }),
      });
      localStorage.removeItem('orderhub-order-draft'); setCreateOpen(false); setNotice(`${result.data.orderNumber} berhasil dibuat.`); setDetailId(result.data.id); setPage(1); setRevision((value) => value + 1);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Order gagal dibuat');
      if (cause instanceof ApiError) setLineErrors(cause.errors ?? {});
    } finally { setSaving(false); }
  }

  return <AppShell>
    <header className="page-header list-header"><div><p className="eyebrow">Transaksi</p><h1>Pesanan</h1><p className="muted">Lihat riwayat dan buat pesanan baru dari katalog aktif.</p></div><div className="header-actions"><Button type="button" variant="secondary" onClick={exportOrders} disabled={exporting}><Download size={16} /> {exporting ? 'Menyiapkan…' : 'Export CSV'}</Button><Button type="button" onClick={openCreate}><Plus size={16} /> Buat pesanan</Button></div></header>
    {notice && <p className="success-notice" role="status">{notice}</p>}
    <section className="list-surface" aria-label="Riwayat pesanan">
      <div className="list-toolbar"><label className="list-search"><Search size={17} /><Input aria-label="Cari pesanan" placeholder="Cari nomor pesanan atau pelanggan" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label><div className="list-filters"><label><span className="sr-only">Filter pelanggan</span><select aria-label="Filter pelanggan" value={historyCustomerId} onChange={(event) => { setHistoryCustomerId(event.target.value); setPage(1); }}><option value="">Semua pelanggan</option>{customers.map((customer) => <option key={customer.id} value={customer.id}>{customer.customerName}</option>)}</select></label><label><span className="sr-only">Dari tanggal</span><Input aria-label="Dari tanggal" type="date" value={from} onChange={(event) => { setFrom(event.target.value); setPage(1); }} /></label><span className="date-separator">–</span><label><span className="sr-only">Sampai tanggal</span><Input aria-label="Sampai tanggal" type="date" min={from || undefined} value={to} onChange={(event) => { setTo(event.target.value); setPage(1); }} /></label>{(query || from || to || historyCustomerId) && <Button type="button" variant="ghost" onClick={() => { setQuery(''); setFrom(''); setTo(''); setHistoryCustomerId(''); setPage(1); }}>Reset</Button>}</div></div>
      {error && !createOpen && !detailId && <p className="error list-error" role="alert">{error}</p>}
      <div className="table-wrap"><table className="workspace-table"><thead><tr><th>Nomor pesanan</th><th>Pelanggan</th><th>Tanggal</th><th>Total</th><th>Status</th><th className="actions-heading">Aksi</th></tr></thead><tbody>{!loading && orders?.data.map((order) => <tr key={order.id}><td><button className="table-link mono" type="button" onClick={() => setDetailId(order.id)}>{order.orderNumber}</button></td><td><div className="entity-cell"><span className={`initial-avatar gender-${(order.customer.gender ?? 'PRIA').toLowerCase()}`}><img src={getCustomerAvatar(order.customer.customerName, order.customer.gender ?? 'PRIA')} alt="" loading="lazy" /><span>{initials(order.customer.customerName)}</span></span><strong>{order.customer.customerName}</strong></div></td><td className="subdued">{formatDate(order.orderDate)}</td><td className="numeric">{formatRupiah(order.totalAmount)}</td><td><span className="status-chip status-success">Selesai</span></td><td><div className="row-actions"><button type="button" title="Lihat detail" aria-label={`Detail ${order.orderNumber}`} onClick={() => setDetailId(order.id)}><Eye size={16} /></button></div></td></tr>)}</tbody></table><TableState loading={loading} empty={!orders?.data.length} error={error && !createOpen && !detailId ? error : ''} onRetry={() => setRevision((value) => value + 1)} onReset={() => { setQuery(''); setFrom(''); setTo(''); setHistoryCustomerId(''); setPage(1); }} /></div>
      <Pagination page={orders?.meta?.page ?? page} totalPages={orders?.meta?.total_pages ?? 1} total={orders?.meta?.total ?? 0} perPage={orders?.meta?.per_page ?? 10} onPageChange={setPage} noun="pesanan" />
    </section>
    <Drawer open={createOpen} onOpenChange={(open) => { if (!open) requestCloseCreate(); }} allowOutsideInteraction title="Buat pesanan" description="Pilih pelanggan dan jumlah produk. Anda bisa mengisi bagian mana saja terlebih dahulu." className="drawer-wide"><form className="drawer-form" onSubmit={submit}><div className="form-section"><h3>Pelanggan</h3><label className="field">Pilih pelanggan<span className="customer-picker"><Input value={customerSearch} onFocus={() => setCustomerPickerOpen(true)} onChange={(event) => { setCustomerSearch(event.target.value); setCustomerPickerOpen(true); setCustomerId(''); }} placeholder="Ketik nama atau nomor telepon" autoComplete="off" />{customerPickerOpen && <div className="customer-options">{customerOptions.length ? customerOptions.map((customer) => <button type="button" className="customer-option" key={customer.id} onMouseDown={(event) => event.preventDefault()} onClick={() => { setCustomerId(customer.id); setCustomerSearch(customer.customerName); setCustomerPickerOpen(false); }}><span className={`initial-avatar gender-${(customer.gender ?? 'PRIA').toLowerCase()}`}>{customer.customerName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><span><strong>{customer.customerName}</strong><small>{customer.phone ?? 'Nomor belum diisi'}</small></span></button>) : <span className="customer-empty">Pelanggan tidak ditemukan</span>}</div>}</span></label>{customerId && <p className="selection-confirmed">Pelanggan dipilih: {customers.find((customer) => customer.id === customerId)?.customerName}</p>}</div><div className="form-section"><div className="section-heading"><h3>Item pesanan</h3><span>{lines.length} item</span></div>{lines.map((line, index) => { const product = products.find((item) => item.id === line.product_id); const duplicate = Boolean(line.product_id && lines.findIndex((item) => item.product_id === line.product_id) !== index); const stockError = product && line.quantity > product.stock; return <div className="order-item-row" key={index}><div className="order-item-inputs"><label className="field">Produk<select value={line.product_id} onChange={(event) => updateLine(index, { product_id: event.target.value })} required><option value="">Pilih produk</option>{products.map((item) => <option key={item.id} value={item.id}>{item.productName} · {formatRupiah(item.price)}</option>)}</select></label><label className="field qty-field">Jumlah<QuantityStepper value={line.quantity} max={product?.stock} onChange={(quantity) => updateLine(index, { quantity })} /></label><button className="icon-action destructive" type="button" aria-label={`Hapus item ${index + 1}`} onClick={() => setLines((current) => current.length === 1 ? [{ product_id: '', quantity: 1 }] : current.filter((_, position) => position !== index))}><Trash2 size={16} /></button></div>{product && <div className="item-meta"><span>Stok tersedia: {product.stock}{product.stock > 0 && line.quantity >= product.stock ? ' · Batas tercapai' : ''}</span><strong>{formatRupiah(Number(product.price) * line.quantity)}</strong></div>}{duplicate && <p className="field-error">Produk yang sama sudah dipilih di baris lain.</p>}{stockError && <p className="field-error">Stok tersisa {product.stock}, jumlah yang diminta {line.quantity}.</p>}{lineErrors[`items.${index}.quantity`]?.map((message) => <p className="field-error" key={message}>{message}</p>)}{lineErrors[`items.${index}.product_id`]?.map((message) => <p className="field-error" key={message}>{message}</p>)}</div>; })}<Button type="button" variant="secondary" onClick={() => setLines((current) => [...current, { product_id: '', quantity: 1 }])}><Plus size={16} /> Tambah item</Button></div>{hasInvalidLine && <p className="order-hint">Pilih produk dan pastikan jumlah tidak melebihi stok. Setiap produk hanya boleh dipilih satu kali.</p>}<div className="order-total"><span>Estimasi total</span><strong>{formatRupiah(estimatedTotal)}</strong><small>Nominal akhir dihitung dari harga di server.</small></div>{error && <p className="error" role="alert">{error}</p>}<div className="drawer-actions"><Button type="button" variant="secondary" onClick={requestCloseCreate}>Batal</Button><Button disabled={saving || !customerId || hasInvalidLine}><ShoppingCart size={16} /> {saving ? 'Memproses…' : 'Simpan pesanan'}</Button></div></form></Drawer>
    <Drawer modal open={closeConfirmOpen} onOpenChange={setCloseConfirmOpen} title="Simpan draft pesanan?" description="Pesanan ini belum disimpan. Anda bisa melanjutkannya nanti."><p className="confirmation-copy">Simpan draft agar pelanggan dan item yang sudah dipilih tidak hilang.</p><div className="drawer-actions"><Button type="button" variant="secondary" onClick={discardAndClose}>Keluar tanpa simpan</Button><Button type="button" onClick={saveDraftAndClose}>Simpan draft</Button></div></Drawer>
    <Drawer open={Boolean(detailId)} onOpenChange={(open) => { if (!open) setDetailId(undefined); }} title={detail?.orderNumber ?? 'Detail pesanan'} description={detail ? `${formatDate(detail.orderDate)} · ${detail.customer.customerName}` : 'Memuat transaksi…'} className="drawer-wide"><div className="invoice-content">{error && !detail && <p className="error" role="alert">{error}</p>}{!detail && !error && <p className="table-message">Memuat detail…</p>}{detail && <><div className="invoice-meta"><div><span>Pelanggan</span><strong>{detail.customer.customerName}</strong><small>{detail.customer.phone ?? detail.customer.customerAddress}</small></div><div><span>Status</span><strong>Pesanan selesai</strong><small>{formatDate(detail.orderDate)}</small></div></div><h3>Rincian item</h3><div className="table-wrap"><table className="workspace-table"><thead><tr><th>Produk</th><th>Qty</th><th>Harga</th><th>Subtotal</th></tr></thead><tbody>{detail.items.map((item) => <tr key={item.id}><td><strong>{item.product.productName}</strong><small className="subdued">{item.product.productCode}</small></td><td>{item.quantity}</td><td>{formatRupiah(item.unitPrice)}</td><td className="numeric">{formatRupiah(item.subtotal)}</td></tr>)}</tbody></table></div><div className="invoice-total"><span>Total pembayaran</span><strong>{formatRupiah(detail.totalAmount)}</strong></div><div className="drawer-actions"><Button type="button" variant="secondary" onClick={() => setDetailId(undefined)}>Tutup</Button><Button type="button" onClick={() => window.print()}><Printer size={16} /> Cetak invoice</Button></div></>}</div></Drawer>
  </AppShell>;
}
