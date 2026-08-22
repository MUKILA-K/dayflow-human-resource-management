/*
# Dayflow HRMS - Core Schema

Creates the full HRMS schema with role-based access control.

## Tables
- `employees` — employee profiles linked to auth.users (full_name, department, job_title, salary structure, etc.)
- `attendance` — daily check-in/check-out records with working hours and status
- `leave_requests` — leave applications with type, date range, status, admin comments
- `payroll` — monthly salary records per employee (basic, allowances, deductions, net)
- `notifications` — user-facing notifications with read/unread state
- `documents` — employee document references

## Security
- RLS enabled on every table.
- Employees can CRUD only their own rows.
- HR role can read all rows and perform admin actions (approve/reject leaves, update payroll, manage employees).
- Role stored in `raw_app_meta_data` (user-immutable), set at signup.
*/

-- ============================================================
-- EMPLOYEES
-- ============================================================
CREATE TABLE IF NOT EXISTS employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL UNIQUE,
  phone text,
  address text,
  profile_picture text,
  department text,
  job_title text,
  joining_date date,
  employment_status text NOT NULL DEFAULT 'Active',
  basic_salary numeric(12,2) NOT NULL DEFAULT 0,
  allowances numeric(12,2) NOT NULL DEFAULT 0,
  deductions numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_employees_user_id ON employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_employee_id ON employees(employee_id);

ALTER TABLE employees ENABLE ROW LEVEL SECURITY;

-- Employees: read/update own profile; HR: read all, update all
DROP POLICY IF EXISTS "emp_select_own_or_all" ON employees;
CREATE POLICY "emp_select_own_or_all" ON employees FOR SELECT
  TO authenticated USING (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role') = 'hr')
  );

DROP POLICY IF EXISTS "emp_insert_self" ON employees;
CREATE POLICY "emp_insert_self" ON employees FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "emp_update_own" ON employees;
CREATE POLICY "emp_update_own" ON employees FOR UPDATE
  TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "hr_update_employees" ON employees;
CREATE POLICY "hr_update_employees" ON employees FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role') = 'hr')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role') = 'hr')
  );

-- ============================================================
-- ATTENDANCE
-- ============================================================
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  date date NOT NULL,
  check_in timestamptz,
  check_out timestamptz,
  working_hours numeric(5,2),
  status text NOT NULL DEFAULT 'Absent',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_employee_id ON attendance(employee_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "att_select_own_or_all" ON attendance;
CREATE POLICY "att_select_own_or_all" ON attendance FOR SELECT
  TO authenticated USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role') = 'hr')
  );

DROP POLICY IF EXISTS "att_insert_own" ON attendance;
CREATE POLICY "att_insert_own" ON attendance FOR INSERT
  TO authenticated WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "att_update_own" ON attendance;
CREATE POLICY "att_update_own" ON attendance FOR UPDATE
  TO authenticated USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  )
  WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- ============================================================
-- LEAVE REQUESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS leave_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  days integer NOT NULL,
  remarks text,
  status text NOT NULL DEFAULT 'Pending',
  admin_comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leave_employee_id ON leave_requests(employee_id);
CREATE INDEX IF NOT EXISTS idx_leave_status ON leave_requests(status);

ALTER TABLE leave_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "leave_select_own_or_all" ON leave_requests;
CREATE POLICY "leave_select_own_or_all" ON leave_requests FOR SELECT
  TO authenticated USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role') = 'hr')
  );

DROP POLICY IF EXISTS "leave_insert_own" ON leave_requests;
CREATE POLICY "leave_insert_own" ON leave_requests FOR INSERT
  TO authenticated WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "hr_update_leave" ON leave_requests;
CREATE POLICY "hr_update_leave" ON leave_requests FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role') = 'hr')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role') = 'hr')
  );

-- ============================================================
-- PAYROLL
-- ============================================================
CREATE TABLE IF NOT EXISTS payroll (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  salary_period text NOT NULL,
  basic_salary numeric(12,2) NOT NULL DEFAULT 0,
  allowances numeric(12,2) NOT NULL DEFAULT 0,
  deductions numeric(12,2) NOT NULL DEFAULT 0,
  net_salary numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(employee_id, salary_period)
);

CREATE INDEX IF NOT EXISTS idx_payroll_employee_id ON payroll(employee_id);

ALTER TABLE payroll ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pay_select_own_or_all" ON payroll;
CREATE POLICY "pay_select_own_or_all" ON payroll FOR SELECT
  TO authenticated USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role') = 'hr')
  );

DROP POLICY IF EXISTS "pay_insert_hr" ON payroll;
CREATE POLICY "pay_insert_hr" ON payroll FOR INSERT
  TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role') = 'hr')
  );

DROP POLICY IF EXISTS "pay_update_hr" ON payroll;
CREATE POLICY "pay_update_hr" ON payroll FOR UPDATE
  TO authenticated USING (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role') = 'hr')
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role') = 'hr')
  );

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "notif_select_own" ON notifications;
CREATE POLICY "notif_select_own" ON notifications FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notif_insert_own_or_hr" ON notifications;
CREATE POLICY "notif_insert_own_or_hr" ON notifications FOR INSERT
  TO authenticated WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role') = 'hr')
  );

DROP POLICY IF EXISTS "notif_update_own" ON notifications;
CREATE POLICY "notif_update_own" ON notifications FOR UPDATE
  TO authenticated USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- DOCUMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_documents_employee_id ON documents(employee_id);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doc_select_own_or_all" ON documents;
CREATE POLICY "doc_select_own_or_all" ON documents FOR SELECT
  TO authenticated USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM auth.users WHERE id = auth.uid() AND (raw_app_meta_data->>'role') = 'hr')
  );

DROP POLICY IF EXISTS "doc_insert_own" ON documents;
CREATE POLICY "doc_insert_own" ON documents FOR INSERT
  TO authenticated WITH CHECK (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "doc_delete_own" ON documents;
CREATE POLICY "doc_delete_own" ON documents FOR DELETE
  TO authenticated USING (
    employee_id IN (SELECT id FROM employees WHERE user_id = auth.uid())
  );

-- ============================================================
-- updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_employees_updated_at ON employees;
CREATE TRIGGER trg_employees_updated_at BEFORE UPDATE ON employees
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_attendance_updated_at ON attendance;
CREATE TRIGGER trg_attendance_updated_at BEFORE UPDATE ON attendance
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_leave_updated_at ON leave_requests;
CREATE TRIGGER trg_leave_updated_at BEFORE UPDATE ON leave_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS trg_payroll_updated_at ON payroll;
CREATE TRIGGER trg_payroll_updated_at BEFORE UPDATE ON payroll
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();