'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, ApiResponse } from '../../lib/api';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

type LoginData = { access_token: string; refresh_token: string };
export default function LoginPage() {
  const router = useRouter(); const [email, setEmail] = useState('admin@azatech.id'); const [password, setPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setLoading(true); setError(''); try { const result = await apiFetch<ApiResponse<LoginData>>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); localStorage.setItem('access_token', result.data.access_token); localStorage.setItem('refresh_token', result.data.refresh_token); router.replace('/dashboard'); } catch (err) { setError(err instanceof Error ? err.message : 'Login gagal'); } finally { setLoading(false); } }
  return <main className="login-page"><section className="login-card"><div className="brand"><span className="brand-mark">A</span><span>Azatech</span></div><h1>Masuk ke OrderHub</h1><p className="muted">Kelola order, katalog, dan stok dari satu workspace.</p><form className="form-grid" onSubmit={submit}><label className="field">Email<Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></label><label className="field password-field">Password<div><Input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? 'Sembunyikan' : 'Lihat'}</button></div></label>{error && <p className="error">{error}</p>}<Button disabled={loading}>{loading ? 'Memproses...' : 'Masuk'}</Button></form></section></main>;
}
