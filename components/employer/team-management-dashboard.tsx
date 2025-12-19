'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  UserPlus,
  Clock,
  CheckSquare,
  Target,
  Shield,
  Search,
  Filter,
  MoreVertical,
  UserCheck,
  UserX,
  Calendar,
  Mail,
  Phone,
  Building2,
  Briefcase,
  MapPin,
  CreditCard,
  TrendingUp,
  Activity,
  ClipboardList,
  Settings,
  ChevronRight,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCompany } from '@/components/providers/company-provider';
import { TeamMemberList } from './team-member-list';
import { AddTeamMemberDialog } from './add-team-member-dialog';
import { InviteEmployeeDialog } from './invite-employee-dialog';
import { AttendanceView } from './attendance-view';
import { TasksView } from './tasks-view';
import { TargetsView } from './targets-view';
import { PermissionsManager } from './permissions-manager';
import { AnalyticsOverview } from './analytics-overview';
import { LeaveRequestsManagement } from './leave-requests-management';
import { LeaveCalendar } from './leave-calendar';
import { AnnouncementsManagement } from './announcements-management';
import { ExpensesManagement } from './expenses-management';
import { PerformanceReviewsManagement } from './performance-reviews-management';
import { cn } from '@/lib/utils';

interface TeamMember {
  id: string;
  employee_id: string;
  employee_code?: string;
  job_title?: string;
  department?: string;
  employment_type?: string;
  employment_status: string;
  hire_date?: string;
  salary?: number;
  currency?: string;
  work_location?: string;
  notes?: string;
  employee: {
    id: string;
    email: string;
    full_name: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    avatar_url?: string;
  } | null;
  permissions?: Array<{ permission_id: string; granted: boolean }>;
}

interface TeamStats {
  total: number;
  active: number;
  on_leave: number;
  terminated: number;
}

const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  gradient,
  iconColor 
}: { 
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  gradient: string;
  iconColor: string;
}) => (
  <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
    <div className={cn("absolute inset-0 opacity-10 group-hover:opacity-15 transition-opacity", gradient)} />
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative z-10">
      <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</CardTitle>
      <div className={cn("p-2 rounded-lg", gradient)}>
        <Icon className={cn("h-4 w-4", iconColor)} />
      </div>
    </CardHeader>
    <CardContent className="relative z-10">
      <div className="text-3xl font-bold tracking-tight">{value}</div>
      <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
    </CardContent>
  </Card>
);

