import { supabase, EDGE_FUNCTION_URL } from '@/lib/supabase';
import type { Attendance, Employee, LeaveRequest, Notification, Payroll, UserRole } from '@/types';
import { todayISO, currentMonthPeriod, daysBetween } from '@/lib/utils';

// ============================================================
// AUTH
// ============================================================

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message);
  return data;
}

export async function signUpInitiate(employeeId: string, email: string, role: UserRole) {
  const res = await fetch(`${EDGE_FUNCTION_URL}/hrms-auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ employeeId, email, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Signup failed');
  return data;
}

export async function verifyEmail(email: string, code: string, password: string, employeeId: string, role: UserRole) {
  const res = await fetch(`${EDGE_FUNCTION_URL}/hrms-auth/verify-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code, password, employeeId, role }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Verification failed');
  return data;
}

// ============================================================
// EMPLOYEES
// ============================================================

export async function getMyEmployee(): Promise<Employee | null> {
  const { data, error } = await supabase
    .from('employees')
    .select('*')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Employee | null;
}

export async function getEmployeeById(id: string): Promise<Employee | null> {
  const { data, error } = await supabase.from('employees').select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(error.message);
  return data as Employee | null;
}

export async function getAllEmployees(): Promise<Employee[]> {
  const { data, error } = await supabase.from('employees').select('*').order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Employee[];
}

export async function updateMyProfile(updates: Partial<Pick<Employee, 'phone' | 'address' | 'profile_picture'>>): Promise<void> {
  const { error } = await supabase
    .from('employees')
    .update(updates)
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id);
  if (error) throw new Error(error.message);
}

export async function adminUpdateEmployee(employeeId: string, updates: Partial<Employee>): Promise<void> {
  const res = await fetch(`${EDGE_FUNCTION_URL}/hrms-admin/update-employee`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ employeeId, updates }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update employee');
}

// ============================================================
// ATTENDANCE
// ============================================================

export async function getMyAttendance(): Promise<Attendance[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { data: emp } = await supabase.from('employees').select('id').eq('user_id', userId).maybeSingle();
  if (!emp) return [];
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', emp.id)
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Attendance[];
}

export async function getTodayAttendance(): Promise<Attendance | null> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { data: emp } = await supabase.from('employees').select('id').eq('user_id', userId).maybeSingle();
  if (!emp) return null;
  const { data, error } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', emp.id)
    .eq('date', todayISO())
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data as Attendance | null;
}

export async function checkIn(): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { data: emp } = await supabase.from('employees').select('id').eq('user_id', userId).maybeSingle();
  if (!emp) throw new Error('Employee record not found');

  // Check if already checked in today
  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', emp.id)
    .eq('date', todayISO())
    .maybeSingle();
  if (existing) throw new Error('You have already checked in today');

  const now = new Date().toISOString();
  const { error } = await supabase.from('attendance').insert({
    employee_id: emp.id,
    date: todayISO(),
    check_in: now,
    status: 'Present',
  });
  if (error) throw new Error(error.message);
}

export async function checkOut(): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { data: emp } = await supabase.from('employees').select('id').eq('user_id', userId).maybeSingle();
  if (!emp) throw new Error('Employee record not found');

  const { data: existing } = await supabase
    .from('attendance')
    .select('*')
    .eq('employee_id', emp.id)
    .eq('date', todayISO())
    .maybeSingle();
  if (!existing) throw new Error('You must check in first');
  if (existing.check_out) throw new Error('You have already checked out today');

  const now = new Date();
  const checkInTime = new Date(existing.check_in);
  const hours = Math.round(((now.getTime() - checkInTime.getTime()) / (1000 * 60 * 60)) * 100) / 100;
  const status = hours >= 8 ? 'Present' : hours >= 4 ? 'Half-day' : 'Present';

  const { error } = await supabase
    .from('attendance')
    .update({
      check_out: now.toISOString(),
      working_hours: hours,
      status,
    })
    .eq('id', existing.id);
  if (error) throw new Error(error.message);
}

