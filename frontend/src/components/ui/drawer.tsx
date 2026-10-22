'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { X } from 'lucide-react';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import gsap from 'gsap';

type DrawerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  modal?: boolean;
  allowOutsideInteraction?: boolean;
};

function PanelMotion({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const ctx = gsap.context(() => { gsap.from(ref.current, { opacity: 0, y: 10, duration: .22, ease: 'power2.out' }); }, ref);
    return () => ctx.revert();
  }, []);
  return <div ref={ref} className="drawer-body">{children}</div>;
}

export function Drawer({ open, onOpenChange, title, description, children, className = '', modal = false, allowOutsideInteraction = true }: DrawerProps) {
  return <Dialog.Root open={open} onOpenChange={onOpenChange}>
    <Dialog.Portal>
      <Dialog.Overlay className="drawer-overlay" />
      <Dialog.Content className={`drawer-content ${modal ? 'confirmation-modal' : ''} ${className}`} onInteractOutside={(event) => { if (modal || !allowOutsideInteraction) event.preventDefault(); }}>
        <div className="drawer-header">
          <div><Dialog.Title>{title}</Dialog.Title>{description && <Dialog.Description>{description}</Dialog.Description>}</div>
          <Dialog.Close className="icon-action" aria-label="Tutup panel"><X size={18} /></Dialog.Close>
        </div>
        <PanelMotion>{children}</PanelMotion>
      </Dialog.Content>
    </Dialog.Portal>
  </Dialog.Root>;
}
