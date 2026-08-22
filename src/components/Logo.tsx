import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'light' | 'dark';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function Logo({ variant = 'light', size = 'md', className }: LogoProps) {
  const textColors = {
    light: 'text-white',
    dark: 'text-ink',
  };
  const sizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-3xl',
  };
  const iconSizes = {
    sm: 'h-7 w-7',
    md: 'h-9 w-9',
    lg: 'h-12 w-12',
  };
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className={cn('flex items-center justify-center rounded-xl bg-fern', iconSizes[size])}>
        <svg viewBox="0 0 24 24" fill="none" className="h-1/2 w-1/2 text-white">
          <path d="M12 3c-1.5 2.5-4 4-4 7.5 0 3 2 5 4 5s4-2 4-5c0-3.5-2.5-5-4-7.5z" fill="currentColor"/>
          <circle cx="12" cy="17" r="1.5" fill="#0A0A0A"/>
        </svg>
      </div>
      <div className={cn('font-bold tracking-tight', textColors[variant], sizes[size])}>
        DAY<span className="text-fern">FLOW</span>
      </div>
    </div>
  );
}
