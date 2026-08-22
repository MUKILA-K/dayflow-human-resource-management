import { type ReactNode } from 'react';
import { LayoutDashboard, User, Clock, CalendarDays, Wallet, Bell } from 'lucide-react';
import AppLayout, { type NavLinkItem } from './AppLayout';
import { useAuth } from '@/context/AuthContext';
import { getGreeting } from '@/lib/utils';

interface EmployeeLayoutProps {
  children: ReactNode;
  title?: string;
  subtitle?: string;
}

const items: NavLinkItem[] = [
  { path: '/employee/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/employee/profile', label: 'My Profile', icon: User },
  { path: '/employee/attendance', label: 'Attendance', icon: Clock },
  { path: '/employee/leave', label: 'Leave & Time Off', icon: CalendarDays },
  { path: '/employee/payroll', label: 'My Payroll', icon: Wallet },
  { path: '/employee/notifications', label: 'Notifications', icon: Bell },
];

export default function EmployeeLayout({ children, title, subtitle }: EmployeeLayoutProps) {
  const { employee } = useAuth();
  const defaultTitle = `${getGreeting()}, ${employee?.full_name?.split(' ')[0] || ''}`;
  return (
    <AppLayout items={items} title={title || defaultTitle} subtitle={subtitle || "Here's your workday overview."}>
      {children}
    </AppLayout>
  );
}
