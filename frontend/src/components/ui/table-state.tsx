import { SearchX, CircleAlert, RotateCcw } from 'lucide-react';
import { Button } from './button';

export function TableState({ loading, empty, error, onRetry, onReset }: { loading: boolean; empty: boolean; error?: string; onRetry: () => void; onReset: () => void }) {
  if (loading) return <div className="table-skeleton" role="status" aria-label="Memuat data">{Array.from({ length: 5 }, (_, i) => <div key={i}><span /><span /><span /></div>)}</div>;
  if (error) return <div className="empty-state" role="alert"><CircleAlert /><h3>Data belum dapat dimuat</h3><p>{error}</p><Button variant="secondary" onClick={onRetry}><RotateCcw size={16} />Coba lagi</Button></div>;
  if (empty) return <div className="empty-state"><SearchX /><h3>Belum ada hasil</h3><p>Coba kata kunci lain atau reset filter. Gunakan tombol tambah di atas untuk membuat data baru.</p><Button variant="secondary" onClick={onReset}>Reset pencarian & filter</Button></div>;
  return null;
}
