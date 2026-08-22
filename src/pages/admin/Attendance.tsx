import { useEffect, useState } from 'react';
import { Clock, Calendar } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/ChartCard';
import { TableSkeleton } from '@/components/ui/Loader';
import { useToast } from '@/context/ToastContext';
import { getAllAttendance, getAttendanceByDate } from '@/services/api';
import { formatTime, formatDate, todayISO } from '@/lib/utils';
import type { Attendance, Employee } from '@/types';

export default function AdminAttendance() {
  const [records, setRecords] = useState<(Attendance & { employee?: Employee })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState(todayISO());
  const [viewAll, setViewAll] = useState(false);
  const { toast } = useToast();

  const loadData = async () => {
    setLoading(true);
    try {
      if (viewAll) {
        setRecords(await getAllAttendance());
      } else {
        setRecords(await getAttendanceByDate(dateFilter));
      }
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewAll, dateFilter]);

  return (
    <AdminLayout title="Attendance" subtitle="View attendance records for all employees">
      <div className="space-y-6">
        <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              onClick={() => setViewAll(false)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${!viewAll ? 'bg-fern text-white' : 'bg-cream text-muted hover:text-ink'}`}
            >
              Filter by Date
            </button>
            <button
              onClick={() => setViewAll(true)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${viewAll ? 'bg-fern text-white' : 'bg-cream text-muted hover:text-ink'}`}
            >
              View All
            </button>
          </div>
          {!viewAll && (
            <div className="w-full sm:w-48">
              <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
            </div>
          )}
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-5"><TableSkeleton rows={6} cols={5} /></div>
          ) : records.length === 0 ? (
            <EmptyState icon={Clock} title="No attendance records" message={viewAll ? "No attendance data available." : `No records for ${formatDate(dateFilter)}.`} />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-cream">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Employee</th>
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
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={rec.employee?.full_name || '?'} src={rec.employee?.profile_picture} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-ink">{rec.employee?.full_name}</p>
                            <p className="text-xs text-muted">{rec.employee?.employee_id}</p>
                          </div>
                        </div>
                      </td>
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
        </div>
      </div>
    </AdminLayout>
  );
}
