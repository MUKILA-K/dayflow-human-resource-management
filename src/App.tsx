import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import ProtectedRoute from '@/components/ProtectedRoute';

import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import VerifyEmail from '@/pages/auth/VerifyEmail';

import EmployeeDashboard from '@/pages/employee/Dashboard';
import EmployeeProfile from '@/pages/employee/Profile';
import EmployeeAttendance from '@/pages/employee/Attendance';
import EmployeeLeave from '@/pages/employee/Leave';
import EmployeePayroll from '@/pages/employee/Payroll';
import EmployeeNotifications from '@/pages/employee/Notifications';

import AdminDashboard from '@/pages/admin/Dashboard';
import AdminEmployees from '@/pages/admin/Employees';
import AdminAttendance from '@/pages/admin/Attendance';
import AdminLeaves from '@/pages/admin/Leaves';
import AdminPayroll from '@/pages/admin/Payroll';
import AdminReports from '@/pages/admin/Reports';
import AdminNotifications from '@/pages/admin/Notifications';

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Employee routes */}
            <Route path="/employee/dashboard" element={
              <ProtectedRoute roles={['employee']}><EmployeeDashboard /></ProtectedRoute>
            } />
            <Route path="/employee/profile" element={
              <ProtectedRoute roles={['employee']}><EmployeeProfile /></ProtectedRoute>
            } />
            <Route path="/employee/attendance" element={
              <ProtectedRoute roles={['employee']}><EmployeeAttendance /></ProtectedRoute>
            } />
            <Route path="/employee/leave" element={
              <ProtectedRoute roles={['employee']}><EmployeeLeave /></ProtectedRoute>
            } />
            <Route path="/employee/payroll" element={
              <ProtectedRoute roles={['employee']}><EmployeePayroll /></ProtectedRoute>
            } />
            <Route path="/employee/notifications" element={
              <ProtectedRoute roles={['employee']}><EmployeeNotifications /></ProtectedRoute>
            } />

            {/* Admin routes */}
            <Route path="/admin/dashboard" element={
              <ProtectedRoute roles={['hr']}><AdminDashboard /></ProtectedRoute>
            } />
            <Route path="/admin/employees" element={
              <ProtectedRoute roles={['hr']}><AdminEmployees /></ProtectedRoute>
            } />
            <Route path="/admin/attendance" element={
              <ProtectedRoute roles={['hr']}><AdminAttendance /></ProtectedRoute>
            } />
            <Route path="/admin/leaves" element={
              <ProtectedRoute roles={['hr']}><AdminLeaves /></ProtectedRoute>
            } />
            <Route path="/admin/payroll" element={
              <ProtectedRoute roles={['hr']}><AdminPayroll /></ProtectedRoute>
            } />
            <Route path="/admin/reports" element={
              <ProtectedRoute roles={['hr']}><AdminReports /></ProtectedRoute>
            } />
            <Route path="/admin/notifications" element={
              <ProtectedRoute roles={['hr']}><AdminNotifications /></ProtectedRoute>
            } />

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
