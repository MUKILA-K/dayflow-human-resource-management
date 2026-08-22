import { useEffect, useState } from 'react';
import { CalendarDays, Check, X, MessageSquare } from 'lucide-react';
import AdminLayout from '@/components/layouts/AdminLayout';
import Avatar from '@/components/ui/Avatar';
import { StatusBadge } from '@/components/ui/Badge';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/ChartCard';
import { TableSkeleton } from '@/components/ui/Loader';
import { useToast } from '@/context/ToastContext';
import { getAllLeaves, approveLeave, rejectLeave } from '@/services/api';
import { formatDate } from '@/lib/utils';
import type { Employee, LeaveRequest } from '@/types';

type LeaveWithEmployee = LeaveRequest & { employee?: Employee };

export default function AdminLeaves() {
  const [leaves, setLeaves] = useState<LeaveWithEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'Pending' | 'Approved' | 'Rejected'>('all');
  const [approveTarget, setApproveTarget] = useState<LeaveWithEmployee | null>(null);
  const [rejectTarget, setRejectTarget] = useState<LeaveWithEmployee | null>(null);
  const { toast } = useToast();

  const loadLeaves = async () => {
    try {
      setLeaves(await getAllLeaves());
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

  const handleApprove = async (comment: string) => {
    if (!approveTarget) return;
    try {
      await approveLeave(approveTarget.id, comment);
      toast('Leave approved successfully', 'success');
      await loadLeaves();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to approve', 'error');
    }
  };

  const handleReject = async (comment: string) => {
    if (!rejectTarget) return;
    try {
      await rejectLeave(rejectTarget.id, comment);
      toast('Leave rejected', 'success');
      await loadLeaves();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to reject', 'error');
    }
  };

  const filtered = filter === 'all' ? leaves : leaves.filter((l) => l.status === filter);
  const pendingCount = leaves.filter((l) => l.status === 'Pending').length;

  return (
    <AdminLayout title="Leave Requests" subtitle={pendingCount > 0 ? `${pendingCount} pending approval` : 'All requests reviewed'}>
      <div className="space-y-6">
        <div className="flex flex-wrap gap-2">
          {['all', 'Pending', 'Approved', 'Rejected'].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as typeof filter)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                filter === f ? 'bg-ink text-white' : 'bg-white border border-border text-muted hover:text-ink'
              }`}
            >
              {f === 'all' ? 'All Requests' : f}
              <span className="ml-2 text-xs">
                {f === 'all' ? leaves.length : leaves.filter((l) => l.status === f).length}
              </span>
            </button>
          ))}
        </div>

        <div className="card overflow-hidden">
          {loading ? (
            <div className="p-5"><TableSkeleton rows={5} cols={6} /></div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={CalendarDays} title="No leave requests" message="Leave requests will appear here when submitted." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-border bg-cream">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Employee</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">ID</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Type</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Dates</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Days</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Remarks</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Status</th>
                    <th className="px-5 py-3 text-left text-xs font-semibold text-muted">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.map((leave) => (
                    <tr key={leave.id} className="hover:bg-cream/50">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar name={leave.employee?.full_name || '?'} src={leave.employee?.profile_picture} size="sm" />
                          <span className="text-sm font-medium text-ink">{leave.employee?.full_name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm text-muted">{leave.employee?.employee_id}</td>
                      <td className="px-5 py-3 text-sm text-ink">{leave.leave_type}</td>
                      <td className="px-5 py-3 text-sm text-muted">{formatDate(leave.start_date)} → {formatDate(leave.end_date)}</td>
                      <td className="px-5 py-3 text-sm text-ink">{leave.days}</td>
                      <td className="px-5 py-3 text-sm text-muted max-w-xs truncate">{leave.remarks || '-'}</td>
                      <td className="px-5 py-3"><StatusBadge status={leave.status} /></td>
                      <td className="px-5 py-3">
                        {leave.status === 'Pending' ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => setApproveTarget(leave)}
                              className="rounded-lg p-1.5 text-fern transition-colors hover:bg-fern-light"
                              title="Approve"
                            >
                              <Check className="h-4.5 w-4.5" />
                            </button>
                            <button
                              onClick={() => setRejectTarget(leave)}
                              className="rounded-lg p-1.5 text-red-600 transition-colors hover:bg-red-50"
                              title="Reject"
                            >
                              <X className="h-4.5 w-4.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="text-xs text-muted">{leave.admin_comment ? 'Reviewed' : '-'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Approve dialog */}
        <ConfirmDialog
          open={!!approveTarget}
          onClose={() => setApproveTarget(null)}
          onConfirm={handleApprove}
          title="Approve Leave Request"
          message={`Approve ${approveTarget?.leave_type} leave for ${approveTarget?.employee?.full_name} (${approveTarget?.start_date} → ${approveTarget?.end_date})?`}
          confirmLabel="Approve Leave"
          variant="primary"
          commentLabel="Approval comment (optional)"
          commentPlaceholder="Add a comment for the employee..."
        />

        {/* Reject dialog */}
        <ConfirmDialog
          open={!!rejectTarget}
          onClose={() => setRejectTarget(null)}
          onConfirm={handleReject}
          title="Reject Leave Request"
          message={`Reject ${rejectTarget?.leave_type} leave for ${rejectTarget?.employee?.full_name} (${rejectTarget?.start_date} → ${rejectTarget?.end_date})?`}
          confirmLabel="Reject Leave"
          variant="danger"
          commentLabel="Rejection reason (optional)"
          commentPlaceholder="Provide a reason for rejection..."
        />
      </div>
    </AdminLayout>
  );
}
