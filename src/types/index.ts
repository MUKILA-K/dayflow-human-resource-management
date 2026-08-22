export type UserRole = 'employee' | 'hr';

export interface Employee {
  id: string;
  user_id: string;
  employee_id: string;
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  profile_picture: string | null;
  department: string | null;
  job_title: string | null;
  joining_date: string | null;
  employment_status: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  created_at: string;
  updated_at: string;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  working_hours: number | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  remarks: string | null;
  status: string;
  admin_comment: string | null;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface Payroll {
  id: string;
  employee_id: string;
  salary_period: string;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  created_at: string;
  updated_at: string;
  employee?: Employee;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface DocumentRow {
  id: string;
  employee_id: string;
  document_name: string;
  document_url: string | null;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  employeeId?: string;
}
