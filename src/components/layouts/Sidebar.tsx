import { type NavLinkItem } from './AppLayout';
import { cn } from '@/lib/utils';
import Logo from '@/components/Logo';
import { X } from 'lucide-react';

interface SidebarProps {
  items: NavLinkItem[];
  activePath: string;
  onNavigate: () => void;
  mobileOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ items, activePath, onNavigate, mobileOpen, onClose }: SidebarProps) {
  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-ink/40 backdrop-blur-sm lg:hidden" onClick={onClose} />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-ink transition-transform duration-300 lg:static lg:translate-x-0',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-16 items-center justify-between px-6">
          <Logo variant="light" size="sm" />
          <button onClick={onClose} className="text-white/60 hover:text-white lg:hidden" aria-label="Close sidebar">
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {items.map((item) => {
            const active = activePath === item.path || activePath.startsWith(item.path + '/');
            return (
              <button
                key={item.path}
                onClick={onNavigate}
                className={cn(
                  'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                  active ? 'bg-fern text-white' : 'text-white/60 hover:bg-white/10 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={cn(
                    'ml-auto rounded-full px-2 py-0.5 text-xs font-bold',
                    active ? 'bg-white text-fern' : 'bg-fern text-white'
                  )}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="px-6 py-4">
          <p className="text-xs text-white/40">Live in flow</p>
          <p className="mt-1 text-xs text-white/30">Dayflow HRMS &copy; 2026</p>
        </div>
      </aside>
    </>
  );
}