export async function getAllAttendance(): Promise<(Attendance & { employee?: Employee })[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, employee:employees(*)')
    .order('date', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as (Attendance & { employee?: Employee })[];
}

export async function getAttendanceByDate(date: string): Promise<(Attendance & { employee?: Employee })[]> {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, employee:employees(*)')
    .eq('date', date)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as (Attendance & { employee?: Employee })[];
}

// ============================================================
// LEAVE REQUESTS
// ============================================================

export async function getMyLeaves(): Promise<LeaveRequest[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { data: emp } = await supabase.from('employees').select('id').eq('user_id', userId).maybeSingle();
  if (!emp) return [];
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*')
    .eq('employee_id', emp.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as LeaveRequest[];
}

export async function getAllLeaves(): Promise<(LeaveRequest & { employee?: Employee })[]> {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*, employee:employees(*)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as (LeaveRequest & { employee?: Employee })[];
}

export async function applyLeave(
  leaveType: string,
  startDate: string,
  endDate: string,
  remarks: string
): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { data: emp } = await supabase.from('employees').select('id').eq('user_id', userId).maybeSingle();
  if (!emp) throw new Error('Employee record not found');

  if (new Date(endDate) < new Date(startDate)) {
    throw new Error('End date cannot be before start date');
  }

  const days = daysBetween(startDate, endDate);
  const { error } = await supabase.from('leave_requests').insert({
    employee_id: emp.id,
    leave_type: leaveType,
    start_date: startDate,
    end_date: endDate,
    days,
    remarks,
    status: 'Pending',
  });
  if (error) throw new Error(error.message);

  // Notify all HR users
  const { data: hrUsers } = await supabase
    .from('employees')
    .select('user_id')
    .like('employee_id', 'HR%');
  if (hrUsers && hrUsers.length > 0) {
    const notifications = hrUsers.map((hr) => ({
      user_id: hr.user_id,
      title: 'New Leave Request',
      message: `A new ${leaveType} leave request has been submitted.`,
    }));
    await supabase.from('notifications').insert(notifications);
  }
}

export async function approveLeave(leaveId: string, comment: string): Promise<void> {
  const res = await fetch(`${EDGE_FUNCTION_URL}/hrms-admin/approve-leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ leaveId, comment }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to approve leave');
}

export async function rejectLeave(leaveId: string, comment: string): Promise<void> {
  const res = await fetch(`${EDGE_FUNCTION_URL}/hrms-admin/reject-leave`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ leaveId, comment }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to reject leave');
}

// ============================================================
// PAYROLL
// ============================================================

export async function getMyPayroll(): Promise<Payroll[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { data: emp } = await supabase.from('employees').select('id').eq('user_id', userId).maybeSingle();
  if (!emp) return [];
  const { data, error } = await supabase
    .from('payroll')
    .select('*')
    .eq('employee_id', emp.id)
    .order('salary_period', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Payroll[];
}

export async function getAllPayroll(): Promise<(Payroll & { employee?: Employee })[]> {
  const { data, error } = await supabase
    .from('payroll')
    .select('*, employee:employees(*)')
    .order('salary_period', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as (Payroll & { employee?: Employee })[];
}

export async function updatePayroll(
  employeeId: string,
  basicSalary: number,
  allowances: number,
  deductions: number,
  salaryPeriod?: string
): Promise<void> {
  const period = salaryPeriod || currentMonthPeriod();
  const res = await fetch(`${EDGE_FUNCTION_URL}/hrms-admin/update-payroll`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
    },
    body: JSON.stringify({ employeeId, basicSalary, allowances, deductions, salaryPeriod: period }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Failed to update payroll');
}

// ============================================================
// NOTIFICATIONS
// ============================================================

export async function getMyNotifications(): Promise<Notification[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as Notification[];
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await supabase.from('notifications').update({ is_read: true }).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  if (!userId) return;
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);
  if (error) throw new Error(error.message);
}

// ============================================================
// DOCUMENTS
// ============================================================

export async function getMyDocuments(): Promise<import('@/types').DocumentRow[]> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { data: emp } = await supabase.from('employees').select('id').eq('user_id', userId).maybeSingle();
  if (!emp) return [];
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('employee_id', emp.id)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data || []) as import('@/types').DocumentRow[];
}

export async function addDocument(name: string, url?: string): Promise<void> {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  const { data: emp } = await supabase.from('employees').select('id').eq('user_id', userId).maybeSingle();
  if (!emp) throw new Error('Employee record not found');
  const { error } = await supabase.from('documents').insert({
    employee_id: emp.id,
    document_name: name,
    document_url: url || null,
  });
  if (error) throw new Error(error.message);
}

export async function deleteDocument(id: string): Promise<void> {
  const { error } = await supabase.from('documents').delete().eq('id', id);
  if (error) throw new Error(error.message);
}
