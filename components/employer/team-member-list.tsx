'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  MoreVertical, 
  User, 
  Users, 
  ChevronRight, 
  Mail, 
  Briefcase,
  Building2,
  UserPlus,
  Sparkles 
} from 'lucide-react';
import { cn } from '@/lib/utils';

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
  } | null;
}

interface TeamMemberListProps {
  members: TeamMember[];
  onMemberSelect: (member: TeamMember) => void;
  onRefresh: () => void;
}

export function TeamMemberList({
  members,
  onMemberSelect,
}: TeamMemberListProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active':
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-900/20',
          text: 'text-emerald-700 dark:text-emerald-400',
          dot: 'bg-emerald-500',
          label: 'Active'
        };
      case 'on_leave':
        return {
          bg: 'bg-amber-50 dark:bg-amber-900/20',
          text: 'text-amber-700 dark:text-amber-400',
          dot: 'bg-amber-500',
          label: 'On Leave'
        };
      case 'terminated':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          text: 'text-red-700 dark:text-red-400',
          dot: 'bg-red-500',
          label: 'Terminated'
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-800',
          text: 'text-gray-700 dark:text-gray-400',
          dot: 'bg-gray-500',
          label: status
        };
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (members.length === 0) {
    return (
      <Card className="border-dashed border-2">
        <CardContent className="py-16 text-center">
          <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center mb-4">
            <Users className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            No team members yet
          </h3>
          <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto mb-6">
            Start building your team by adding your first member. You can assign tasks, set targets, and manage permissions.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600 dark:text-blue-400">
            <Sparkles className="h-4 w-4" />
            <span>Click "Add Team Member" above to get started</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {members.map((member, index) => {
        const statusConfig = getStatusConfig(member.employment_status);
        const employeeName = member.employee?.full_name || 'Unknown Employee';
        const employeeEmail = member.employee?.email || 'No email';
        
        return (
        <Card
          key={member.id}
            className={cn(
              "cursor-pointer border transition-all duration-200",
              "hover:shadow-lg hover:border-blue-200 dark:hover:border-blue-800",
              "hover:translate-x-1 group"
            )}
          onClick={() => onMemberSelect(member)}
        >
          <CardContent className="p-4">
              <div className="flex items-center gap-4">
                {/* Avatar with Status Indicator */}
                <div className="relative">
                  <Avatar className="h-12 w-12 border-2 border-white dark:border-gray-800 shadow-md">
                    <AvatarImage src={member.employee?.avatar_url} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold">
                      {getInitials(employeeName)}
                    </AvatarFallback>
                  </Avatar>
                  <span 
                    className={cn(
                      "absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white dark:border-gray-800",
                      statusConfig.dot
                    )} 
                  />
                </div>

                {/* Employee Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                      {employeeName}
                    </h3>
                    {member.employee_code && (
                      <span className="text-xs font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
                        #{member.employee_code}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1">
                    <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 truncate">
                      <Mail className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{employeeEmail}</span>
                    </div>
                  {member.job_title && (
                      <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <Briefcase className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{member.job_title}</span>
                      </div>
                  )}
                    {member.department && (
                      <div className="hidden md:flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
                        <Building2 className="h-3.5 w-3.5 flex-shrink-0" />
                        <span className="truncate">{member.department}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Badge & Arrow */}
                <div className="flex items-center gap-3">
                  <Badge 
                    variant="outline"
                    className={cn(
                      "font-medium border-0 px-3 py-1",
                      statusConfig.bg,
                      statusConfig.text
                    )}
                  >
                    <span className={cn("h-1.5 w-1.5 rounded-full mr-2", statusConfig.dot)} />
                    {statusConfig.label}
                  </Badge>
                  <ChevronRight className="h-5 w-5 text-gray-300 dark:text-gray-600 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" />
              </div>
            </div>
          </CardContent>
        </Card>
        );
      })}
    </div>
  );
}
