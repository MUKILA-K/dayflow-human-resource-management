import { useEffect, useState } from 'react';
import { CalendarDays, Plus, CheckCircle2, XCircle, Clock } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Select from '@/components/ui/Select';
import Input from '@/components/ui/Input';
import Badge, { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/ChartCard';
import { TableSkeleton } from '@/components/ui/Loader';
import { useToast } from '@/context/ToastContext';
import { getMyLeaves, applyLeave } from '@/services/api';
import { validateDateRange } from '@/lib/validation';
import { formatDate, daysBetween } from '@/lib/utils';
import type { LeaveRequest } from '@/types';

export default function Leave() {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ leaveType: '', startDate: '', endDate: '', remarks: '' });
  const [errors, setErrors] = useState<Record<string, string | null>>({});
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  const loadLeaves = async () => {
    try {
      setLeaves(await getMyLeaves());
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to load leaves', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleApply = async () => {
    const dateErr = validateDateRange(form.startDate, form.endDate);
    const typeErr = form.leaveType ? null : 'Please select a leave type';
    setErrors({ leaveType: typeErr, dateRange: dateErr });
    if (dateErr || typeErr) return;

    setSubmitting(true);
    try {
      await applyLeave(form.leaveType, form.startDate, form.endDate, form.remarks);
      toast('Leave request submitted!', 'success');
      setForm({ leaveType: '', startDate: '', endDate: '', remarks: '' });
      setModalOpen(false);
      await loadLeaves();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to submit leave', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const pending = leaves.filter((l) => l.status === 'Pending').length;
  const approved = leaves.filter((l) => l.status === 'Approved').length;
  const rejected = leaves.filter((l) => l.status === 'Rejected').length;

  return (
    <EmployeeLayout title="Leave & Time Off" subtitle="Manage your leave requests and time off">
      <div className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="card flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div><p className="text-xs text-muted">Pending</p><p className="text-xl font-bold text-ink">{pending}</p></div>
          </div>
          <div className="card flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-fern-light"><CheckCircle2 className="h-5 w-5 text-fern-dark" /></div>
            <div><p className="text-xs text-muted">Approved</p><p className="text-xl font-bold text-ink">{approved}</p></div>
          </div>
          <div className="card flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100"><XCircle className="h-5 w-5 text-red-600" /></div>
            <div><p className="text-xs text-muted">Rejected</p><p className="text-xl font-bold text-ink">{rejected}</p></div>
          </div>
        </div>

        {/* Apply button + table */}
        <div className="card overflow-hidden">
          <div className="flex items-center justify-between p-5">
            <h3 className="text-base font-semibold text-ink">Leave History</h3>
            <Button onClick={() => setModalOpen(true)}>
              <Plus className="h-4 w-4" />
              Apply for Leave
            </Button>
          </div>
          {loading ? (
            <div className="px-5 pb-5"><TableSkeleton rows={4} cols={5} /></div>
          ) : leaves.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No leave requests found" message="Click 'Apply for Leave' to submit a new request." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-y border-border bg-cream">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Leave Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Start Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">End Date</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Days</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Remarks</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaves.map((leave) => (
                    <tr key={leave.id} className="hover:bg-cream/50">
                      <td className="px-5 py-3 text-sm font-medium text-ink">{leave.leave_type}</td>
                      <td className="px-5 py-3 text-sm text-ink">{formatDate(leave.start_date)}</td>
                      <td className="px-5 py-3 text-sm text-ink">{formatDate(leave.end_date)}</td>
                      <td className="px-5 py-3 text-sm text-ink">{leave.days}</td>
                      <td className="px-5 py-3 text-sm text-muted max-w-xs truncate">{leave.remarks || '-'}</td>
                      <td className="px-5 py-3"><StatusBadge status={leave.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Apply leave modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Apply for Leave"
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleApply} loading={submitting}>Submit Request</Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Leave Type"
            value={form.leaveType}
            onChange={(e) => setForm({ ...form, leaveType: e.target.value })}
            placeholder="Select leave type"
            options={[
              { value: 'Paid', label: 'Paid Leave' },
              { value: 'Sick', label: 'Sick Leave' },
              { value: 'Unpaid', label: 'Unpaid Leave' },
            ]}
            error={errors.leaveType}
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Start Date"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="End Date"
              type="date"
              value={form.endDate}
              min={form.startDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
              error={errors.dateRange}
            />
          </div>
          {form.startDate && form.endDate && (
            <div className="rounded-lg bg-fern-light p-3 text-sm text-fern-dark">
              Duration: {daysBetween(form.startDate, form.endDate)} {daysBetween(form.startDate, form.endDate) === 1 ? 'day' : 'days'}
            </div>
          )}
          <Input
            label="Remarks"
            placeholder="Add remarks (optional)"
            value={form.remarks}
            onChange={(e) => setForm({ ...form, remarks: e.target.value })}
          />
        </div>
      </Modal>
    </EmployeeLayout>
  );
}
