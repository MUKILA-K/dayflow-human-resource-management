import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

type BadgeVariant = 'fern' | 'dark' | 'gray' | 'amber' | 'red' | 'blue';

interface BadgeProps {
  variant?: BadgeVariant;
  children: ReactNode;
  className?: string;
  dot?: boolean;
}

const variants: Record<BadgeVariant, string> = {
  fern: 'bg-fern-light text-fern-dark',
  dark: 'bg-ink text-white',
  gray: 'bg-gray-100 text-gray-700',
  amber: 'bg-amber-100 text-amber-700',
  red: 'bg-red-100 text-red-700',
  blue: 'bg-blue-100 text-blue-700',
};

const dotColors: Record<BadgeVariant, string> = {
  fern: 'bg-fern',
  dark: 'bg-white',
  gray: 'bg-gray-400',
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  blue: 'bg-blue-500',
};

export default function Badge({ variant = 'gray', children, className, dot }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold', variants[variant], className)}>
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[variant])} />}
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeVariant> = {
    Pending: 'amber',
    Approved: 'fern',
    Rejected: 'red',
    Present: 'fern',
    Absent: 'red',
    'Half-day': 'blue',
    Leave: 'gray',
    Active: 'fern',
  };
  return (
    <Badge variant={map[status] || 'gray'} dot>
      {status}
    </Badge>
  );
}
