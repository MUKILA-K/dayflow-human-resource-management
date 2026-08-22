import { type ReactNode } from 'react';
import { LayoutDashboard, Users, Clock, CalendarDays, Wallet, BarChart3, Bell } from 'lucide-react';
import AppLayout, { type NavLinkItem } from './AppLayout';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const items: NavLinkItem[] = [
  { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/admin/employees', label: 'Employees', icon: Users },
  { path: '/admin/attendance', label: 'Attendance', icon: Clock },
  { path: '/admin/leaves', label: 'Leave Requests', icon: CalendarDays },
  { path: '/admin/payroll', label: 'Payroll', icon: Wallet },
  { path: '/admin/reports', label: 'Reports & Analytics', icon: BarChart3 },
  { path: '/admin/notifications', label: 'Notifications', icon: Bell },
];

export default function AdminLayout({ children, title, subtitle }: AdminLayoutProps) {
  return (
    <AppLayout items={items} title={title || 'HR Overview'} subtitle={subtitle || 'Manage your workforce with clarity.'}>
      {children}
    </AppLayout>
  );
}
