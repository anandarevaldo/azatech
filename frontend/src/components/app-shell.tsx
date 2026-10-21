'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Boxes, ClipboardList, LayoutDashboard, LogOut, Package, Search, UsersRound } from 'lucide-react';
import { ReactNode, useEffect, useState } from 'react';

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
  useEffect(() => { if (!localStorage.getItem('access_token')) router.replace('/login'); else setReady(true); }, [router]);
  function logout() { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); router.replace('/login'); }
  if (!ready) return <main className="centered">Memuat workspace…</main>;

  const active = navigation.find((item) => item.href === pathname || (pathname === '/' && item.href === '/dashboard'));
  return <div className="app-shell">
    <aside className="sidebar">
      <Link className="brand" href="/dashboard"><span className="brand-mark"><Boxes size={19} strokeWidth={2.2} /></span><span><strong>Azatech</strong><small>Order management</small></span></Link>
      <div className="sidebar-menu-label">Menu</div>
      <nav aria-label="Navigasi utama">{navigation.map(({ href, label, Icon }) => <Link key={href} href={href} className={active?.href === href ? 'nav-link active' : 'nav-link'} aria-current={active?.href === href ? 'page' : undefined}><Icon size={17} strokeWidth={1.8} /><span>{label}</span></Link>)}</nav>
      <div className="sidebar-footer"><div className="account-block"><span className="avatar">AZ</span><span><strong>Admin AZA</strong><small>Administrator</small></span></div><button className="logout-button" type="button" onClick={logout} aria-label="Keluar"><LogOut size={17} /></button></div>
    </aside>
    <main className="main-content" id="main-content"><header className="topbar"><strong className="topbar-title">{active?.label ?? 'Workspace'}</strong><form className="search-box" action="/products" method="get"><Search size={16} aria-hidden="true" /><input name="search" aria-label="Cari produk" placeholder="Cari produk…" /><kbd>Enter</kbd></form><span className="topbar-avatar">AZ</span></header><div className="content-area">{children}</div></main>
  </div>;
}
