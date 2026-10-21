import { HTMLAttributes, forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('card', className)} {...props} />
));
Card.displayName = 'Card';

export const CardHeader = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn('card-header', className)} {...props} />;
export const CardContent = ({ className, ...props }: HTMLAttributes<HTMLDivElement>) => <div className={cn('card-content', className)} {...props} />;
