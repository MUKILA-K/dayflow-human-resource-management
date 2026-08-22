import { useEffect, useState } from 'react';
import { Wallet, Search, Pencil, Save } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/ChartCard';
import { TableSkeleton } from '@/components/ui/Loader';
import { useToast } from '@/context/ToastContext';
import { getAllEmployees, getAllPayroll, updatePayroll } from '@/services/api';
import { formatCurrency, currentMonthPeriod } from '@/lib/utils';
import { validateSalary } from '@/lib/validation';
import type { Employee, Payroll } from '@/types';

export default function AdminPayroll() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payroll, setPayroll] = useState<(Payroll & { employee?: Employee })[]>([]);
  const [filtered, setFiltered] = useState<(Payroll & { employee?: Employee })[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({ basicSalary: 0, allowances: 0, deductions: 0 });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    Promise.all([getAllEmployees(), getAllPayroll()])
      .then(([emps, pay]) => {
        setEmployees(emps);
        setPayroll(pay);
        setFiltered(pay);
      })
      .catch((err) => toast(err instanceof Error ? err.message : 'Failed to load payroll', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(payroll.filter((p) =>
      p.employee?.full_name?.toLowerCase().includes(q) || p.employee?.employee_id?.toLowerCase().includes(q)
    ));
  }, [search, payroll]);

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setEditForm({ basicSalary: emp.basic_salary, allowances: emp.allowances, deductions: emp.deductions });
    setErrors({});
  };

  const handleSave = async () => {
    if (!editing) return;
    const errs = {
      basicSalary: validateSalary(editForm.basicSalary, 'Basic salary'),
      allowances: validateSalary(editForm.allowances, 'Allowances'),
      deductions: validateSalary(editForm.deductions, 'Deductions'),
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;

    setSaving(true);
    try {
      await updatePayroll(editing.id, editForm.basicSalary, editForm.allowances, editForm.deductions);
      const updated = await getAllPayroll();
      setPayroll(updated);
      toast('Payroll updated successfully', 'success');
      setEditing(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update payroll', 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalPayroll = payroll.reduce((sum, p) => sum + p.net_salary, 0);

  return (
    <AdminLayout title="Payroll Management" subtitle="View and update salary structures">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card p-5">
            <p className="text-sm text-muted">Total Monthly Payroll</p>
            <p className="mt-2 text-2xl font-bold text-fern-dark">{formatCurrency(totalPayroll)}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-muted">Total Employees</p>
            <p className="mt-2 text-2xl font-bold text-ink">{employees.length}</p>
          </div>
          <div className="card p-5">
            <p className="text-sm text-muted">Avg. Net Salary</p>
            <p className="mt-2 text-2xl font-bold text-ink">
              {payroll.length > 0 ? formatCurrency(totalPayroll / payroll.length) : '-'}
            </p>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 p-5">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
              <Input
                placeholder="Search employee..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="px-5 pb-5"><TableSkeleton rows={5} cols={5} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Wallet} title="No payroll records" message="Payroll data will appear here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-y border-border bg-cream">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Employee</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Period</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Basic</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Allowances</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Deductions</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Net</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-cream/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={p.employee?.full_name || '?'} src={p.employee?.profile_picture} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-ink">{p.employee?.full_name}</p>
                            <p className="text-xs text-muted">{p.employee?.employee_id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-ink">{p.salary_period}</td>
                      <td className="px-5 py-3 text-sm text-ink">{formatCurrency(p.basic_salary)}</td>
                      <td className="px-5 py-3 text-sm text-fern">{formatCurrency(p.allowances)}</td>
                      <td className="px-5 py-3 text-sm text-red-600">-{formatCurrency(p.deductions)}</td>
                      <td className="px-5 py-3 text-sm font-bold text-ink">{formatCurrency(p.net_salary)}</td>
                      <td className="px-5 py-3">
                        <Button size="sm" variant="ghost" onClick={() => p.employee && openEdit(p.employee)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit payroll modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Update Salary Structure"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}><Save className="h-4 w-4" /> Save</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-lg bg-cream p-3">
            <Avatar name={editing?.full_name || '?'} src={editing?.profile_picture} size="md" />
            <div>
              <p className="text-sm font-medium text-ink">{editing?.full_name}</p>
              <p className="text-xs text-muted">{editing?.employee_id} • {editing?.job_title}</p>
            </div>
          </div>
          <Input
            label="Basic Salary"
            type="number"
            min={0}
            value={editForm.basicSalary}
            onChange={(e) => setEditForm({ ...editForm, basicSalary: Number(e.target.value) })}
            error={errors.basicSalary}
          />
          <Input
            label="Allowances"
            type="number"
            min={0}
            value={editForm.allowances}
            onChange={(e) => setEditForm({ ...editForm, allowances: Number(e.target.value) })}
            error={errors.allowances}
          />
          <Input
            label="Deductions"
            type="number"
            min={0}
            value={editForm.deductions}
            onChange={(e) => setEditForm({ ...editForm, deductions: Number(e.target.value) })}
            error={errors.deductions}
          />
          <div className="rounded-lg bg-ink p-4 text-white">
            <div className="flex justify-between">
              <span className="text-sm text-white/60">Net Salary</span>
              <span className="text-lg font-bold text-fern">
                {formatCurrency(editForm.basicSalary + editForm.allowances - editForm.deductions)}
              </span>
            </div>
          </div>
        </div>
      </Modal>
    </AdminLayout>
  );
}
