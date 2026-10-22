import type { Metadata } from 'next';
import './globals.css';
import './workspace.css';

export const metadata: Metadata = { title: 'Azatech Order Management', description: 'Sistem online shop untuk pengelolaan produk dan transaksi.' };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}
