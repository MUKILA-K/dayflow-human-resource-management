import { type ReactNode, useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import type { LucideIcon } from 'lucide-react';
import { Bell, Menu, LogOut, Search } from 'lucide-react';
import Sidebar from './Sidebar';
import Avatar from '@/components/ui/Avatar';
import { useAuth } from '@/context/AuthContext';
import { getMyNotifications } from '@/services/api';
import { getGreeting } from '@/lib/utils';

export interface NavLinkItem {
  path: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

interface AppLayoutProps {
  items: NavLinkItem[];
  children: ReactNode;
  title: string;
  subtitle?: string;
}

export default function AppLayout({ items, children, title, subtitle }: AppLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { employee, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    getMyNotifications().then((notifs) => {
      setUnreadCount(notifs.filter((n) => !n.is_read).length);
    }).catch(() => {});
    const interval = setInterval(() => {
      getMyNotifications().then((notifs) => {
        setUnreadCount(notifs.filter((n) => !n.is_read).length);
      }).catch(() => {});
    }, 30000);
    return () => clearInterval(interval);
  }, [location.pathname]);

  const itemsWithBadge = items.map((item) =>
    item.path.includes('notifications') ? { ...item, badge: unreadCount } : item
  );

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const notificationsPath = items.find((i) => i.path.includes('notifications'))?.path;

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar
        items={itemsWithBadge}
        activePath={location.pathname}
        onNavigate={() => setMobileOpen(false)}
        mobileOpen={mobileOpen}
        onClose={() => setMobileOpen(false)}
      />
      <div className="flex flex-1 flex-col lg:pl-0">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-4 border-b border-border bg-white/80 px-4 backdrop-blur-md lg:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="rounded-lg p-2 text-muted hover:bg-cream hover:text-ink lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold text-ink">{title}</h2>
            {subtitle && <p className="truncate text-sm text-muted">{subtitle}</p>}
          </div>
          {notificationsPath && (
            <button
              onClick={() => navigate(notificationsPath)}
              className="relative rounded-lg p-2 text-muted transition-colors hover:bg-cream hover:text-ink"
              aria-label="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-fern px-1 text-xs font-bold text-white">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-ink">{employee?.full_name || 'User'}</p>
              <p className="text-xs text-muted">{employee?.job_title || employee?.employee_id}</p>
            </div>
            <Avatar name={employee?.full_name || 'User'} src={employee?.profile_picture} size="md" />
            <button
              onClick={handleSignOut}
              className="rounded-lg p-2 text-muted transition-colors hover:bg-red-50 hover:text-red-600"
              aria-label="Sign out"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
