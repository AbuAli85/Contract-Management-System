'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  Users,
  Clock,
  FileText,
  Calendar,
  BarChart3,
  Settings,
  UserPlus,
  CheckCircle,
  AlertTriangle,
  Building,
  DollarSign,
  Mail,
  CheckSquare,
  Target,
  Briefcase,
} from 'lucide-react';

interface HRNavigationProps {
  className?: string;
}

export function HRNavigation({ className }: HRNavigationProps) {
  const pathname = usePathname();

  const navigationItems = [
    {
      title: 'HR Dashboard',
      href: '/hr',
      icon: BarChart3,
      description: 'Overview and statistics',
    },
    {
      title: 'Employees',
      href: '/hr/employees',
      icon: Users,
      description: 'Manage employee records',
    },
    {
      title: 'Attendance',
      href: '/hr/attendance',
      icon: Clock,
      description: 'Track working hours',
    },
    {
      title: 'Leave Requests',
      href: '/hr/leave-requests',
      icon: Calendar,
      description: 'Manage leave applications',
    },
    {
      title: 'Payroll',
      href: '/hr/payroll',
      icon: DollarSign,
      description: 'Process salaries and payslips',
    },
    {
      title: 'Letters',
      href: '/hr/letters',
      icon: Mail,
      description: 'Generate official letters',
    },
    {
      title: 'Tasks',
      href: '/hr/tasks',
      icon: CheckSquare,
      description: 'Assign and track tasks',
    },
    {
      title: 'Targets',
      href: '/hr/targets',
      icon: Target,
      description: 'Set and monitor goals',
    },
    {
      title: 'Assignments',
      href: '/hr/assignments',
      icon: Briefcase,
      description: 'Client assignments',
    },
    {
      title: 'Documents',
      href: '/hr/documents',
      icon: FileText,
      description: 'Document management',
    },
    {
      title: 'Reports',
      href: '/hr/reports',
      icon: BarChart3,
      description: 'HR analytics and reports',
    },
  ];

  const quickActions = [
    {
      title: 'Add Employee',
      href: '/hr/employees/new',
      icon: UserPlus,
      color: 'text-blue-600 bg-blue-50',
    },
    {
      title: 'Check Attendance',
      href: '/hr/attendance',
      icon: CheckCircle,
      color: 'text-green-600 bg-green-50',
    },
    {
      title: 'Expiring Documents',
      href: '/hr/documents/expiring',
      icon: AlertTriangle,
      color: 'text-red-600 bg-red-50',
    },
    {
      title: 'Company Settings',
      href: '/hr/settings',
      icon: Building,
      color: 'text-blue-600 bg-blue-50',
    },
  ];

  return (
    <div className={cn('space-y-6', className)}>
      {/* Main Navigation */}
      <div>
        <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3'>
          HR Management
        </h3>
        <nav className='space-y-1'>
          {navigationItems.map(item => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'group flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md transition-colors',
                  isActive
                    ? 'bg-blue-100 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                <div className='flex items-center'>
                  <Icon
                    className={cn(
                      'mr-3 h-5 w-5 flex-shrink-0',
                      isActive
                        ? 'text-blue-500'
                        : 'text-gray-400 group-hover:text-gray-500'
                    )}
                  />
                  <div>
                    <div className='flex items-center'>
                      {item.title}
                      {item.badge && (
                        <span className='ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <div className='text-xs text-gray-500'>
                      {item.description}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Quick Actions */}
      <div>
        <h3 className='text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3'>
          Quick Actions
        </h3>
        <div className='grid grid-cols-2 gap-2'>
          {quickActions.map(action => {
            const Icon = action.icon;

            return (
              <Link
                key={action.href}
                href={action.href}
                className='group flex flex-col items-center p-3 text-sm font-medium rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all'
              >
                <div className={cn('p-2 rounded-full mb-2', action.color)}>
                  <Icon className='h-4 w-4' />
                </div>
                <span className='text-xs text-center'>{action.title}</span>
              </Link>
            );
          })}
        </div>
      </div>

      {/* HR Stats Summary - Hidden until real data is available */}
      {/* HR Stats Summary - Connect to real HR data API before enabling this section
      <div className='bg-gray-50 rounded-lg p-4'>
        <h3 className='text-sm font-semibold text-gray-700 mb-3'>
          HR Overview
        </h3>
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600'>Total Employees</span>
            <span className='font-medium'>{realEmployeeCount}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600'>Active Today</span>
            <span className='font-medium text-green-600'>{realActiveCount}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600'>Pending Leave</span>
            <span className='font-medium text-amber-600'>{realPendingLeave}</span>
          </div>
          <div className='flex justify-between text-sm'>
            <span className='text-gray-600'>Expiring Docs</span>
            <span className='font-medium text-red-600'>{realExpiringDocs}</span>
          </div>
        </div>
      </div>
      */}
    </div>
  );
}
