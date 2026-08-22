import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Eye, Pencil, X } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import Avatar from '@/components/ui/Avatar';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { EmptyState } from '@/components/ui/ChartCard';
import { TableSkeleton } from '@/components/ui/Loader';
import { useToast } from '@/context/ToastContext';
import { getAllEmployees, adminUpdateEmployee } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Employee } from '@/types';

export default function AdminEmployees() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filtered, setFiltered] = useState<Employee[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Employee | null>(null);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [editForm, setEditForm] = useState({ department: '', job_title: '', employment_status: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    getAllEmployees()
      .then((data) => { setEmployees(data); setFiltered(data); })
      .catch((err) => toast(err instanceof Error ? err.message : 'Failed to load employees', 'error'))
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(employees.filter((e) =>
      e.full_name.toLowerCase().includes(q) ||
      e.employee_id.toLowerCase().includes(q) ||
      e.email.toLowerCase().includes(q)
    ));
  }, [search, employees]);

  const openEdit = (emp: Employee) => {
    setEditing(emp);
    setEditForm({
      department: emp.department || '',
      job_title: emp.job_title || '',
      employment_status: emp.employment_status,
      phone: emp.phone || '',
      address: emp.address || '',
    });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await adminUpdateEmployee(editing.id, editForm);
      const updated = await getAllEmployees();
      setEmployees(updated);
      toast('Employee updated successfully', 'success');
      setEditing(null);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminLayout title="Employees" subtitle="Manage your workforce">
      <div className="space-y-6">
        <div className="card overflow-hidden">
          <div className="flex items-center gap-3 p-5">
            <div className="relative flex-1 max-w-sm">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-muted" />
              <Input
                placeholder="Search by name, ID, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <p className="text-sm text-muted">{filtered.length} {filtered.length === 1 ? 'employee' : 'employees'}</p>
          </div>

          {loading ? (
            <div className="px-5 pb-5"><TableSkeleton rows={6} cols={5} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Users} title="No employees found" message="Try adjusting your search." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-y border-border bg-cream">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Employee</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Employee ID</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Department</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Job Title</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Email</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((emp) => (
                    <tr key={emp.id} className="hover:bg-cream/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={emp.full_name} src={emp.profile_picture} size="sm" />
                          <span className="text-sm font-medium text-ink">{emp.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-ink">{emp.employee_id}</td>
                      <td className="px-5 py-3 text-sm text-ink">{emp.department || '-'}</td>
                      <td className="px-5 py-3 text-sm text-ink">{emp.job_title || '-'}</td>
                      <td className="px-5 py-3 text-sm text-muted">{emp.email}</td>
                      <td className="px-5 py-3"><Badge variant={emp.employment_status === 'Active' ? 'fern' : 'gray'} dot>{emp.employment_status}</Badge></td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setSelected(emp)}><Eye className="h-4 w-4" /></Button>
                          <Button size="sm" variant="ghost" onClick={() => openEdit(emp)}><Pencil className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* View modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Employee Details" size="lg">
        {selected && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <Avatar name={selected.full_name} src={selected.profile_picture} size="lg" />
              <div>
                <h3 className="text-lg font-bold text-ink">{selected.full_name}</h3>
                <p className="text-sm text-muted">{selected.job_title} • {selected.department}</p>
                <Badge variant={selected.employment_status === 'Active' ? 'fern' : 'gray'} dot className="mt-1">{selected.employment_status}</Badge>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Employee ID', value: selected.employee_id },
                { label: 'Email', value: selected.email },
                { label: 'Phone', value: selected.phone || '-' },
                { label: 'Joining Date', value: selected.joining_date ? formatDate(selected.joining_date) : '-' },
                { label: 'Basic Salary', value: formatCurrency(selected.basic_salary) },
                { label: 'Allowances', value: formatCurrency(selected.allowances) },
                { label: 'Deductions', value: formatCurrency(selected.deductions) },
                { label: 'Net Salary', value: formatCurrency(selected.basic_salary + selected.allowances - selected.deductions) },
              ].map((item) => (
                <div key={item.label} className="rounded-lg bg-cream p-3">
                  <p className="text-xs text-muted">{item.label}</p>
                  <p className="mt-1 text-sm font-semibold text-ink">{item.value}</p>
                </div>
              ))}
            </div>
            {selected.address && (
              <div className="rounded-lg bg-cream p-3">
                <p className="text-xs text-muted">Address</p>
                <p className="mt-1 text-sm text-ink">{selected.address}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="Edit Employee"
        footer={
          <>
            <Button variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save Changes</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input label="Department" value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })} />
          <Input label="Job Title" value={editForm.job_title} onChange={(e) => setEditForm({ ...editForm, job_title: e.target.value })} />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-ink">Employment Status</label>
            <select
              className="input-base"
              value={editForm.employment_status}
              onChange={(e) => setEditForm({ ...editForm, employment_status: e.target.value })}
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
          <Input label="Phone" value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
          <Input label="Address" value={editForm.address} onChange={(e) => setEditForm({ ...editForm, address: e.target.value })} />
        </div>
      </Modal>
    </AdminLayout>
  );
}
