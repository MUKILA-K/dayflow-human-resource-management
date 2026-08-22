import { useEffect, useState } from 'react';
import { BarChart3, Calendar, FileText, Wallet, Download } from 'lucide-react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import AdminLayout from '@/components/layouts/AdminLayout';
import ChartCard, { EmptyState } from '@/components/ui/ChartCard';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Avatar from '@/components/ui/Avatar';
import { TableSkeleton } from '@/components/ui/Loader';
import { useToast } from '@/context/ToastContext';
import { getAllEmployees, getAllAttendance, getAllLeaves, getAllPayroll } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Employee, Attendance, LeaveRequest, Payroll } from '@/types';

export default function AdminReports() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [attendance, setAttendance] = useState<(Attendance & { employee?: Employee })[]>([]);
  const [leaves, setLeaves] = useState<(LeaveRequest & { employee?: Employee })[]>([]);
  const [payroll, setPayroll] = useState<(Payroll & { employee?: Employee })[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([getAllEmployees(), getAllAttendance(), getAllLeaves(), getAllPayroll()])
      .then(([emps, att, levs, pay]) => {
        setEmployees(emps);
        setAttendance(att);
        setLeaves(levs);
        setPayroll(pay);
      })
      .catch((err) => toast(err instanceof Error ? err.message : 'Failed to load reports', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Attendance report data
  const filteredAttendance = attendance.filter((a) => {
    if (dateFilter && a.date !== dateFilter) return false;
    if (statusFilter !== 'all' && a.status !== statusFilter) return false;
    return true;
  });

  const attendanceSummary = [
    { name: 'Present', count: attendance.filter((a) => a.status === 'Present').length, color: '#4F7942' },
    { name: 'Half-day', count: attendance.filter((a) => a.status === 'Half-day').length, color: '#3b82f6' },
    { name: 'Absent', count: attendance.filter((a) => a.status === 'Absent').length, color: '#ef4444' },
    { name: 'Leave', count: attendance.filter((a) => a.status === 'Leave').length, color: '#6B7280' },
  ];

  // Leave report data
  const leaveSummary = [
    { name: 'Total', count: leaves.length },
    { name: 'Pending', count: leaves.filter((l) => l.status === 'Pending').length },
    { name: 'Approved', count: leaves.filter((l) => l.status === 'Approved').length },
    { name: 'Rejected', count: leaves.filter((l) => l.status === 'Rejected').length },
  ];

  // Payroll report data
  const totalPayroll = payroll.reduce((sum, p) => sum + p.net_salary, 0);
  const avgSalary = payroll.length > 0 ? totalPayroll / payroll.length : 0;

  const salaryByDepartment = employees.reduce((acc, emp) => {
    const dept = emp.department || 'Unassigned';
    const net = emp.basic_salary + emp.allowances - emp.deductions;
    acc[dept] = (acc[dept] || 0) + net;
    return acc;
  }, {} as Record<string, number>);

  const salaryDistData = Object.entries(salaryByDepartment).map(([name, value]) => ({ name, value }));

  return (
    <AdminLayout title="Reports & Analytics" subtitle="Insights across attendance, leave, and payroll">
      <div className="space-y-6">
        {/* Attendance Report */}
        <ChartCard
          title="Attendance Report"
          subtitle="Breakdown by status"
          action={
            <div className="flex flex-wrap gap-2">
              <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="w-auto" />
              <select
                className="input-base w-auto"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="Present">Present</option>
                <option value="Half-day">Half-day</option>
                <option value="Absent">Absent</option>
                <option value="Leave">Leave</option>
              </select>
            </div>
          }
        >
          {loading ? (
            <TableSkeleton rows={3} cols={3} />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={attendanceSummary}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                    {attendanceSummary.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b border-border">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted">Employee</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted">Date</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted">Hours</th>
                      <th className="px-3 py-2 text-left text-xs font-semibold text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredAttendance.slice(0, 8).map((a) => (
                      <tr key={a.id}>
                        <td className="px-3 py-2 text-sm text-ink">{a.employee?.full_name}</td>
                        <td className="px-3 py-2 text-sm text-muted">{formatDate(a.date)}</td>
                        <td className="px-3 py-2 text-sm text-ink">{a.working_hours ? `${a.working_hours}h` : '-'}</td>
                        <td className="px-3 py-2 text-sm text-ink">{a.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </ChartCard>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Leave Report */}
          <ChartCard title="Leave Report" subtitle="Request distribution">
            {loading ? (
              <TableSkeleton rows={3} cols={2} />
            ) : leaves.length === 0 ? (
              <EmptyState icon={FileText} title="No leave data" message="Leave report will appear here." />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={leaveSummary}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#4F7942" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-4 gap-2">
                  {leaveSummary.map((s) => (
                    <div key={s.name} className="rounded-lg bg-cream p-3 text-center">
                      <p className="text-xs text-muted">{s.name}</p>
                      <p className="mt-1 text-lg font-bold text-ink">{s.count}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </ChartCard>

          {/* Payroll Report */}
          <ChartCard title="Payroll Report" subtitle={`Total: ${formatCurrency(totalPayroll)}`}>
            {loading ? (
              <TableSkeleton rows={3} cols={2} />
            ) : salaryDistData.length === 0 ? (
              <EmptyState icon={Wallet} title="No payroll data" message="Payroll report will appear here." />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={salaryDistData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis type="number" tick={{ fontSize: 12 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Bar dataKey="value" fill="#4F7942" radius={[0, 8, 8, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-4 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-cream p-3">
                    <p className="text-xs text-muted">Avg. Salary</p>
                    <p className="mt-1 text-sm font-bold text-ink">{formatCurrency(avgSalary)}</p>
                  </div>
                  <div className="rounded-lg bg-cream p-3">
                    <p className="text-xs text-muted">Total Employees</p>
                    <p className="mt-1 text-sm font-bold text-ink">{employees.length}</p>
                  </div>
                </div>
              </>
            )}
          </ChartCard>
        </div>

        {/* Salary Distribution Table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <h3 className="text-base font-semibold text-ink">Employee Salary Information</h3>
          </div>
          {loading ? (
            <div className="px-5 pb-5"><TableSkeleton rows={5} cols={5} /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-y border-border bg-cream">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Employee</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Department</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Basic</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Allowances</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Deductions</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Net Salary</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {employees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-cream/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={emp.full_name} src={emp.profile_picture} size="sm" />
                          <span className="text-sm font-medium text-ink">{emp.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted">{emp.department || '-'}</td>
                      <td className="px-5 py-3 text-sm text-ink">{formatCurrency(emp.basic_salary)}</td>
                      <td className="px-5 py-3 text-sm text-fern">{formatCurrency(emp.allowances)}</td>
                      <td className="px-5 py-3 text-sm text-red-600">-{formatCurrency(emp.deductions)}</td>
                      <td className="px-5 py-3 text-sm font-bold text-ink">{formatCurrency(emp.basic_salary + emp.allowances - emp.deductions)}</td>
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
