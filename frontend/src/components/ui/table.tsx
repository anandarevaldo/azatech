import { HTMLAttributes, TableHTMLAttributes } from 'react';
import { cn } from '../../lib/utils';

export function Table({ className, ...props }: TableHTMLAttributes<HTMLTableElement>) { return <table className={cn('data-table', className)} {...props} />; }
export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) { return <thead className={cn(className)} {...props} />; }
export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) { return <tbody className={cn(className)} {...props} />; }
export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>) { return <tr className={cn(className)} {...props} />; }
