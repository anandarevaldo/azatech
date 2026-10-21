'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  perPage: number;
  onPageChange: (page: number) => void;
  noun: string;
};

export function Pagination({ page, totalPages, total, perPage, onPageChange, noun }: PaginationProps) {
  const first = total === 0 ? 0 : (page - 1) * perPage + 1;
  const last = Math.min(page * perPage, total);
  const start = Math.max(1, Math.min(page - 2, Math.max(1, totalPages - 4)));
  const pages = Array.from({ length: Math.min(totalPages, 5) }, (_, index) => start + index);

  return <div className="pagination">
    <span>Menampilkan {first}–{last} dari {total} {noun}</span>
    <div className="pagination-controls">
      <button type="button" aria-label="Halaman sebelumnya" onClick={() => onPageChange(page - 1)} disabled={page <= 1}><ChevronLeft size={16} /></button>
      {pages.map((number) => <button type="button" key={number} className={number === page ? 'active' : ''} aria-label={`Halaman ${number}`} aria-current={number === page ? 'page' : undefined} onClick={() => onPageChange(number)}>{number}</button>)}
      <button type="button" aria-label="Halaman berikutnya" onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}><ChevronRight size={16} /></button>
    </div>
  </div>;
}
