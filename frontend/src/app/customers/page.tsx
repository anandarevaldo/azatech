'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Pencil, Search, Trash2, UserRoundPlus } from 'lucide-react';
import { AppShell } from '../../components/app-shell';
import { Button } from '../../components/ui/button';
import { Drawer } from '../../components/ui/drawer';
import { Input } from '../../components/ui/input';
import { Pagination } from '../../components/ui/pagination';
import { apiFetch, ApiResponse } from '../../lib/api';

type Customer = { id: string; customerName: string; customerAddress: string; gender: 'PRIA' | 'WANITA'; birthDate: string; phone?: string; _count?: { orders: number } };
type CustomerForm = { customer_name: string; customer_address: string; gender: 'PRIA' | 'WANITA'; birth_date: string; phone: string };
const emptyForm: CustomerForm = { customer_name: '', customer_address: '', gender: 'PRIA', birth_date: '', phone: '' };
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
  const [form, setForm] = useState<CustomerForm>(emptyForm);
  const [editing, setEditing] = useState<Customer>();
  const [deleting, setDeleting] = useState<Customer>();
  const [formOpen, setFormOpen] = useState(false);

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
    setForm({ customer_name: customer.customerName, customer_address: customer.customerAddress, gender: customer.gender, birth_date: customer.birthDate.slice(0, 10), phone: customer.phone ?? '' });
    setError(''); setFormOpen(true);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError('');
    try {
      await apiFetch(`/customers${editing ? `/${editing.id}` : ''}`, { method: editing ? 'PUT' : 'POST', body: JSON.stringify(form) });
      setFormOpen(false); setPage(1); setRevision((value) => value + 1);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Pelanggan gagal disimpan'); }
    finally { setSaving(false); }
  }
  async function remove() {
    if (!deleting) return;
    setSaving(true); setError('');
    try { await apiFetch(`/customers/${deleting.id}`, { method: 'DELETE' }); setDeleting(undefined); setRevision((value) => value + 1); }
    catch (cause) { setError(cause instanceof Error ? cause.message : 'Pelanggan gagal dihapus'); }
    finally { setSaving(false); }
  }

  return <AppShell>
    <header className="page-header list-header"><div><p className="eyebrow">Direktori</p><h1>Pelanggan</h1><p className="muted">Kontak pelanggan yang digunakan saat membuat pesanan.</p></div><Button type="button" onClick={openCreate}><UserRoundPlus size={16} /> Tambah pelanggan</Button></header>
    <section className="list-surface" aria-label="Daftar pelanggan">
      <div className="list-toolbar"><label className="list-search"><Search size={17} /><Input aria-label="Cari pelanggan" placeholder="Cari nama atau nomor telepon" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} /></label><div className="list-filters"><label><span className="sr-only">Filter gender</span><select value={gender} onChange={(event) => { setGender(event.target.value); setPage(1); }}><option value="all">Semua gender</option><option value="PRIA">Pria</option><option value="WANITA">Wanita</option></select></label></div></div>
      {error && !formOpen && !deleting && <p className="error list-error" role="alert">{error}</p>}
      <div className="table-wrap"><table className="workspace-table"><thead><tr><th>Pelanggan</th><th>Telepon</th><th>Gender</th><th>Tanggal lahir</th><th>Alamat</th><th>Order</th><th className="actions-heading">Aksi</th></tr></thead><tbody>{!loading && data?.data.map((customer) => <tr key={customer.id}><td><div className="entity-cell"><span className="initial-avatar">{customer.customerName.split(' ').map((part) => part[0]).slice(0, 2).join('')}</span><strong>{customer.customerName}</strong></div></td><td className="mono">{customer.phone ?? '—'}</td><td><span className="neutral-chip">{customer.gender === 'PRIA' ? 'Pria' : 'Wanita'}</span></td><td className="subdued">{birthDate.format(new Date(customer.birthDate))}</td><td className="address-cell">{customer.customerAddress}</td><td className="numeric">{customer._count?.orders ?? 0}</td><td><div className="row-actions"><button type="button" aria-label={`Edit ${customer.customerName}`} title="Edit pelanggan" onClick={() => openEdit(customer)}><Pencil size={16} /></button><button type="button" className="destructive" aria-label={`Hapus ${customer.customerName}`} title="Hapus pelanggan" onClick={() => setDeleting(customer)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table>{loading && <div className="table-message">Memuat pelanggan…</div>}{!loading && !data?.data.length && <div className="table-message">Tidak ada pelanggan yang cocok dengan pencarian.</div>}</div>
      <Pagination page={data?.meta?.page ?? page} totalPages={data?.meta?.total_pages ?? 1} total={data?.meta?.total ?? 0} perPage={data?.meta?.per_page ?? 10} onPageChange={setPage} noun="pelanggan" />
    </section>
    <Drawer open={formOpen} onOpenChange={setFormOpen} title={editing ? 'Edit pelanggan' : 'Tambah pelanggan'} description="Data ini digunakan pada transaksi dan riwayat pesanan."><form className="drawer-form" onSubmit={submit}><label className="field">Nama lengkap<Input value={form.customer_name} onChange={(event) => setForm({ ...form, customer_name: event.target.value })} required placeholder="Nama sesuai kontak" /></label><label className="field">Alamat<Input value={form.customer_address} onChange={(event) => setForm({ ...form, customer_address: event.target.value })} required placeholder="Jalan, kota" /></label><div className="form-columns"><label className="field">Gender<select value={form.gender} onChange={(event) => setForm({ ...form, gender: event.target.value as CustomerForm['gender'] })}><option value="PRIA">Pria</option><option value="WANITA">Wanita</option></select></label><label className="field">Tanggal lahir<Input type="date" value={form.birth_date} onChange={(event) => setForm({ ...form, birth_date: event.target.value })} required /></label></div><label className="field">Nomor telepon<Input type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="08…" /></label>{error && <p className="error" role="alert">{error}</p>}<div className="drawer-actions"><Button type="button" variant="secondary" onClick={() => setFormOpen(false)}>Batal</Button><Button disabled={saving}>{saving ? 'Menyimpan…' : editing ? 'Simpan perubahan' : 'Tambah pelanggan'}</Button></div></form></Drawer>
    <Drawer open={Boolean(deleting)} onOpenChange={(open) => { if (!open) setDeleting(undefined); }} title="Hapus pelanggan?" description="Kontak tidak lagi muncul dalam pilihan pesanan. Riwayat transaksi tetap tersimpan."><p className="confirmation-copy">{deleting?.customerName}</p>{error && <p className="error" role="alert">{error}</p>}<div className="drawer-actions"><Button type="button" variant="secondary" onClick={() => setDeleting(undefined)}>Batal</Button><Button type="button" variant="danger" onClick={remove} disabled={saving}>Hapus pelanggan</Button></div></Drawer>
  </AppShell>;
}
