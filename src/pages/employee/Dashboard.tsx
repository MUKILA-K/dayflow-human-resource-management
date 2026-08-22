import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, LogIn, LogOut, CalendarDays, User, Wallet, Bell, CheckCircle2 } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';
import StatCard from '@/components/ui/StatCard';
import Button from '@/components/ui/Button';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import {
  getTodayAttendance,
  getMyLeaves,
  getMyPayroll,
  getMyNotifications,
  checkIn,
  checkOut,
} from '@/services/api';
import type { Attendance, LeaveRequest, Payroll, Notification } from '@/types';
import { formatTime, formatCurrency } from '@/lib/utils';

export default function EmployeeDashboard() {
  const [todayAttendance, setTodayAttendance] = useState<Attendance | null>(null);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const { employee } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const loadData = async () => {
    try {
      const [att, lv, pay, notifs] = await Promise.all([
        getTodayAttendance(),
        getMyLeaves(),
        getMyPayroll(),
        getMyNotifications(),
      ]);
      setTodayAttendance(att);
      setLeaves(lv);
      setPayroll(pay);
      setNotifications(notifs);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load data', 'error');
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

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const approvedLeaves = leaves.filter((l) => l.status === 'Approved').length;
  const unreadNotifs = notifications.filter((n) => !n.is_read).length;
  const latestPayroll = payroll[0];
  const netSalary = (employee?.basic_salary || 0) + (employee?.allowances || 0) - (employee?.deductions || 0);

  return (
    <EmployeeLayout>
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Today's Attendance"
            value={todayAttendance?.status || 'Not checked in'}
            icon={Clock}
            accent={todayAttendance?.check_in ? 'fern' : 'dark'}
            subtitle={
              todayAttendance?.check_in
                ? `In: ${formatTime(todayAttendance.check_in)}${
                    todayAttendance.check_out ? ` / Out: ${formatTime(todayAttendance.check_out)}` : ''
                  }`
                : 'Click Check In to start your day'
            }
            loading={loading}
          />
          <StatCard
            title="Leave Status"
            value={pendingLeaves > 0 ? `${pendingLeaves} Pending` : `${approvedLeaves} Approved`}
            icon={CalendarDays}
            accent={pendingLeaves > 0 ? 'amber' : 'fern'}
            subtitle={`${pendingLeaves} pending, ${approvedLeaves} approved`}
            loading={loading}
          />
          <StatCard
            title="Payroll"
            value={formatCurrency(netSalary)}
            icon={Wallet}
            accent="fern"
            subtitle={latestPayroll ? `Latest: ${latestPayroll.salary_period}` : 'Current salary'}
            loading={loading}
          />
          <StatCard
            title="Notifications"
            value={unreadNotifs}
            icon={Bell}
            accent={unreadNotifs > 0 ? 'amber' : 'dark'}
            subtitle={unreadNotifs > 0 ? `${unreadNotifs} unread` : "You're all caught up"}
            loading={loading}
          />
        </div>

        {/* Quick Actions */}
        <div className="card p-5">
          <h3 className="mb-4 text-base font-semibold text-ink">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Button
              onClick={handleCheckIn}
              loading={actionLoading}
              disabled={!!todayAttendance?.check_in}
              variant={todayAttendance?.check_in ? 'secondary' : 'primary'}
              className="h-auto flex-col gap-2 py-4"
            >
              <LogIn className="h-5 w-5" />
              Check In
            </Button>
            <Button
              onClick={handleCheckOut}
              loading={actionLoading}
              disabled={!todayAttendance?.check_in || !!todayAttendance?.check_out}
              variant={todayAttendance?.check_out ? 'secondary' : 'dark'}
              className="h-auto flex-col gap-2 py-4"
            >
              <LogOut className="h-5 w-5" />
              Check Out
            </Button>
            <Button onClick={() => navigate('/employee/leave')} variant="secondary" className="h-auto flex-col gap-2 py-4">
              <CalendarDays className="h-5 w-5" />
              Apply Leave
            </Button>
            <Button onClick={() => navigate('/employee/profile')} variant="secondary" className="h-auto flex-col gap-2 py-4">
              <User className="h-5 w-5" />
              View Profile
            </Button>
          </div>
        </div>

        {/* Recent activity */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Recent Leave Requests</h3>
              <Button size="sm" variant="ghost" onClick={() => navigate('/employee/leave')}>
                View all
              </Button>
            </div>
            {leaves.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-center">
                <div>
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8 text-muted" />
                  <p className="text-sm text-muted">No leave requests yet</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {leaves.slice(0, 3).map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                    <div>
                      <p className="text-sm font-medium text-ink">{leave.leave_type} Leave</p>
                      <p className="text-xs text-muted">
                        {leave.start_date} to {leave.end_date} ({leave.days} {leave.days === 1 ? 'day' : 'days'})
                      </p>
                    </div>
                    <StatusBadge status={leave.status} />
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-base font-semibold text-ink">Recent Notifications</h3>
              <Button size="sm" variant="ghost" onClick={() => navigate('/employee/notifications')}>
                View all
              </Button>
            </div>
            {notifications.length === 0 ? (
              <div className="flex items-center justify-center py-8 text-center">
                <div>
                  <Bell className="mx-auto mb-2 h-8 w-8 text-muted" />
                  <p className="text-sm text-muted">You're all caught up</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {notifications.slice(0, 3).map((notif) => (
                  <div key={notif.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                    <div className={`mt-1 h-2 w-2 shrink-0 rounded-full ${notif.is_read ? 'bg-gray-300' : 'bg-fern'}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-ink">{notif.title}</p>
                      <p className="mt-0.5 text-xs text-muted line-clamp-2">{notif.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
