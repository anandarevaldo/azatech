'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import type { ReactNode } from 'react';

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
};

export function Drawer({ open, onOpenChange, title, description, children, className = '' }: DrawerProps) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="drawer-overlay" />
      <Dialog.Content className={`drawer-content ${className}`}>
        <div className="drawer-header">
          <div><Dialog.Title>{title}</Dialog.Title>{description && <Dialog.Description>{description}</Dialog.Description>}</div>
          <Dialog.Close className="icon-action" aria-label="Tutup panel"><X size={18} /></Dialog.Close>
        </div>
        <div className="drawer-body">{children}</div>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
