'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Clock,
  CheckSquare,
  Target,
  Calendar,
  Building2,
  Briefcase,
  Mail,
  Phone,
  ChevronRight,
  Loader2,
  CalendarDays,
  Megaphone,
  Receipt,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AttendanceCard } from '@/components/employee/attendance-card';
import { TasksCard } from '@/components/employee/tasks-card';
import { TargetsCard } from '@/components/employee/targets-card';
import { ContractsCard } from '@/components/employee/contracts-card';
import { LeaveRequestsCard } from '@/components/employee/leave-requests-card';
import { AnnouncementsCard } from '@/components/employee/announcements-card';
import { ExpensesCard } from '@/components/employee/expenses-card';
import { PerformanceReviewsCard } from '@/components/employee/performance-reviews-card';
import { cn } from '@/lib/utils';

interface EmployeeInfo {
  id: string;
  employer_employee_id: string;
  employer: {
    id: string;
    full_name: string;
    email: string;
  };
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  job_title?: string;
  department?: string;
  hire_date?: string;
}

export function EmployeeDashboard() {
  const [employeeInfo, setEmployeeInfo] = useState<EmployeeInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'tasks' | 'targets' | 'contracts' | 'leave' | 'expenses' | 'announcements' | 'reviews'>('overview');
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

      // Get user's profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, email, phone, avatar_url')
        .eq('id', user.id)
        .single();

      // Find employee record - use maybeSingle to handle 0 or multiple records
      const { data: employeeRecord, error } = await supabase
        .from('employer_employees')
        .select('id, employer_id, job_title, department, hire_date')
        .eq('employee_id', user.id)
        .eq('employment_status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching employee record:', error);
        setEmployeeInfo(null);
        return;
      }

      if (!employeeRecord || !employeeRecord.employer_id) {
        setEmployeeInfo(null);
        return;
      }

      // Fetch employer data from parties table (where type = 'Employer')
      // Note: employer_employees.employer_id references profiles(id), but we need to fetch from parties
      // We match by getting the employer profile first, then finding the corresponding party
      
      // First, get employer profile to help with matching
      const { data: employerProfile } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('id', employeeRecord.employer_id)
        .single();

      // Query parties table for the employer
      // Matching strategy: Try email first, then name, then fallback
      let employerParty = null;
      
      if (employerProfile?.email) {
        // Try to match by contact_email in parties (most reliable)
        const { data: partyByEmail } = await supabase
          .from('parties')
          .select('id, name_en, name_ar, contact_email, contact_phone')
          .eq('type', 'Employer')
          .eq('contact_email', employerProfile.email)
          .maybeSingle();
        
        if (partyByEmail) {
          employerParty = partyByEmail;
        }
      }

      // If not found by email, try to match by name (fuzzy match)
      if (!employerParty && employerProfile?.full_name) {
        const { data: partyByName } = await supabase
          .from('parties')
          .select('id, name_en, name_ar, contact_email, contact_phone')
          .eq('type', 'Employer')
          .or(`name_en.ilike.%${employerProfile.full_name}%,name_ar.ilike.%${employerProfile.full_name}%`)
          .maybeSingle();
        
        if (partyByName) {
          employerParty = partyByName;
        }
      }

      // If no party found, use profile data as fallback but log warning
      if (!employerParty) {
        console.warn('No matching employer party found in parties table for employer_id:', employeeRecord.employer_id);
        console.warn('Using profile data as fallback. Please review and align employer data in parties table.');
        // Use profile data as fallback
        setEmployeeInfo({
          id: user.id,
          employer_employee_id: employeeRecord.id,
          employer: {
            id: employeeRecord.employer_id,
            full_name: employerProfile?.full_name || 'Unknown Employer',
            email: employerProfile?.email || '',
          },
          profile: profile || null,
          job_title: employeeRecord.job_title,
          department: employeeRecord.department,
          hire_date: employeeRecord.hire_date,
        });
        return;
      }

      setEmployeeInfo({
        id: user.id,
        employer_employee_id: employeeRecord.id,
        employer: {
          id: employerParty.id,
          full_name: employerParty.name_en || employerParty.name_ar || 'Unknown Employer',
          email: employerParty.contact_email || employerProfile?.email || '',
        },
        profile: profile || null,
        job_title: employeeRecord.job_title,
        department: employeeRecord.department,
        hire_date: employeeRecord.hire_date,
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
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!employeeInfo) {
    return (
      <div className="container mx-auto py-6 px-4">
        <Card className="border-0 shadow-xl max-w-lg mx-auto">
          <CardContent className="py-12 text-center">
            <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-full w-fit mx-auto mb-4">
              <User className="h-12 w-12 text-gray-400" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Not Assigned to a Team</h2>
            <p className="text-gray-600 mb-4">
              You are not currently assigned to any employer's team.
            </p>
            <p className="text-sm text-gray-500">
              Please contact your employer or administrator to be added to a team.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = employeeInfo.profile?.full_name?.split(' ')[0] || 'there';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 dark:from-gray-950 dark:via-gray-900 dark:to-slate-950">
      <div className="container mx-auto py-6 px-4 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
              {getGreeting()}, {firstName}!
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Here's what's happening today
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Profile & Company Card */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <CardContent className="relative py-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-2xl font-bold">
                  {employeeInfo.profile?.avatar_url ? (
                    <img
                      src={employeeInfo.profile.avatar_url}
                      alt=""
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    firstName.charAt(0).toUpperCase()
                  )}
                </div>
              </div>

              {/* Info Grid */}
              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-white/70 text-sm mb-1">Your Role</p>
                  <p className="font-semibold text-lg">
                    {employeeInfo.job_title || 'Team Member'}
                  </p>
                  {employeeInfo.department && (
                    <Badge variant="secondary" className="mt-1 bg-white/20 text-white border-0">
                      {employeeInfo.department}
                    </Badge>
                  )}
                </div>

                <div>
                  <p className="text-white/70 text-sm mb-1 flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    Company
                  </p>
                  <p className="font-semibold">{employeeInfo.employer.full_name}</p>
                  <p className="text-sm text-white/70">{employeeInfo.employer.email}</p>
                </div>

                <div>
                  <p className="text-white/70 text-sm mb-1">Contact</p>
                  <div className="space-y-1">
                    {employeeInfo.profile?.email && (
                      <p className="text-sm flex items-center gap-2">
                        <Mail className="h-3 w-3" />
                        {employeeInfo.profile.email}
                      </p>
                    )}
                    {employeeInfo.profile?.phone && (
                      <p className="text-sm flex items-center gap-2">
                        <Phone className="h-3 w-3" />
                        {employeeInfo.profile.phone}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Tabs */}
        <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('overview')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              activeTab === 'overview'
                ? "bg-white dark:bg-gray-700 shadow text-primary"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            <Clock className="h-4 w-4" />
            Overview
          </button>
          <button
            onClick={() => setActiveTab('tasks')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              activeTab === 'tasks'
                ? "bg-white dark:bg-gray-700 shadow text-primary"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            <CheckSquare className="h-4 w-4" />
            Tasks
          </button>
          <button
            onClick={() => setActiveTab('targets')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              activeTab === 'targets'
                ? "bg-white dark:bg-gray-700 shadow text-primary"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            <Target className="h-4 w-4" />
            Targets
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              activeTab === 'contracts'
                ? "bg-white dark:bg-gray-700 shadow text-primary"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            <Briefcase className="h-4 w-4" />
            Contracts
          </button>
          <button
            onClick={() => setActiveTab('leave')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              activeTab === 'leave'
                ? "bg-white dark:bg-gray-700 shadow text-primary"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            <CalendarDays className="h-4 w-4" />
            Leave
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              activeTab === 'expenses'
                ? "bg-white dark:bg-gray-700 shadow text-primary"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            <Receipt className="h-4 w-4" />
            Expenses
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              activeTab === 'announcements'
                ? "bg-white dark:bg-gray-700 shadow text-primary"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            <Megaphone className="h-4 w-4" />
            News
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2",
              activeTab === 'reviews'
                ? "bg-white dark:bg-gray-700 shadow text-primary"
                : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            )}
          >
            <Target className="h-4 w-4" />
            Reviews
          </button>
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Announcements Preview */}
            <AnnouncementsCard />
            
            {/* Main Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <AttendanceCard />
              <TasksCard />
            </div>
          </div>
        )}

        {activeTab === 'tasks' && (
          <div className="max-w-4xl">
            <TasksCard />
          </div>
        )}

        {activeTab === 'targets' && (
          <div className="max-w-4xl">
            <TargetsCard />
          </div>
        )}

        {activeTab === 'contracts' && (
          <div className="max-w-4xl">
            <ContractsCard />
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="max-w-4xl">
            <LeaveRequestsCard />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="max-w-4xl">
            <ExpensesCard />
          </div>
        )}

        {activeTab === 'announcements' && (
          <div className="max-w-4xl">
            <AnnouncementsCard />
          </div>
        )}

        {activeTab === 'reviews' && employeeInfo && (
          <div className="max-w-4xl">
            <PerformanceReviewsCard employerEmployeeId={employeeInfo.employer_employee_id} />
          </div>
        )}
      </div>
    </div>
  );
}
