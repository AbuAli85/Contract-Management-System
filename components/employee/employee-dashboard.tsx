'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  User,
  Clock,
  CheckSquare,
  Target,
  Calendar,
  FileText,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AttendanceView } from '@/components/employer/attendance-view';
import { TasksView } from '@/components/employer/tasks-view';
import { TargetsView } from '@/components/employer/targets-view';

interface EmployeeInfo {
  id: string;
  employer_employee_id: string;
  employer: {
    id: string;
    full_name: string;
    email: string;
  };
  job_title?: string;
  department?: string;
}

export function EmployeeDashboard() {
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  useEffect(() => {
    fetchEmployeeInfo();
  }, []);

  const fetchEmployeeInfo = async () => {
    try {
      setLoading(true);
      
      if (!supabase) {
        toast({
          title: 'Error',
          description: 'Database connection unavailable',
          variant: 'destructive',
        });
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push('/auth/login');
        return;
      }

      // Find employee record
      const { data: employeeRecord, error } = await supabase
        .from('employer_employees')
        .select(
          `
          id,
          job_title,
          department,
          employer:employer_id (
            id,
            full_name,
            email
          )
        `
        )
        .eq('employee_id', user.id)
        .eq('employment_status', 'active')
        .single();

      if (error || !employeeRecord) {
        // Employee not assigned to any employer
        setEmployeeInfo(null);
        return;
      }

      setEmployeeInfo({
        id: user.id,
        employer_employee_id: employeeRecord.id,
        employer: employeeRecord.employer as any,
        job_title: employeeRecord.job_title,
        department: employeeRecord.department,
      });
    } catch (error) {
      console.error('Error fetching employee info:', error);
      toast({
        title: 'Error',
        description: 'Failed to load employee information',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!employeeInfo) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Not Assigned to Team</h2>
            <p className="text-gray-600">
              You are not currently assigned to any employer's team.
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Please contact your employer or administrator to be added to a team.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <User className="h-8 w-8" />
          My Dashboard
        </h1>
        <p className="text-gray-600 mt-1">
          Welcome! Manage your attendance, tasks, and targets
        </p>
      </div>

      {/* Employee Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>Employment Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Employer</p>
              <p className="font-medium">{employeeInfo.employer.full_name}</p>
              <p className="text-sm text-gray-500">{employeeInfo.employer.email}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Job Title</p>
              <p className="font-medium">{employeeInfo.job_title || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{employeeInfo.department || 'N/A'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendance">
            <Clock className="h-4 w-4 mr-2" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="tasks">
            <CheckSquare className="h-4 w-4 mr-2" />
            Tasks
          </TabsTrigger>
          <TabsTrigger value="targets">
            <Target className="h-4 w-4 mr-2" />
            Targets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance">
          <AttendanceView employerEmployeeId={employeeInfo.employer_employee_id} />
        </TabsContent>

        <TabsContent value="tasks">
          <TasksView employerEmployeeId={employeeInfo.employer_employee_id} />
        </TabsContent>

        <TabsContent value="targets">
          <TargetsView employerEmployeeId={employeeInfo.employer_employee_id} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

