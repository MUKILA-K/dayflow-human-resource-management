import { useEffect, useState } from 'react';
import { Bell, CheckCheck, BellOff } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';
import Button from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/ChartCard';
import { useToast } from '@/context/ToastContext';
import { getMyNotifications, markNotificationRead, markAllNotificationsRead } from '@/services/api';
import { formatDateTime } from '@/lib/utils';
import type { Notification } from '@/types';

export default function EmployeeNotifications() {
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const load = async () => {
    try {
      setNotifs(await getMyNotifications());
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load notifications', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await markAllNotificationsRead();
      await load();
      toast('All notifications marked as read', 'success');
    } catch (err) {
      toast('Failed to mark notifications', 'error');
    }
  };

  const handleClick = async (n: Notification) => {
    if (!n.is_read) {
      await markNotificationRead(n.id);
      await load();
    }
  };

  const unreadCount = notifs.filter((n) => !n.is_read).length;

  return (
    <EmployeeLayout title="Notifications" subtitle={unreadCount > 0 ? `${unreadCount} unread notifications` : "You're all caught up"}>
      <div className="space-y-4">
        <div className="flex justify-end">
          {unreadCount > 0 && (
            <Button variant="secondary" size="sm" onClick={handleMarkAllRead}>
              <CheckCheck className="h-4 w-4" />
              Mark all as read
            </Button>
          )}
        </div>

        <div className="card">
          {loading ? (
            <div className="p-5 space-y-3">
              {[1, 2, 3].map((i) => <div key={i} className="skeleton h-16 w-full" />)}
            </div>
          ) : notifs.length === 0 ? (
            <EmptyState icon={BellOff} title="No notifications" message="You're all caught up. New notifications will appear here." />
          ) : (
            <div className="divide-y divide-border">
              {notifs.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleClick(n)}
                  className={`flex w-full items-start gap-4 p-4 text-left transition-colors hover:bg-cream/50 ${
                    !n.is_read ? 'bg-fern-light/30' : ''
                  }`}
                >
                  <div className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${n.is_read ? 'bg-gray-300' : 'bg-fern'}`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-ink">{n.title}</p>
                      <span className="text-xs text-muted shrink-0">{formatDateTime(n.created_at)}</span>
                    </div>
                    <p className="mt-1 text-sm text-muted">{n.message}</p>
                  </div>
                  {!n.is_read && <span className="mt-2 text-xs font-medium text-fern">New</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}
