'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ClipboardList, LayoutDashboard, LogOut, Package, Plus, UsersRound, Menu } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';
import { Drawer } from './ui/drawer';
import { apiFetch } from '../lib/api';

const navigation = [
  { href: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { href: '/orders', label: 'Pesanan', Icon: ClipboardList },
  { href: '/products', label: 'Produk', Icon: Package },
  { href: '/customers', label: 'Pelanggan', Icon: UsersRound },
];

export function AppShell({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<{ name: string; email: string }>();
  const [loggingOut, setLoggingOut] = useState(false);
  const [logoutError, setLogoutError] = useState('');
  useEffect(() => {
    if (!localStorage.getItem('access_token')) { router.replace('/login'); return; }
    setReady(true);
    apiFetch<{ data: { name: string; email: string } }>('/auth/me').then((result) => setUser(result.data)).catch(() => {});
  }, [router]);
  async function logout() {
    setLoggingOut(true); setLogoutError('');
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
      localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); router.replace('/login');
    } catch { setLogoutError('Gagal keluar. Coba lagi.'); setLoggingOut(false); }
  }
  if (!ready) return <main className="centered" role="status">Membuka workspace…</main>;
  const active = navigation.find((item) => item.href === pathname || (pathname === '/' && item.href === '/dashboard'));
  const initials = user?.name.split(' ').map((part) => part[0]).slice(0, 2).join('') ?? 'A';
  const links = <nav aria-label="Navigasi utama">{navigation.map(({ href, label, Icon }) => <Link key={href} href={href} onClick={() => setMenuOpen(false)} className={active?.href === href ? 'nav-link active' : 'nav-link'} aria-current={active?.href === href ? 'page' : undefined} title={label}><Icon size={19} strokeWidth={1.8} /><span>{label}</span></Link>)}</nav>;
  return <div className="app-shell">
    <a className="skip-link" href="#main-content">Lewati ke konten</a>
    <aside className="sidebar">
      <Link className="sidebar-logo" href="/dashboard" aria-label="Azatech OrderHub, ke dashboard"><img src="/images/azatech-orderhub-logo.png" alt="" width="2170" height="725" /></Link>
      <Link className="btn sidebar-create" href="/orders?create=1"><Plus size={17} /><span>Buat pesanan</span></Link>
      <div className="sidebar-menu-label">Workspace</div>{links}
      <div className="sidebar-note"><span className="workspace-dot" />Operasional toko<small>Katalog, pelanggan, dan transaksi.</small></div>
      <div className="sidebar-footer"><div className="account-block"><span className="avatar">{initials}</span><span><strong>{user?.name ?? 'Akun admin'}</strong><small>Administrator</small></span></div><button className="logout-button" type="button" onClick={logout} disabled={loggingOut} aria-label="Keluar" title="Keluar dari akun"><LogOut size={18} /></button></div>
      {logoutError && <p className="error" role="alert">{logoutError}</p>}
    </aside>
    <div className="main-content"><header className="topbar"><button className="icon-action mobile-menu" aria-label="Buka navigasi" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={21} /></button><span className="breadcrumb">Workspace <span>/</span> <strong>{active?.label ?? 'Dashboard'}</strong></span><div className="topbar-actions"><Link className="topbar-action secondary" href="/products?create=1">Tambah produk</Link><Link className="topbar-action primary" href="/orders?create=1"><Plus size={15} />Buat pesanan</Link></div></header><main className="content-area" id="main-content" tabIndex={-1}>{children}</main></div>
    <Drawer open={menuOpen} onOpenChange={setMenuOpen} title="Workspace" description="Pilih halaman untuk mengelola toko." className="navigation-drawer">{links}<Link className="btn" href="/orders?create=1" onClick={() => setMenuOpen(false)}><Plus size={17} />Buat pesanan</Link><button className="btn btn-secondary" onClick={logout} disabled={loggingOut}><LogOut size={17} />Keluar</button>{logoutError && <p role="alert" className="error">{logoutError}</p>}</Drawer>
  </div>;
}
