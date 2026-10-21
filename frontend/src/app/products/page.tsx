'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Package, PackagePlus, Pencil, Search, Trash2 } from 'lucide-react';
import { AppShell } from '../../components/app-shell';
import { Button } from '../../components/ui/button';
import { Drawer } from '../../components/ui/drawer';
import { Input } from '../../components/ui/input';
import { Pagination } from '../../components/ui/pagination';
import { apiFetch, ApiResponse, formatDate, formatRupiah } from '../../lib/api';

type Product = { id: string; productCode: string; productName: string; stock: number; price: string; updatedAt: string };
type ProductForm = { product_code: string; product_name: string; stock: string; price: string };
const emptyForm: ProductForm = { product_code: '', product_name: '', stock: '0', price: '' };

export default function ProductsPage() {
  const [data, setData] = useState<ApiResponse<Product[]>>();
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState('name');
  const [stockStatus, setStockStatus] = useState('all');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState<ProductForm>(emptyForm);
  const [editing, setEditing] = useState<Product>();
  const [deleting, setDeleting] = useState<Product>();
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => { setQuery(new URLSearchParams(window.location.search).get('search') ?? ''); }, []);
  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), per_page: '10', search: query, sort, stock_status: stockStatus });
      apiFetch<ApiResponse<Product[]>>(`/products?${params}`, { signal: controller.signal })
        .then((result) => { setData(result); setError(''); })
        .catch((cause) => { if (!controller.signal.aborted) setError(cause.message); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, query ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, query, sort, stockStatus, revision]);

  function openCreate() { setEditing(undefined); setForm(emptyForm); setError(''); setFormOpen(true); }
  function openEdit(product: Product) {
    setEditing(product);
    setForm({ product_code: product.productCode, product_name: product.productName, stock: String(product.stock), price: product.price });
    setError('');
    setFormOpen(true);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await apiFetch(`/products${editing ? `/${editing.id}` : ''}`, {
        method: editing ? 'PUT' : 'POST',
        body: JSON.stringify({ ...form, stock: Number(form.stock), price: Number(form.price) }),
      });
      setFormOpen(false); setPage(1); setRevision((value) => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Produk gagal disimpan'); }
    finally { setSaving(false); }
  }
  async function remove() {
    if (!deleting) return;
    setSaving(true); setError('');
    try { await apiFetch(`/products/${deleting.id}`, { method: 'DELETE' }); setDeleting(undefined); setRevision((value) => value + 1); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Produk gagal dihapus'); }
    finally { setSaving(false); }
  }

  return <AppShell>
    <header className="page-header list-header"><div><p className="eyebrow">Katalog</p><h1>Produk</h1><p className="muted">Kelola nama, harga, dan stok produk toko.</p></div><Button type="button" onClick={openCreate}><PackagePlus size={16} /> Tambah produk</Button></header>
    <section className="list-surface" aria-label="Daftar produk">
      <div className="list-toolbar"><label className="list-search"><Search size={17} /><Input aria-label="Cari produk" placeholder="Cari nama atau kode produk" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label><div className="list-filters"><label><span className="sr-only">Status stok</span><select value={stockStatus} onChange={(event) => { setStockStatus(event.target.value); setPage(1); }}><option value="all">Semua stok</option><option value="available">Tersedia</option><option value="low">Menipis</option><option value="out">Habis</option></select></label><label><span className="sr-only">Urutkan produk</span><select value={sort} onChange={(event) => { setSort(event.target.value); setPage(1); }}><option value="name">Nama A–Z</option><option value="price">Harga termurah</option><option value="stock">Stok terendah</option></select></label></div></div>
      {error && !formOpen && !deleting && <p className="error list-error" role="alert">{error}</p>}
      <div className="table-wrap"><table className="workspace-table"><thead><tr><th>Produk</th><th>Kode</th><th>Stok</th><th>Harga</th><th>Diperbarui</th><th className="actions-heading">Aksi</th></tr></thead><tbody>{!loading && data?.data.map((product) => <tr key={product.id}><td><div className="entity-cell"><span className="entity-icon"><Package size={17} /></span><strong>{product.productName}</strong></div></td><td className="mono">{product.productCode}</td><td><span className={`status-chip ${product.stock === 0 ? 'status-danger' : product.stock < 5 ? 'status-warning' : 'status-success'}`}>{product.stock === 0 ? 'Habis' : `${product.stock} unit`}</span></td><td className="numeric">{formatRupiah(product.price)}</td><td className="subdued">{formatDate(product.updatedAt)}</td><td><div className="row-actions"><button type="button" aria-label={`Edit ${product.productName}`} title="Edit produk" onClick={() => openEdit(product)}><Pencil size={16} /></button><button type="button" className="destructive" aria-label={`Hapus ${product.productName}`} title="Hapus produk" onClick={() => setDeleting(product)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>{loading && <div className="table-message">Memuat produk…</div>}{!loading && !data?.data.length && <div className="table-message">Tidak ada produk yang cocok dengan pencarian.</div>}</div>
      <Pagination page={data?.meta?.page ?? page} totalPages={data?.meta?.total_pages ?? 1} total={data?.meta?.total ?? 0} perPage={data?.meta?.per_page ?? 10} onPageChange={setPage} noun="produk" />
    </section>
    <Drawer open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Edit produk' : 'Tambah produk'} description="Perubahan katalog langsung tersimpan setelah formulir dikirim."><form className="drawer-form" onSubmit={submit}><label className="field">Kode produk<Input value={form.product_code} onChange={(event) => setForm({ ...form, product_code: event.target.value })} required maxLength={20} placeholder="Contoh: P0021" /></label><label className="field">Nama produk<Input value={form.product_name} onChange={(event) => setForm({ ...form, product_name: event.target.value })} required maxLength={150} placeholder="Nama produk yang tampil di katalog" /></label><div className="form-columns"><label className="field">Stok awal<Input type="number" min="0" value={form.stock} onChange={(event) => setForm({ ...form, stock: event.target.value })} required /></label><label className="field">Harga (Rp)<Input type="number" min="0.01" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} required /></label></div>{error && <p className="error" role="alert">{error}</p>}<div className="drawer-actions"><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Batal</Button><Button disabled={saving}>{saving ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Tambah produk'}</Button></div></form></Drawer>
    <Drawer open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(undefined); }} title="Hapus produk?" description="Produk tidak lagi muncul di katalog. Riwayat order tetap tersimpan."><p className="confirmation-copy">{deleting?.productName}</p>{error && <p className="error" role="alert">{error}</p>}<div className="drawer-actions"><Button type="button" variant="secondary" onClick={() => setDeleting(undefined)}>Batal</Button><Button type="button" variant="danger" onClick={remove} disabled={saving}>Hapus produk</Button></div></Drawer>
  </AppShell>;
}
