import { useEffect, useState } from 'react';
import { User, Briefcase, Wallet, FileText, Save, Mail, Phone, MapPin, Calendar, Building2, Upload } from 'lucide-react';
import EmployeeLayout from '@/components/layouts/EmployeeLayout';
import Avatar from '@/components/ui/Avatar';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { updateMyProfile, getMyDocuments, addDocument, deleteDocument } from '@/services/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { DocumentRow } from '@/types';

export default function Profile() {
  const { employee, refreshEmployee } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState(employee?.phone || '');
  const [address, setAddress] = useState(employee?.address || '');
  const [saving, setSaving] = useState(false);
  const [docs, setDocs] = useState<DocumentRow[]>([]);
  const [docName, setDocName] = useState('');

  useEffect(() => {
    getMyDocuments().then(setDocs).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateMyProfile({ phone, address });
      await refreshEmployee();
      toast('Profile updated successfully', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddDoc = async () => {
    if (!docName.trim()) return;
    try {
      await addDocument(docName);
      setDocName('');
      setDocs(await getMyDocuments());
      toast('Document added', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to add document', 'error');
    }
  };

  const handleDeleteDoc = async (id: string) => {
    try {
      await deleteDocument(id);
      setDocs(await getMyDocuments());
      toast('Document removed', 'success');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to remove document', 'error');
    }
  };

  const netSalary = (employee?.basic_salary || 0) + (employee?.allowances || 0) - (employee?.deductions || 0);

  return (
    <EmployeeLayout title="My Profile" subtitle="View and manage your personal information">
      <div className="space-y-6">
        {/* Profile header */}
        <div className="card overflow-hidden">
          <div className="h-24 bg-ink" />
          <div className="px-6 pb-6">
            <div className="-mt-12 flex flex-col items-start gap-4 sm:flex-row sm:items-end">
              <Avatar name={employee?.full_name || 'User'} src={employee?.profile_picture} size="xl" className="ring-4 ring-white" />
              <div className="flex-1 pb-2">
                <h2 className="text-xl font-bold text-ink">{employee?.full_name}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted">
                  <span className="flex items-center gap-1.5"><Mail className="h-4 w-4" />{employee?.email}</span>
                  <span className="flex items-center gap-1.5"><Building2 className="h-4 w-4" />{employee?.department}</span>
                </div>
              </div>
              <Badge variant="fern" dot>{employee?.employment_status}</Badge>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Personal Information */}
          <div className="card p-5 lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-fern" />
              <h3 className="text-base font-semibold text-ink">Personal Information</h3>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-medium text-muted">Full Name</p>
                <p className="mt-1 text-sm font-medium text-ink">{employee?.full_name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted">Employee ID</p>
                <p className="mt-1 text-sm font-medium text-ink">{employee?.employee_id}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted">Email</p>
                <p className="mt-1 text-sm font-medium text-ink">{employee?.email}</p>
              </div>
              <div>
                <Input
                  label="Phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter your address"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button onClick={handleSave} loading={saving}>
                <Save className="h-4 w-4" />
                Save Changes
              </Button>
            </div>
          </div>

          {/* Job Information */}
          <div className="card p-5">
            <div className="mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-fern" />
              <h3 className="text-base font-semibold text-ink">Job Information</h3>
            </div>
            <div className="space-y-4">
              {[
                { label: 'Department', value: employee?.department, icon: Building2 },
                { label: 'Job Title', value: employee?.job_title, icon: Briefcase },
                { label: 'Joining Date', value: employee?.joining_date ? formatDate(employee.joining_date) : '-', icon: Calendar },
                { label: 'Status', value: employee?.employment_status, icon: User },
              ].map((item) => (
                <div key={item.label}>
                  <p className="flex items-center gap-1.5 text-xs font-medium text-muted">
                    <item.icon className="h-3.5 w-3.5" />
                    {item.label}
                  </p>
                  <p className="mt-1 text-sm font-medium text-ink">{item.value || '-'}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Salary Structure */}
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <Wallet className="h-5 w-5 text-fern" />
            <h3 className="text-base font-semibold text-ink">Salary Structure</h3>
            <Badge variant="gray" className="ml-auto">Read only</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { label: 'Basic Salary', value: employee?.basic_salary || 0, color: 'text-ink' },
              { label: 'Allowances', value: employee?.allowances || 0, color: 'text-fern' },
              { label: 'Deductions', value: employee?.deductions || 0, color: 'text-red-600' },
              { label: 'Net Salary', value: netSalary, color: 'text-fern-dark', bold: true },
            ].map((item) => (
              <div key={item.label} className="rounded-xl bg-cream p-4">
                <p className="text-xs font-medium text-muted">{item.label}</p>
                <p className={`mt-1 text-lg font-bold ${item.color} ${item.bold ? '' : ''}`}>
                  {formatCurrency(item.value)}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Documents */}
        <div className="card p-5">
          <div className="mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-fern" />
            <h3 className="text-base font-semibold text-ink">Documents</h3>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Add a document name (e.g. Employment Contract)"
              value={docName}
              onChange={(e) => setDocName(e.target.value)}
              className="flex-1"
            />
            <Button onClick={handleAddDoc}>
              <Upload className="h-4 w-4" />
              Add
            </Button>
          </div>
          {docs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileText className="mb-2 h-8 w-8 text-muted" />
              <p className="text-sm text-muted">No documents uploaded yet</p>
            </div>
          ) : (
            <div className="mt-4 space-y-2">
              {docs.map((doc) => (
                <div key={doc.id} className="flex items-center justify-between rounded-lg border border-border p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="h-4 w-4 text-fern" />
                    <div>
                      <p className="text-sm font-medium text-ink">{doc.document_name}</p>
                      <p className="text-xs text-muted">Added on {formatDate(doc.created_at)}</p>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => handleDeleteDoc(doc.id)} className="text-red-600 hover:bg-red-50">
                    Remove
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </EmployeeLayout>
  );
}
