'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { apiFetch, ApiResponse } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

type LoginData = { access_token: string; refresh_token: string };
export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError('');
    try {
      const result = await apiFetch<ApiResponse<LoginData>>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) });
      localStorage.setItem('access_token', result.data.access_token);
      localStorage.setItem('refresh_token', result.data.refresh_token);
      router.replace('/dashboard');
    } catch (err) { setError(err instanceof Error ? err.message : 'Tidak dapat terhubung. Coba lagi.'); }
    finally { setLoading(false); }
  }
  return <main className="login-page">
    <aside className="login-story">
     <div className="login-logo"><img src="/images/azatech-orderhub-logo.png" alt="Azatech OrderHub" width="217" height="72.5" /></div>
      <figure className="login-illustration-wrap">
        <img src="/images/order-status-login.svg" alt="Ilustrasi alur pesanan" width="800" height="655" />
      </figure>
      <div className="login-story-copy"><p className="eyebrow">Ruang kerja operasional</p><h2>Katalog rapi.<br />Pesanan terkendali.</h2><p>Dari katalog hingga transaksi, kelola kebutuhan toko dalam satu workspace.</p></div>
    </aside>
    <section className="login-form-side"><div className="login-card">
      <p className="eyebrow">Selamat datang kembali</p><h1>Masuk ke OrderHub</h1><p className="muted">Gunakan akun admin untuk membuka workspace toko.</p>
      <form className="form-grid" onSubmit={submit} aria-busy={loading}>
        <label className="field" htmlFor="email">Email<Input id="email" type="email" autoComplete="username" placeholder="nama@perusahaan.com" value={email} onChange={(e) => setEmail(e.target.value)} required /></label>
        <div className="field password-field"><label htmlFor="password">Password</label><div><Input id="password" autoComplete="current-password" type={showPassword ? 'text' : 'password'} placeholder="Masukkan password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /><button type="button" aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'} aria-pressed={showPassword} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></div></div>
        {error && <p className="error" role="alert">{error}</p>}
        <Button disabled={loading}>{loading ? 'Memeriksa akun…' : 'Masuk'}</Button>
      </form><p className="login-help">Belum punya akses atau lupa password?<br />Hubungi administrator toko Anda.</p>
    </div><small className="login-footer">Azatech · OrderHub workspace</small></section>
  </main>;
}
