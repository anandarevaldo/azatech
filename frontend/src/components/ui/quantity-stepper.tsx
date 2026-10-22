'use client';

import { Minus, Plus } from 'lucide-react';

type QuantityStepperProps = {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  label?: string;
};

export function QuantityStepper({ value, min = 1, max, onChange, label = 'Jumlah' }: QuantityStepperProps) {
  const atMinimum = value <= min;
  const atMaximum = max !== undefined && value >= max;
  return <div className="quantity-control" aria-label={`${label}: ${value}`}>
    <button type="button" aria-label={`Kurangi ${label.toLowerCase()}`} disabled={atMinimum} onClick={() => onChange(Math.max(min, value - 1))}><Minus size={15} /></button>
    <output>{value}</output>
    <button type="button" aria-label={`Tambah ${label.toLowerCase()}`} disabled={atMaximum} onClick={() => onChange(max === undefined ? value + 1 : Math.min(max, value + 1))}><Plus size={15} /></button>
  </div>;
}