export function TeamManagementDashboard() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<TeamStats>({
    total: 0,
    active: 0,
    on_leave: 0,
    terminated: 0,
  });
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  // ✅ COMPANY SCOPE: Get company context
  const { companyId } = useCompany();

  useEffect(() => {
    fetchTeam();
  }, [companyId]); // ✅ COMPANY SCOPE: Refetch when company changes

  const fetchTeam = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/employer/team');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch team');
      }

      setTeamMembers(data.team || []);
      calculateStats(data.team || []);
    } catch (error) {
      console.error('Error fetching team:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load team members';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (members: TeamMember[]) => {
    setStats({
      total: members.length,
      active: members.filter(m => m.employment_status === 'active').length,
      on_leave: members.filter(m => m.employment_status === 'on_leave').length,
      terminated: members.filter(m => m.employment_status === 'terminated').length,
    });
  };

  const handleAddMember = () => {
    fetchTeam();
  };

  const handleMemberSelect = (member: TeamMember) => {
    setSelectedMember(member);
    if (activeTab === 'team') {
      setActiveTab('details');
    }
  };

  const filteredMembers = teamMembers.filter(member => {
    const name = member.employee?.full_name || '';
    const email = member.employee?.email || '';
    const code = member.employee_code || '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      code.toLowerCase().includes(searchTerm.toLowerCase())
  );
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number | undefined, currency: string = 'OMR') => {
    if (!amount) return 'Not specified';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return 'Not specified';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <div className="space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5 rounded-2xl -z-10" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  Team Management
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Manage your team members, permissions, attendance, tasks, and targets
                </p>
              </div>
            </div>
          </div>
        </div>
        <Card className="border-0 shadow-xl">
          <CardContent className="py-16 text-center">
            <Activity className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Loading team members...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error && teamMembers.length === 0) {
    return (
      <div className="space-y-8">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5 rounded-2xl -z-10" />
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
                <Users className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
                  Team Management
                </h1>
                <p className="text-gray-500 dark:text-gray-400 mt-1">
                  Manage your team members, permissions, attendance, tasks, and targets
                </p>
              </div>
            </div>
          </div>
        </div>
        <Card className="border-0 shadow-xl">
          <CardContent className="py-16 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Failed to Load Team
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
            <Button onClick={fetchTeam} variant="outline">
              <Activity className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Premium Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5 rounded-2xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl border border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-500/20">
              <Users className="h-8 w-8 text-white" />
            </div>
        <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Team Management
          </h1>
              <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your team members, permissions, attendance, tasks, and targets
          </p>
        </div>
          </div>
          <div className="flex gap-2">
            <InviteEmployeeDialog onSuccess={handleAddMember} />
        <AddTeamMemberDialog onSuccess={handleAddMember} />
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Team"
          value={stats.total}
          subtitle="All team members"
          icon={Users}
          gradient="bg-gradient-to-br from-blue-500 to-blue-600"
          iconColor="text-white"
        />
        <StatCard
          title="Active"
          value={stats.active}
          subtitle="Currently active"
          icon={UserCheck}
          gradient="bg-gradient-to-br from-emerald-500 to-emerald-600"
          iconColor="text-white"
        />
        <StatCard
          title="On Leave"
          value={stats.on_leave}
          subtitle="Currently on leave"
          icon={Clock}
          gradient="bg-gradient-to-br from-amber-500 to-orange-500"
          iconColor="text-white"
        />
        <StatCard
          title="Terminated"
          value={stats.terminated}
          subtitle="No longer active"
          icon={UserX}
          gradient="bg-gradient-to-br from-red-500 to-rose-600"
          iconColor="text-white"
        />
      </div>

      {/* Main Content */}
      <Card className="border-0 shadow-xl">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-4 sm:px-6 pt-4 overflow-x-auto">
            <TabsList className="bg-transparent h-auto p-0 gap-2 sm:gap-6 min-w-max">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none pb-3 px-1 whitespace-nowrap"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Overview</span>
                <span className="sm:hidden">Overview</span>
              </TabsTrigger>
              <TabsTrigger 
                value="team" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none pb-3 px-1 whitespace-nowrap"
              >
                <Users className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Team Members</span>
                <span className="sm:hidden">Team</span>
              </TabsTrigger>
              <TabsTrigger 
                value="leave-requests" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none pb-3 px-1 whitespace-nowrap"
              >
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Leave Requests</span>
                <span className="sm:hidden">Leave</span>
              </TabsTrigger>
              <TabsTrigger 
                value="leave-calendar" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none pb-3 px-1 whitespace-nowrap"
              >
                <Calendar className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Leave Calendar</span>
                <span className="sm:hidden">Calendar</span>
              </TabsTrigger>
              <TabsTrigger 
                value="expenses" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none pb-3 px-1 whitespace-nowrap"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Expenses</span>
                <span className="sm:hidden">Expenses</span>
              </TabsTrigger>
              <TabsTrigger 
                value="announcements" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none pb-3 px-1 whitespace-nowrap"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Announcements</span>
                <span className="sm:hidden">News</span>
              </TabsTrigger>
              <TabsTrigger 
                value="performance" 
                className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none pb-3 px-1 whitespace-nowrap"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Reviews</span>
                <span className="sm:hidden">Reviews</span>
              </TabsTrigger>
          {selectedMember && (
            <>
                  <TabsTrigger 
                    value="details"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none pb-3 px-1 whitespace-nowrap"
                  >
                    <Briefcase className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Details</span>
                    <span className="sm:hidden">Details</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="attendance"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none pb-3 px-1 whitespace-nowrap"
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Attendance</span>
                    <span className="sm:hidden">Time</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="tasks"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none pb-3 px-1 whitespace-nowrap"
                  >
                    <ClipboardList className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Tasks</span>
                    <span className="sm:hidden">Tasks</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="targets"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none pb-3 px-1 whitespace-nowrap"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Targets</span>
                    <span className="sm:hidden">Goals</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="permissions"
                    className="data-[state=active]:bg-transparent data-[state=active]:shadow-none border-b-2 border-transparent data-[state=active]:border-blue-600 rounded-none pb-3 px-1 whitespace-nowrap"
                  >
                    <Shield className="h-4 w-4 mr-2" />
                    <span className="hidden sm:inline">Permissions</span>
                    <span className="sm:hidden">Access</span>
                  </TabsTrigger>
            </>
          )}
        </TabsList>
          </div>

          <TabsContent value="overview" className="p-6 mt-0">
            <AnalyticsOverview />
          </TabsContent>

          <TabsContent value="team" className="p-6 space-y-4 mt-0">
            {/* Search Bar */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search team members..."
                className="pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800 focus:ring-2 focus:ring-blue-500/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
          </div>

          <TeamMemberList
            members={filteredMembers}
            onMemberSelect={handleMemberSelect}
            onRefresh={fetchTeam}
          />
        </TabsContent>

          <TabsContent value="leave-requests" className="p-6 mt-0">
            <LeaveRequestsManagement />
          </TabsContent>

          <TabsContent value="leave-calendar" className="p-6 mt-0">
            <LeaveCalendar />
          </TabsContent>

          <TabsContent value="expenses" className="p-6 mt-0">
            <ExpensesManagement />
          </TabsContent>

          <TabsContent value="announcements" className="p-6 mt-0">
            <AnnouncementsManagement />
          </TabsContent>

          <TabsContent value="performance" className="p-6 mt-0">
            <PerformanceReviewsManagement />
          </TabsContent>

        {selectedMember && (
          <>
              <TabsContent value="details" className="p-6 mt-0">
                <div className="space-y-6">
                  {/* Employee Profile Header */}
                  <div className="flex items-start gap-6 p-6 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-xl">
                    <Avatar className="h-24 w-24 border-4 border-white dark:border-gray-700 shadow-xl">
                      <AvatarImage src={selectedMember.employee?.avatar_url} />
                      <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-blue-600 to-indigo-600 text-white">
                        {getInitials(selectedMember.employee?.full_name || 'NA')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                          {selectedMember.employee?.full_name || 'Unknown Employee'}
                        </h2>
                        <Badge
                          className={cn(
                            "px-3 py-1 text-xs font-semibold",
                            selectedMember.employment_status === 'active'
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                              : selectedMember.employment_status === 'on_leave'
                                ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                          )}
                        >
                          {selectedMember.employment_status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-gray-500 dark:text-gray-400 mt-1">
                        {selectedMember.job_title || 'No job title assigned'} 
                        {selectedMember.department && ` • ${selectedMember.department}`}
                      </p>
                      <div className="flex items-center gap-4 mt-3">
                        {selectedMember.employee?.email && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="h-4 w-4" />
                            {selectedMember.employee.email}
                          </div>
                        )}
                        {selectedMember.employee?.phone && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                            <Phone className="h-4 w-4" />
                            {selectedMember.employee.phone}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Employment Details */}
                    <Card className="border shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <Briefcase className="h-4 w-4 text-blue-600" />
                          Employment Details
                        </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Employee Code</p>
                          <p className="text-sm font-semibold mt-1">{selectedMember.employee_code || 'Not assigned'}</p>
                    </div>
                    <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Employment Type</p>
                          <p className="text-sm font-semibold mt-1 capitalize">
                            {selectedMember.employment_type?.replace('_', ' ') || 'Full Time'}
                          </p>
                    </div>
                    <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Hire Date</p>
                          <p className="text-sm font-semibold mt-1">{formatDate(selectedMember.hire_date)}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Compensation */}
                    <Card className="border shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <CreditCard className="h-4 w-4 text-emerald-600" />
                          Compensation
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Salary</p>
                          <p className="text-sm font-semibold mt-1">
                            {formatCurrency(selectedMember.salary, selectedMember.currency)}
                          </p>
                    </div>
                    <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Currency</p>
                          <p className="text-sm font-semibold mt-1">{selectedMember.currency || 'OMR'}</p>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Work Location */}
                    <Card className="border shadow-sm">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                          <MapPin className="h-4 w-4 text-purple-600" />
                          Location & Notes
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Work Location</p>
                          <p className="text-sm font-semibold mt-1">{selectedMember.work_location || 'Not specified'}</p>
                    </div>
                    <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">Notes</p>
                          <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                            {selectedMember.notes || 'No notes added'}
                          </p>
                    </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Quick Actions */}
                  <Card className="border shadow-sm">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                        <Settings className="h-4 w-4" />
                        Quick Actions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" onClick={() => setActiveTab('attendance')}>
                          <Calendar className="h-4 w-4 mr-2" />
                          View Attendance
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setActiveTab('tasks')}>
                          <ClipboardList className="h-4 w-4 mr-2" />
                          Manage Tasks
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setActiveTab('targets')}>
                          <Target className="h-4 w-4 mr-2" />
                          Set Targets
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setActiveTab('permissions')}>
                          <Shield className="h-4 w-4 mr-2" />
                          Edit Permissions
                        </Button>
                  </div>
                </CardContent>
              </Card>
                </div>
            </TabsContent>

              <TabsContent value="attendance" className="p-6 mt-0">
              {selectedMember.id && !selectedMember.id.toString().startsWith('promoter_') ? (
                <AttendanceView employerEmployeeId={selectedMember.id} />
              ) : (
                <Card className="border-0 shadow-lg">
                  <CardContent className="py-16 text-center">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Attendance Not Available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                      This person exists in the promoters table but has no employer_employee record. 
                      Attendance tracking requires an employer_employee record.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Please add this person to your team using the "Add Team Member" button to enable attendance tracking.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

              <TabsContent value="tasks" className="p-6 mt-0">
              {selectedMember.id && !selectedMember.id.toString().startsWith('promoter_') ? (
                <TasksView employerEmployeeId={selectedMember.id} />
              ) : (
                <Card className="border-0 shadow-lg">
                  <CardContent className="py-16 text-center">
                    <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      Tasks Not Available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-6">
                      This person exists in the promoters table but has no employer_employee record. 
                      Task management requires an employer_employee record.
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Please add this person to your team using the "Add Team Member" button to enable task management.
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

              <TabsContent value="targets" className="p-6 mt-0">
              <TargetsView employerEmployeeId={selectedMember.id} />
            </TabsContent>

              <TabsContent value="permissions" className="p-6 mt-0">
              <PermissionsManager employerEmployeeId={selectedMember.id} />
            </TabsContent>
          </>
        )}
      </Tabs>
      </Card>
    </div>
  );
}
