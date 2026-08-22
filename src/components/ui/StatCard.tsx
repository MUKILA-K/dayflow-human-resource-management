import { type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
  accent?: 'fern' | 'dark' | 'amber' | 'blue';
  loading?: boolean;
}

export default function StatCard({ title, value, icon: Icon, subtitle, accent = 'fern', loading }: StatCardProps) {
  const accents = {
    fern: 'bg-fern-light text-fern-dark',
    dark: 'bg-ink text-white',
    amber: 'bg-amber-100 text-amber-600',
    blue: 'bg-blue-100 text-blue-600',
  };
  return (
    <div className="card p-5 transition-shadow hover:shadow-card-hover">
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-muted">{title}</p>
          {loading ? (
            <div className="skeleton mt-2 h-8 w-24" />
          ) : (
            <p className="mt-2 text-3xl font-bold text-ink">{value}</p>
          )}
          {subtitle && <p className="mt-1.5 text-xs text-muted">{subtitle}</p>}
        </div>
        <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-xl', accents[accent])}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}
