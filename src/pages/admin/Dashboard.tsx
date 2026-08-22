import { useEffect, useState } from 'react';
import { Users, UserCheck, CalendarDays, Clock, TrendingUp, Wallet, ArrowUpRight } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
} from 'recharts';
import AdminLayout from '@/components/layouts/AdminLayout';
import StatCard from '@/components/ui/StatCard';
import ChartCard, { EmptyState } from '@/components/ui/ChartCard';
import { TableSkeleton } from '@/components/ui/Loader';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import { useToast } from '@/context/ToastContext';
import { getAllEmployees, getAllLeaves, getAllAttendance, getAllPayroll, getAttendanceByDate, getMyNotifications } from '@/services/api';
import { todayISO, formatCurrency } from '@/lib/utils';
import type { Employee, LeaveRequest, Attendance, Payroll } from '@/types';

export default function AdminDashboard() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [leaves, setLeaves] = useState<(LeaveRequest & { employee?: Employee })[]>([]);
  const [todayAttendance, setTodayAttendance] = useState<(Attendance & { employee?: Employee })[]>([]);
  const [payroll, setPayroll] = useState<(Payroll & { employee?: Employee })[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([
      getAllEmployees(),
      getAllLeaves(),
      getAttendanceByDate(todayISO()),
      getAllPayroll(),
    ])
      .then(([emps, levs, att, pay]) => {
        setEmployees(emps);
        setLeaves(levs);
        setTodayAttendance(att);
        setPayroll(pay);
      })
      .catch((err) => toast(err instanceof Error ? err.message : 'Failed to load dashboard', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const presentToday = todayAttendance.filter((a) => a.status === 'Present' || a.status === 'Half-day').length;
  const onLeave = leaves.filter(
    (l) => l.status === 'Approved' && l.start_date <= todayISO() && l.end_date >= todayISO()
  ).length;
  const pendingLeaves = leaves.filter((l) => l.status === 'Pending').length;
  const totalPayroll = payroll.reduce((sum, p) => sum + p.net_salary, 0);

  const attendanceData = [
    { name: 'Present', value: presentToday, color: '#4F7942' },
    { name: 'Absent', value: employees.length - presentToday - onLeave, color: '#ef4444' },
    { name: 'On Leave', value: onLeave, color: '#6B7280' },
  ].filter((d) => d.value > 0);

  const leaveData = [
    { name: 'Pending', count: leaves.filter((l) => l.status === 'Pending').length },
    { name: 'Approved', count: leaves.filter((l) => l.status === 'Approved').length },
    { name: 'Rejected', count: leaves.filter((l) => l.status === 'Rejected').length },
  ];

  const recentEmployees = employees.slice(0, 4);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Stat cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Total Employees" value={employees.length} icon={Users} accent="fern" loading={loading} />
          <StatCard title="Present Today" value={presentToday} icon={UserCheck} accent="dark" loading={loading} />
          <StatCard title="On Leave" value={onLeave} icon={CalendarDays} accent="amber" loading={loading} />
          <StatCard title="Pending Leave Requests" value={pendingLeaves} icon={Clock} accent="blue" loading={loading} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <ChartCard title="Attendance Overview" subtitle="Today's workforce status">
            {loading ? (
              <div className="h-64 flex items-center justify-center"><TableSkeleton rows={2} cols={2} /></div>
            ) : attendanceData.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No data" message="Attendance data will appear here." />
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="50%" height={200}>
                  <PieChart>
                    <Pie data={attendanceData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}>
                      {attendanceData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {attendanceData.map((d) => (
                    <div key={d.name} className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: d.color }} />
                      <span className="text-sm text-ink">{d.name}</span>
                      <span className="ml-auto text-sm font-semibold text-ink">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </ChartCard>

          <ChartCard title="Leave Requests" subtitle="Request status distribution">
            {loading ? (
              <div className="h-64 flex items-center justify-center"><TableSkeleton rows={2} cols={2} /></div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={leaveData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#4F7942" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </ChartCard>
        </div>

        {/* Recent leave requests */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <h3 className="text-base font-semibold text-ink">Recent Leave Requests</h3>
          </div>
          {loading ? (
            <div className="px-5 pb-5"><TableSkeleton rows={3} cols={5} /></div>
          ) : leaves.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No leave requests" message="Leave requests will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-y border-border bg-cream">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Employee</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Leave Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Dates</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Days</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaves.slice(0, 5).map((leave) => (
                    <tr key={leave.id} className="hover:bg-cream/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={leave.employee?.full_name || '?'} src={leave.employee?.profile_picture} size="sm" />
                          <span className="text-sm font-medium text-ink">{leave.employee?.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-ink">{leave.leave_type}</td>
                      <td className="px-5 py-3 text-sm text-muted">{leave.start_date} → {leave.end_date}</td>
                      <td className="px-5 py-3 text-sm text-ink">{leave.days}</td>
                      <td className="px-5 py-3"><StatusBadge status={leave.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Employee & Payroll overview */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="card p-5">
            <h3 className="mb-4 text-base font-semibold text-ink">Employee Overview</h3>
            {loading ? (
              <TableSkeleton rows={3} cols={2} />
            ) : recentEmployees.length === 0 ? (
              <EmptyState icon={Users} title="No employees" message="Recently added employees will appear here." />
            ) : (
              <div className="space-y-3">
                {recentEmployees.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-3">
                    <Avatar name={emp.full_name} src={emp.profile_picture} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-ink truncate">{emp.full_name}</p>
                      <p className="text-xs text-muted truncate">{emp.job_title} • {emp.department}</p>
                    </div>
                    <Badge variant={emp.employment_status === 'Active' ? 'fern' : 'gray'} dot>{emp.employment_status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-fern" />
              <h3 className="text-base font-semibold text-ink">Payroll Overview</h3>
            </div>
            <div className="mt-4 rounded-xl bg-ink p-5 text-white">
              <p className="text-sm text-white/60">Total Monthly Payroll</p>
              <p className="mt-2 text-3xl font-bold text-fern">{formatCurrency(totalPayroll)}</p>
              <div className="mt-4 flex items-center gap-2 text-sm text-white/60">
                <ArrowUpRight className="h-4 w-4 text-fern" />
                {payroll.length} payroll records
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-cream p-4">
                <p className="text-xs text-muted">Avg. Net Salary</p>
                <p className="mt-1 text-lg font-bold text-ink">
                  {payroll.length > 0 ? formatCurrency(totalPayroll / payroll.length) : '-'}
                </p>
              </div>
              <div className="rounded-lg bg-cream p-4">
                <p className="text-xs text-muted">Total Employees</p>
                <p className="mt-1 text-lg font-bold text-ink">{employees.length}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
