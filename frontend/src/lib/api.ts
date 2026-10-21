const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export type ApiResponse<T> = { success: boolean; message: string; data: T; meta?: { page: number; per_page: number; total: number; total_pages: number } };

export class ApiError extends Error {
  constructor(message: string, public readonly errors?: Record<string, string[]>) {
    super(message);
    this.name = 'ApiError';
  }
}

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const request = (accessToken: string | null) => fetch(`${API_URL}${path}`, { ...options, headers: { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}), ...options.headers } });
  let response = await request(token);

  if (response.status === 401 && typeof window !== 'undefined' && token && !path.startsWith('/auth/')) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: refreshToken }) });
      if (refreshResponse.ok) {
        const refreshed = await refreshResponse.json() as { data?: { access_token?: string } };
        if (refreshed.data?.access_token) {
          localStorage.setItem('access_token', refreshed.data.access_token);
          response = await request(refreshed.data.access_token);
        }
      }
    }
  }

  if (response.status === 401 && typeof window !== 'undefined') { localStorage.removeItem('access_token'); localStorage.removeItem('refresh_token'); window.location.href = '/login'; }
  const body = (await response.json().catch(() => ({}))) as { message?: string; errors?: Record<string, string[]> };
  if (!response.ok) throw new ApiError(body.message ?? 'Terjadi kesalahan pada server', body.errors);
  return body as T;
}

export async function downloadFile(path: string, filename: string): Promise<void> {
  if (typeof window === 'undefined') return;
  const token = localStorage.getItem('access_token');
  const request = (accessToken: string | null) => fetch(`${API_URL}${path}`, {
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
  });
  let response = await request(token);
  if (response.status === 401 && token) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      const refreshResponse = await fetch(`${API_URL}/auth/refresh`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refresh_token: refreshToken }) });
      const refreshed = await refreshResponse.json().catch(() => ({})) as { data?: { access_token?: string } };
      if (refreshResponse.ok && refreshed.data?.access_token) {
        localStorage.setItem('access_token', refreshed.data.access_token);
        response = await request(refreshed.data.access_token);
      }
    }
  }
  if (response.status === 401) {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = '/login';
    return;
  }
  if (!response.ok) throw new ApiError('Export order gagal');
  const objectUrl = URL.createObjectURL(await response.blob());
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(objectUrl);
}

export function formatRupiah(value: string | number): string { return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Number(value)); }
export function formatDate(value: string): string { return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(value)); }
