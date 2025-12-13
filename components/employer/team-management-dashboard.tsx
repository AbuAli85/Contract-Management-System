'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
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
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TeamMemberList } from './team-member-list';
import { AddTeamMemberDialog } from './add-team-member-dialog';
import { AttendanceView } from './attendance-view';
import { TasksView } from './tasks-view';
import { TargetsView } from './targets-view';
import { PermissionsManager } from './permissions-manager';

interface TeamMember {
  id: string;
  employee_id: string;
  employee_code?: string;
  job_title?: string;
  department?: string;
  employment_status: string;
  employee: {
    id: string;
    email: string;
    full_name: string;
    avatar_url?: string;
  };
  permissions?: Array<{ permission_id: string; granted: boolean }>;
}

interface TeamStats {
  total: number;
  active: number;
  on_leave: number;
  terminated: number;
}

export function TeamManagementDashboard() {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<TeamStats>({
    total: 0,
    active: 0,
    on_leave: 0,
    terminated: 0,
  });
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [activeTab, setActiveTab] = useState('team');
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchTeam();
  }, []);

  const fetchTeam = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/employer/team');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch team');
      }

      setTeamMembers(data.team || []);
      calculateStats(data.team || []);
    } catch (error) {
      console.error('Error fetching team:', error);
      toast({
        title: 'Error',
        description: 'Failed to load team members',
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

  const filteredMembers = teamMembers.filter(member =>
    member.employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.employee_code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="h-8 w-8" />
            Team Management
          </h1>
          <p className="text-gray-600 mt-1">
            Manage your team members, permissions, attendance, tasks, and targets
          </p>
        </div>
        <AddTeamMemberDialog onSuccess={handleAddMember} />
      </div>

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Team</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">All team members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckSquare className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground">Currently active</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.on_leave}</div>
            <p className="text-xs text-muted-foreground">On leave</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminated</CardTitle>
            <Users className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.terminated}</div>
            <p className="text-xs text-muted-foreground">Terminated</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="team">Team Members</TabsTrigger>
          {selectedMember && (
            <>
              <TabsTrigger value="details">Details</TabsTrigger>
              <TabsTrigger value="attendance">Attendance</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
              <TabsTrigger value="targets">Targets</TabsTrigger>
              <TabsTrigger value="permissions">Permissions</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="team" className="space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search team members..."
                className="w-full pl-9 pr-4 py-2 border rounded-md"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          <TeamMemberList
            members={filteredMembers}
            onMemberSelect={handleMemberSelect}
            onRefresh={fetchTeam}
          />
        </TabsContent>

        {selectedMember && (
          <>
            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedMember.employee.full_name}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-medium">{selectedMember.employee.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Employee Code</p>
                      <p className="font-medium">{selectedMember.employee_code || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Job Title</p>
                      <p className="font-medium">{selectedMember.job_title || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Department</p>
                      <p className="font-medium">{selectedMember.department || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Status</p>
                      <Badge
                        variant={
                          selectedMember.employment_status === 'active'
                            ? 'default'
                            : selectedMember.employment_status === 'on_leave'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {selectedMember.employment_status}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="attendance">
              <AttendanceView employerEmployeeId={selectedMember.id} />
            </TabsContent>

            <TabsContent value="tasks">
              <TasksView employerEmployeeId={selectedMember.id} />
            </TabsContent>

            <TabsContent value="targets">
              <TargetsView employerEmployeeId={selectedMember.id} />
            </TabsContent>

            <TabsContent value="permissions">
              <PermissionsManager employerEmployeeId={selectedMember.id} />
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  );
}

