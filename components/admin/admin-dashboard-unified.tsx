'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Users,
  Key,
  Settings,
  BarChart3,
  UserCheck,
  Building2,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { AdminRoleManager } from './admin-role-manager';
import { AdminPermissionManager } from './admin-permission-manager';
import { useAuth } from '@/app/providers';
import { usePermissions } from '@/hooks/use-permissions';
import Link from 'next/link';

interface AdminDashboardUnifiedProps {
  className?: string;
}

export function AdminDashboardUnified({
  className,
}: AdminDashboardUnifiedProps) {
  const { user } = useAuth();
  const { isAdmin, isManager } = usePermissions();
  const [activeTab, setActiveTab] = useState('overview');

  // Check if user is admin
  if (!isAdmin() && !isManager()) {
    return (
      <Card className='border-red-200 bg-red-50 dark:bg-red-950/20'>
        <CardHeader>
          <div className='flex items-center gap-3'>
            <AlertTriangle className='h-6 w-6 text-red-600' />
            <CardTitle className='text-red-800 dark:text-red-200'>
              Access Denied
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <p className='text-red-700 dark:text-red-300'>
            You do not have permission to access the admin dashboard. Only
            administrators can view this page.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <div className='space-y-6'>
        {/* Header */}
        <Card className='shadow-xl border-2 border-primary/20 bg-gradient-to-br from-white via-slate-50/50 to-white'>
          <CardHeader className='bg-gradient-to-r from-primary/10 via-blue-500/10 to-indigo-500/10 border-b-2 border-primary/20'>
            <div className='flex items-center justify-between flex-wrap gap-4'>
              <div>
                <CardTitle className='text-3xl font-bold flex items-center gap-3'>
                  <Shield className='h-8 w-8 text-primary' />
                  Admin Control Center
                </CardTitle>
                <CardDescription className='mt-2 text-base'>
                  Manage users, roles, and permissions for the Promoter
                  Intelligence Hub
                </CardDescription>
              </div>
              <div className='flex items-center gap-2'>
                <Badge
                  variant='outline'
                  className='bg-purple-100 text-purple-700 border-purple-300'
                >
                  <Shield className='h-3 w-3 mr-1' />
                  Admin Access
                </Badge>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Quick Stats */}
        <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
          <Card className='border-2 border-blue-200 bg-blue-50/50'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-blue-600 font-medium'>
                    Total Users
                  </p>
                  <p className='text-2xl font-bold text-blue-700 mt-1'>—</p>
                </div>
                <Users className='h-8 w-8 text-blue-500' />
              </div>
            </CardContent>
          </Card>
          <Card className='border-2 border-green-200 bg-green-50/50'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-green-600 font-medium'>
                    Active Users
                  </p>
                  <p className='text-2xl font-bold text-green-700 mt-1'>—</p>
                </div>
                <CheckCircle className='h-8 w-8 text-green-500' />
              </div>
            </CardContent>
          </Card>
          <Card className='border-2 border-purple-200 bg-purple-50/50'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-purple-600 font-medium'>Admins</p>
                  <p className='text-2xl font-bold text-purple-700 mt-1'>—</p>
                </div>
                <Shield className='h-8 w-8 text-purple-500' />
              </div>
            </CardContent>
          </Card>
          <Card className='border-2 border-orange-200 bg-orange-50/50'>
            <CardContent className='p-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-sm text-orange-600 font-medium'>Pending</p>
                  <p className='text-2xl font-bold text-orange-700 mt-1'>—</p>
                </div>
                <AlertTriangle className='h-8 w-8 text-orange-500' />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className='space-y-6'
        >
          <TabsList className='grid w-full grid-cols-3'>
            <TabsTrigger value='overview' className='flex items-center gap-2'>
              <BarChart3 className='h-4 w-4' />
              Overview
            </TabsTrigger>
            <TabsTrigger value='roles' className='flex items-center gap-2'>
              <UserCheck className='h-4 w-4' />
              Role Management
            </TabsTrigger>
            <TabsTrigger
              value='permissions'
              className='flex items-center gap-2'
            >
              <Key className='h-4 w-4' />
              Permissions
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value='overview' className='space-y-6'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <Users className='h-5 w-5' />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <Button
                    asChild
                    className='w-full justify-start'
                    variant='outline'
                  >
                    <Link href='/admin/permissions'>
                      <UserCheck className='h-4 w-4 mr-2' />
                      Manage User Roles
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className='w-full justify-start'
                    variant='outline'
                  >
                    <Link href='/admin/permissions'>
                      <Key className='h-4 w-4 mr-2' />
                      Manage Permissions
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className='w-full justify-start'
                    variant='outline'
                  >
                    <Link href='/admin/users'>
                      <Settings className='h-4 w-4 mr-2' />
                      User Management
                    </Link>
                  </Button>
                  <Button
                    asChild
                    className='w-full justify-start'
                    variant='outline'
                  >
                    <Link href='/promoters'>
                      <Building2 className='h-4 w-4 mr-2' />
                      Promoter Intelligence Hub
                    </Link>
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className='flex items-center gap-2'>
                    <TrendingUp className='h-5 w-5' />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200'>
                    <span className='text-sm font-medium text-green-800 dark:text-green-200'>
                      Role-Based Access
                    </span>
                    <Badge
                      variant='outline'
                      className='bg-green-100 text-green-700 border-green-300'
                    >
                      Active
                    </Badge>
                  </div>
                  <div className='flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200'>
                    <span className='text-sm font-medium text-green-800 dark:text-green-200'>
                      Permission System
                    </span>
                    <Badge
                      variant='outline'
                      className='bg-green-100 text-green-700 border-green-300'
                    >
                      Active
                    </Badge>
                  </div>
                  <div className='flex items-center justify-between p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200'>
                    <span className='text-sm font-medium text-green-800 dark:text-green-200'>
                      API Security
                    </span>
                    <Badge
                      variant='outline'
                      className='bg-green-100 text-green-700 border-green-300'
                    >
                      Active
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Admin Guide</CardTitle>
                <CardDescription>
                  Quick reference for managing users and permissions
                </CardDescription>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='space-y-2'>
                  <h4 className='font-semibold flex items-center gap-2'>
                    <UserCheck className='h-4 w-4' />
                    Assign Roles
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    Go to <strong>Role Management</strong> tab to assign roles
                    (Employee, Employer, Admin) to users. For employers, you can
                    select from existing employers in the system.
                  </p>
                </div>
                <div className='space-y-2'>
                  <h4 className='font-semibold flex items-center gap-2'>
                    <Key className='h-4 w-4' />
                    Grant Permissions
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    Go to <strong>Permissions</strong> tab to grant or revoke
                    specific permissions for users. You can toggle permissions
                    by category or individually.
                  </p>
                </div>
                <div className='space-y-2'>
                  <h4 className='font-semibold flex items-center gap-2'>
                    <Shield className='h-4 w-4' />
                    Verify Access
                  </h4>
                  <p className='text-sm text-muted-foreground'>
                    After assigning roles or permissions, users need to logout
                    and login again for changes to take effect. You can verify
                    access by checking their dashboard view.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Role Management Tab */}
          <TabsContent value='roles'>
            <AdminRoleManager />
          </TabsContent>

          {/* Permissions Tab */}
          <TabsContent value='permissions'>
            <AdminPermissionManager />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
