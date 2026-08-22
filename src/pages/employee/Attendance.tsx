import { useEffect, useState } from 'react';
import { Clock, LogIn, LogOut, Calendar, TrendingUp } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/ChartCard';
import { TableSkeleton } from '@/components/ui/Loader';
import { useToast } from '@/context/ToastContext';
import { getMyAttendance, getTodayAttendance, checkIn, checkOut } from '@/services/api';
import { formatTime, formatDate, getWeekDates } from '@/lib/utils';
import type { Attendance } from '@/types';

export default function EmployeeAttendance() {
  const [records, setRecords] = useState<Attendance[]>([]);
  const [today, setToday] = useState<Attendance | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [view, setView] = useState<'daily' | 'weekly'>('daily');
  const { toast } = useToast();

  const loadData = async () => {
    try {
      const [recs, td] = await Promise.all([getMyAttendance(), getTodayAttendance()]);
      setRecords(recs);
      setToday(td);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCheckIn = async () => {
    setActionLoading(true);
    try {
      await checkIn();
      toast('Checked in successfully!', 'success');
      await loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Check-in failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    setActionLoading(true);
    try {
      await checkOut();
      toast('Checked out successfully!', 'success');
      await loadData();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Check-out failed', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const weekDates = getWeekDates();
  const weeklyData = weekDates.map((day) => {
    const rec = records.find((r) => r.date === day.date);
    return { ...day, record: rec };
  });

  const presentCount = records.filter((r) => r.status === 'Present').length;
  const halfDayCount = records.filter((r) => r.status === 'Half-day').length;
  const totalHours = records.reduce((sum, r) => sum + (r.working_hours || 0), 0);

  return (
    <EmployeeLayout title="My Attendance" subtitle="Track your daily check-ins and working hours">
      <div className="space-y-6">
        {/* Today's status */}
        <div className="card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-muted">Today's Status</p>
              <div className="mt-2 flex items-center gap-3">
                <StatusBadge status={today?.status || 'Not checked in'} />
                {today?.check_in && (
                  <span className="text-sm text-muted">
                    In: {formatTime(today.check_in)}
                    {today.check_out && ` / Out: ${formatTime(today.check_out)}`}
                  </span>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCheckIn} loading={actionLoading} disabled={!!today?.check_in}>
                <LogIn className="h-4 w-4" />
                Check In
              </Button>
              <Button onClick={handleCheckOut} loading={actionLoading} variant="dark" disabled={!today?.check_in || !!today?.check_out}>
                <LogOut className="h-4 w-4" />
                Check Out
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <StatCard title="Present Days" value={presentCount} icon={Clock} accent="fern" loading={loading} />
          <StatCard title="Half Days" value={halfDayCount} icon={Clock} accent="blue" loading={loading} />
          <StatCard title="Total Hours" value={totalHours.toFixed(1)} icon={TrendingUp} accent="dark" loading={loading} />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant={view === 'daily' ? 'primary' : 'secondary'} onClick={() => setView('daily')}>
            <Calendar className="h-4 w-4" />
            Daily View
          </Button>
          <Button size="sm" variant={view === 'weekly' ? 'primary' : 'secondary'} onClick={() => setView('weekly')}>
            <Calendar className="h-4 w-4" />
            Weekly View
          </Button>
        </div>

        {/* Records */}
        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-5"><TableSkeleton rows={5} cols={5} /></div>
          ) : view === 'daily' ? (
            <>
              {records.length === 0 ? (
                <EmptyState icon={Clock} title="No attendance records" message="Your check-in history will appear here." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="border-b border-border bg-cream">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Date</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Check In</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Check Out</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Hours</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {records.map((rec) => (
                        <tr key={rec.id} className="hover:bg-cream/50">
                          <td className="px-5 py-3 text-sm text-ink">{formatDate(rec.date)}</td>
                          <td className="px-5 py-3 text-sm text-ink">{rec.check_in ? formatTime(rec.check_in) : '-'}</td>
                          <td className="px-5 py-3 text-sm text-ink">{rec.check_out ? formatTime(rec.check_out) : '-'}</td>
                          <td className="px-5 py-3 text-sm text-ink">{rec.working_hours ? `${rec.working_hours}h` : '-'}</td>
                          <td className="px-5 py-3"><StatusBadge status={rec.status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <div className="p-5">
              <div className="grid grid-cols-7 gap-2">
                {weeklyData.map((day) => (
                  <div key={day.date} className="rounded-xl border border-border p-3 text-center">
                    <p className="text-xs font-semibold text-muted">{day.label}</p>
                    <p className="mt-1 text-xs text-muted">{formatDate(day.date, { day: 'numeric' })}</p>
                    <div className="mt-2">
                      {day.record ? (
                        <Badge variant={day.record.status === 'Present' ? 'fern' : day.record.status === 'Half-day' ? 'blue' : 'gray'} dot>
                          {day.record.status}
                        </Badge>
                      ) : (
                        <Badge variant="gray">-</Badge>
                      )}
                    </div>
                    {day.record?.check_in && (
                      <p className="mt-1.5 text-xs text-muted">{formatTime(day.record.check_in)}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}
