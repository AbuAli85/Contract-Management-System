'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Clock,
  FileText,
  Calendar,
  AlertTriangle,
  TrendingUp,
  UserPlus,
  CheckCircle,
} from 'lucide-react';
import Link from 'next/link';

interface HRStats {
  totalEmployees: number;
  activeEmployees: number;
  pendingLeaveRequests: number;
  expiringDocuments: number;
  todayAttendance: number;
  recentHires: number;
}

export default function HRDashboard() {
  const [stats, setStats] = useState<HRStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    pendingLeaveRequests: 0,
    expiringDocuments: 0,
    todayAttendance: 0,
    recentHires: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHRStats();
  }, []);

  const fetchHRStats = async () => {
    try {
      // In a real implementation, you would fetch from your API
      // For now, using mock data
      setStats({
        totalEmployees: 156,
        activeEmployees: 142,
        pendingLeaveRequests: 8,
        expiringDocuments: 12,
        todayAttendance: 89,
        recentHires: 5,
      });
    } catch (error) {
      console.error('Error fetching HR stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Employees',
      value: stats.totalEmployees,
      description: 'All employees in system',
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Active Employees',
      value: stats.activeEmployees,
      description: 'Currently employed',
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Pending Leave Requests',
      value: stats.pendingLeaveRequests,
      description: 'Awaiting approval',
      icon: Calendar,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
    {
      title: 'Expiring Documents',
      value: stats.expiringDocuments,
      description: 'Passports/Visas expiring soon',
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
    {
      title: "Today's Attendance",
      value: stats.todayAttendance,
      description: 'Employees checked in',
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Recent Hires',
      value: stats.recentHires,
      description: 'This month',
      icon: UserPlus,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
    },
  ];

  const quickActions = [
    {
      title: 'Add New Employee',
      description: 'Register a new employee',
      href: '/hr/employees/new',
      icon: UserPlus,
      color: 'bg-blue-500 hover:bg-blue-600',
    },
    {
      title: 'View Attendance',
      description: 'Check attendance records',
      href: '/hr/attendance',
      icon: Clock,
      color: 'bg-green-500 hover:bg-green-600',
    },
    {
      title: 'Manage Leave Requests',
      description: 'Approve/reject leave requests',
      href: '/hr/leave-requests',
      icon: Calendar,
      color: 'bg-orange-500 hover:bg-orange-600',
    },
    {
      title: 'Generate Documents',
      description: 'Create contracts and letters',
      href: '/hr/documents/generate',
      icon: FileText,
      color: 'bg-purple-500 hover:bg-purple-600',
    },
  ];

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>HR Dashboard</h1>
          <p className='text-gray-600 mt-2'>
            Manage your workforce efficiently
          </p>
        </div>
        <div className='flex space-x-3'>
          <Button asChild>
            <Link href='/hr/employees/new'>
              <UserPlus className='w-4 h-4 mr-2' />
              Add Employee
            </Link>
          </Button>
          <Button variant='outline' asChild>
            <Link href='/hr/reports'>
              <TrendingUp className='w-4 h-4 mr-2' />
              Reports
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className='hover:shadow-lg transition-shadow'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium text-gray-600'>
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-full ${stat.bgColor}`}>
                  <Icon className={`w-4 h-4 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold text-gray-900'>
                  {stat.value}
                </div>
                <p className='text-xs text-gray-500 mt-1'>{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common HR tasks and shortcuts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <Link key={index} href={action.href}>
                  <Card className='hover:shadow-md transition-shadow cursor-pointer'>
                    <CardContent className='p-4 text-center'>
                      <div
                        className={`w-12 h-12 mx-auto mb-3 rounded-full ${action.color} flex items-center justify-center`}
                      >
                        <Icon className='w-6 h-6 text-white' />
                      </div>
                      <h3 className='font-semibold text-gray-900 mb-1'>
                        {action.title}
                      </h3>
                      <p className='text-sm text-gray-500'>
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        {/* Recent Hires */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Hires</CardTitle>
            <CardDescription>New employees this month</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {[
                {
                  name: 'Ahmed Al-Rashid',
                  position: 'Software Developer',
                  date: '2024-01-15',
                },
                {
                  name: 'Sarah Johnson',
                  position: 'HR Manager',
                  date: '2024-01-12',
                },
                {
                  name: 'Mohammed Hassan',
                  position: 'Sales Executive',
                  date: '2024-01-10',
                },
              ].map((hire, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 bg-gray-50 rounded-lg'
                >
                  <div>
                    <p className='font-medium text-gray-900'>{hire.name}</p>
                    <p className='text-sm text-gray-500'>{hire.position}</p>
                  </div>
                  <Badge variant='secondary'>{hire.date}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expiring Documents */}
        <Card>
          <CardHeader>
            <CardTitle>Expiring Documents</CardTitle>
            <CardDescription>
              Documents expiring in next 60 days
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-3'>
              {[
                {
                  name: 'John Smith',
                  document: 'Passport',
                  expiry: '2024-02-15',
                  days: 25,
                },
                {
                  name: 'Fatima Al-Zahra',
                  document: 'Visa',
                  expiry: '2024-02-20',
                  days: 30,
                },
                {
                  name: 'David Wilson',
                  document: 'Passport',
                  expiry: '2024-03-01',
                  days: 40,
                },
              ].map((doc, index) => (
                <div
                  key={index}
                  className='flex items-center justify-between p-3 bg-red-50 rounded-lg'
                >
                  <div>
                    <p className='font-medium text-gray-900'>{doc.name}</p>
                    <p className='text-sm text-gray-500'>
                      {doc.document} - {doc.expiry}
                    </p>
                  </div>
                  <Badge variant='destructive'>{doc.days} days</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
