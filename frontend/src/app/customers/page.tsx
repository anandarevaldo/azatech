'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { ImagePlus, Mars, Pencil, Search, Trash2, UserRoundPlus, Venus } from 'lucide-react';
import { AppShell } from '../../components/app-shell';
import { Button } from '../../components/ui/button';
import { Drawer } from '../../components/ui/drawer';
import { Input } from '../../components/ui/input';
import { Pagination } from '../../components/ui/pagination';
import { TableState } from '../../components/ui/table-state';
import { apiFetch, ApiResponse } from '../../lib/api';
import { getCustomerAvatar, initials } from '../../lib/catalog';

type Customer = { id: string; customerName: string; customerAddress: string; gender: 'PRIA' | 'WANITA'; birthDate: string; phone?: string; imageUrl?: string | null; _count?: { orders: number } };
type CustomerForm = { customer_name: string; customer_address: string; gender: 'PRIA' | 'WANITA'; birth_date: string; phone: string; image_url: string };
const emptyForm: CustomerForm = { customer_name: '', customer_address: '', gender: 'PRIA', birth_date: '', phone: '', image_url: '' };
const birthDate = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

export default function CustomersPage() {
  const [data, setData] = useState<ApiResponse<Customer[]>>();
  const [query, setQuery] = useState('');
  const [gender, setGender] = useState('all');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [editing, setEditing] = useState<Customer>();
  const [deleting, setDeleting] = useState<Customer>();
  const [formOpen, setFormOpen] = useState(false);
  const [imageSourceOpen, setImageSourceOpen] = useState(false);
  const [imageUrlDraft, setImageUrlDraft] = useState('');
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), per_page: '10', search: query });
      if (gender !== 'all') params.set('gender', gender);
      apiFetch<ApiResponse<Customer[]>>(`/customers?${params}`, { signal: controller.signal })
        .then((result) => { setData(result); setError(''); })
        .catch((cause) => { if (!controller.signal.aborted) setError(cause.message); })
        .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    }, query ? 250 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [page, query, gender, revision]);

  function openCreate() { setEditing(undefined); setForm(emptyForm); setError(''); setFormOpen(true); }
  function openEdit(customer: Customer) {
    setEditing(customer);
    setForm({ customer_name: customer.customerName, customer_address: customer.customerAddress, gender: customer.gender, birth_date: customer.birthDate.slice(0, 10), phone: customer.phone ?? '', image_url: customer.imageUrl ?? '' });
    setError(''); setFormOpen(true);
  }
  function handleImageChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setError('Pilih file gambar yang valid.'); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const source = new Image();
      source.onload = () => {
        const scale = Math.min(1, 800 / Math.max(source.width, source.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(source.width * scale));
        canvas.height = Math.max(1, Math.round(source.height * scale));
        canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height);
        setForm((current) => ({ ...current, image_url: canvas.toDataURL('image/jpeg', 0.82) }));
        setImageSourceOpen(false); setError('');
      };
      source.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  }
  function openImageSource() {
    setImageUrlDraft(form.image_url.startsWith('http') ? form.image_url : '');
    setImageSourceOpen(true);
  }
  function useImageUrl() {
    const value = imageUrlDraft.trim();
    try {
      const url = new URL(value);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('invalid');
      setForm((current) => ({ ...current, image_url: value })); setImageSourceOpen(false); setError('');
    } catch { setError('Masukkan URL gambar yang valid.'); }
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await apiFetch(`/customers${editing ? `/${editing.id}` : ''}`, { method: editing ? 'PUT' : 'POST', body: JSON.stringify({ ...form, image_url: form.image_url || undefined }) });
      setNotice(editing ? 'Perubahan berhasil disimpan.' : 'Pelanggan berhasil ditambahkan.'); setFormOpen(false); setPage(1); setRevision((value) => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Pelanggan gagal disimpan'); }
    finally { setSaving(false); }
  }
  async function remove() {
    if (!deleting) return;
    setSaving(true); setError('');
    try { await apiFetch(`/customers/${deleting.id}`, { method: 'DELETE' }); setNotice('Pelanggan berhasil dihapus.'); setDeleting(undefined); setRevision((value) => value + 1); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Pelanggan gagal dihapus'); }
    finally { setSaving(false); }
  }

  return <AppShell>
    <header className="page-header list-header"><div><p className="eyebrow">Direktori</p><h1>Pelanggan</h1><p className="muted">Kontak pelanggan yang digunakan saat membuat pesanan.</p></div><Button type="button" onClick={openCreate}><UserRoundPlus size={16} /> Tambah pelanggan</Button></header>
    {notice && <div className="success-notice" role="status">{notice}<button type="button" aria-label="Tutup notifikasi" onClick={() => setNotice('')}>×</button></div>}
    <section className="list-surface" aria-label="Daftar pelanggan">
      <div className="list-toolbar"><label className="list-search"><Search size={17} /><Input aria-label="Cari pelanggan" placeholder="Cari nama atau nomor telepon" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label><div className="list-filters"><label><span className="sr-only">Filter gender</span><select value={gender} onChange={(event) => { setGender(event.target.value); setPage(1); }}><option value="all">Semua gender</option><option value="PRIA">Pria</option><option value="WANITA">Wanita</option></select></label></div></div>
      {error && !formOpen && !deleting && <p className="error list-error" role="alert">{error}</p>}
      <div className="table-wrap"><table className="workspace-table"><thead><tr><th>Pelanggan</th><th>Telepon</th><th>Gender</th><th>Tanggal lahir</th><th>Alamat</th><th>Order</th><th className="actions-heading">Aksi</th></tr></thead><tbody>{!loading && data?.data.map((customer) => <tr key={customer.id}><td><div className="entity-cell"><span className={`initial-avatar gender-${customer.gender.toLowerCase()}`}><img src={customer.imageUrl ?? getCustomerAvatar(customer.customerName, customer.gender)} alt="" loading="lazy" onError={(event) => { event.currentTarget.style.display = 'none'; }} /><span>{initials(customer.customerName)}</span></span><strong>{customer.customerName}</strong></div></td><td className="mono">{customer.phone ?? '—'}</td><td><span className={`gender-chip gender-${customer.gender.toLowerCase()}`}>{customer.gender === 'PRIA' ? <Mars size={14} /> : <Venus size={14} />}{customer.gender === 'PRIA' ? 'Pria' : 'Wanita'}</span></td><td className="subdued">{birthDate.format(new Date(customer.birthDate))}</td><td className="address-cell">{customer.customerAddress}</td><td className="numeric">{customer._count?.orders ?? 0}</td><td><div className="row-actions"><button type="button" aria-label={`Edit ${customer.customerName}`} title="Edit pelanggan" onClick={() => openEdit(customer)}><Pencil size={16} /></button><button type="button" className="destructive" aria-label={`Hapus ${customer.customerName}`} title="Hapus pelanggan" onClick={() => setDeleting(customer)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table><TableState loading={loading} empty={!data?.data.length} error={error && !formOpen && !deleting ? error : ''} onRetry={() => setRevision((value) => value + 1)} onReset={() => { setQuery(''); setGender('all'); setPage(1); }} /></div>
      <Pagination page={data?.meta?.page ?? page} totalPages={data?.meta?.total_pages ?? 1} total={data?.meta?.total ?? 0} perPage={data?.meta?.per_page ?? 10} onPageChange={setPage} noun="pelanggan" />
    </section>
    <Drawer open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Edit pelanggan' : 'Tambah pelanggan'} description="Data ini digunakan pada transaksi dan riwayat pesanan.">
      <form className="drawer-form" onSubmit={submit}>
        <label className="field">Nama lengkap<Input value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} required placeholder="Nama sesuai kontak" /></label>
        <label className="field">Foto pelanggan
          <button type="button" className={`product-image-picker ${form.image_url ? 'has-image' : ''}`} onClick={openImageSource} aria-label="Tambah foto pelanggan">
            {form.image_url ? <img className="product-image-preview" src={form.image_url} alt="Preview pelanggan" /> : <span className="product-image-plus"><ImagePlus size={24} /></span>}
            <span className="product-image-picker-copy"><strong>{form.image_url ? 'Ganti foto pelanggan' : 'Tambah foto pelanggan'}</strong><small>Klik untuk memilih file atau memasukkan URL</small></span>
          </button>
        </label>
        <label className="field">Alamat<Input value={form.customer_address} onChange={(event) => setForm({ ...form, customer_address: event.target.value })} required placeholder="Jalan, kota" /></label>
        <div className="form-columns"><label className="field">Gender<span className="select-field"><select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as CustomerForm['gender'] })}><option value="PRIA">Pria</option><option value="WANITA">Wanita</option></select><span aria-hidden="true">⌄</span></span></label><label className="field">Tanggal lahir<Input type="date" value={form.birth_date} onChange={(event) => setForm({ ...form, birth_date: event.target.value })} required /></label></div>
        <label className="field">Nomor telepon<Input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="08…" /></label>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="drawer-actions"><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Batal</Button><Button disabled={saving}>{saving ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Tambah pelanggan'}</Button></div>
      </form>
    </Drawer>
    <Drawer modal open={imageSourceOpen} onOpenChange={setImageSourceOpen} title="Tambah foto pelanggan" description="Pilih foto dari komputer atau gunakan URL gambar.">
      <div className="image-source-options">
        <input ref={imageInputRef} className="sr-only" type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={handleImageChange} />
        <button type="button" className="image-source-choice" onClick={() => imageInputRef.current?.click()}><ImagePlus size={21} /><span><strong>Pilih dari File Explorer</strong><small>JPG, PNG, WEBP, atau GIF</small></span></button>
        <div className="image-url-choice"><label className="field">URL gambar<Input type="url" value={imageUrlDraft} onChange={(event) => setImageUrlDraft(event.target.value)} placeholder="https://contoh.com/foto.jpg" /></label>{error && <p className="error" role="alert">{error}</p>}<Button type="button" onClick={useImageUrl}>Gunakan URL</Button></div>
      </div>
    </Drawer>
    <Drawer modal open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(undefined); }} title="Hapus pelanggan?" description="Kontak tidak lagi muncul dalam pilihan pesanan. Riwayat transaksi tetap tersimpan."><p className="confirmation-copy">{deleting?.customerName}</p>{error && <p className="error" role="alert">{error}</p>}<div className="drawer-actions"><Button type="button" variant="secondary" onClick={() => setDeleting(undefined)}>Batal</Button><Button type="button" variant="danger" onClick={remove} disabled={saving}>{saving ? 'Menghapus…' : 'Hapus pelanggan'}</Button></div></Drawer>
  </AppShell>;
}
