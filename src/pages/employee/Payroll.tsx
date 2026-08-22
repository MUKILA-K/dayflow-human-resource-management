import { useEffect, useState } from 'react';
import { Wallet, Printer } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';
import Badge from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/ChartCard';
import { TableSkeleton } from '@/components/ui/Loader';
import Button from '@/components/ui/Button';
import { useAuth } from '@/context/AuthContext';
import { getMyPayroll } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Payroll } from '@/types';

export default function EmployeePayroll() {
  const [payroll, setPayroll] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Payroll | null>(null);
  const { employee } = useAuth();

  useEffect(() => {
    getMyPayroll()
      .then((data) => {
        setPayroll(data);
        if (data.length > 0) setSelected(data[0]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <EmployeeLayout title="My Payroll" subtitle="View your salary details and payslips">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Payslip */}
          <div className="card p-5 lg:col-span-2">
            {loading ? (
              <div className="py-12"><TableSkeleton rows={4} cols={2} /></div>
            ) : selected ? (
              <div>
                <div className="flex items-start justify-between border-b border-border pb-4">
                  <div>
                    <h3 className="text-lg font-bold text-ink">Salary Slip</h3>
                    <p className="text-sm text-muted">Period: {selected.salary_period}</p>
                  </div>
                  <Badge variant="fern" dot>Paid</Badge>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs font-medium text-muted">Employee</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{employee?.full_name}</p>
                    <p className="text-xs text-muted">{employee?.employee_id}</p>
                    <p className="text-xs text-muted">{employee?.department}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium text-muted">Pay Date</p>
                    <p className="mt-1 text-sm font-semibold text-ink">{formatDate(selected.created_at)}</p>
                  </div>
                </div>
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between rounded-lg bg-cream px-4 py-3">
                    <span className="text-sm text-muted">Basic Salary</span>
                    <span className="text-sm font-semibold text-ink">{formatCurrency(selected.basic_salary)}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-cream px-4 py-3">
                    <span className="text-sm text-muted">Allowances</span>
                    <span className="text-sm font-semibold text-fern">{formatCurrency(selected.allowances)}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-cream px-4 py-3">
                    <span className="text-sm text-muted">Deductions</span>
                    <span className="text-sm font-semibold text-red-600">-{formatCurrency(selected.deductions)}</span>
                  </div>
                  <div className="flex justify-between rounded-lg bg-ink px-4 py-3">
                    <span className="text-sm font-semibold text-white">Net Salary</span>
                    <span className="text-sm font-bold text-fern">{formatCurrency(selected.net_salary)}</span>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-2">
                  <Button variant="secondary" onClick={() => window.print()}>
                    <Printer className="h-4 w-4" />
                    Print
                  </Button>
                </div>
              </div>
            ) : (
              <EmptyState icon={Wallet} title="No payroll records" message="Your payslips will appear here once processed." />
            )}
          </div>

          {/* History */}
          <div className="card p-5">
            <h3 className="mb-4 text-base font-semibold text-ink">Pay History</h3>
            {loading ? (
              <TableSkeleton rows={3} cols={1} />
            ) : payroll.length === 0 ? (
              <p className="text-sm text-muted">No payroll history available.</p>
            ) : (
              <div className="space-y-2">
                {payroll.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setSelected(p)}
                    className={`flex w-full items-center justify-between rounded-lg border p-3 text-left transition-all ${
                      selected?.id === p.id ? 'border-fern bg-fern-light' : 'border-border hover:bg-cream'
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-ink">{p.salary_period}</p>
                      <p className="text-xs text-muted">{formatDate(p.created_at)}</p>
                    </div>
                    <span className="text-sm font-semibold text-ink">{formatCurrency(p.net_salary)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </EmployeeLayout>
  );
}
