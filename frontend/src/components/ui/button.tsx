import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'default' | 'secondary' | 'danger' | 'ghost';

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }>(
  ({ className, variant = 'default', ...props }, ref) => (
    <button ref={ref} className={cn('btn', variant !== 'default' && `btn-${variant}`, className)} {...props} />
  ),
);
Button.displayName = 'Button';
