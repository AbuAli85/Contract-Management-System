'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MoreVertical, User } from 'lucide-react';

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
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'on_leave':
        return 'bg-yellow-100 text-yellow-800';
      case 'terminated':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (members.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No team members found</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {members.map(member => (
        <Card
          key={member.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onMemberSelect(member)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                  {member.employee.avatar_url ? (
                    <img
                      src={member.employee.avatar_url}
                      alt={member.employee.full_name}
                      className="h-10 w-10 rounded-full"
                    />
                  ) : (
                    <User className="h-5 w-5 text-gray-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{member.employee.full_name}</h3>
                  <p className="text-sm text-gray-500">{member.employee.email}</p>
                  {member.job_title && (
                    <p className="text-sm text-gray-600">{member.job_title}</p>
                  )}
                </div>
                <div className="text-right">
                  {member.employee_code && (
                    <p className="text-sm text-gray-500">#{member.employee_code}</p>
                  )}
                  <Badge className={getStatusColor(member.employment_status)}>
                    {member.employment_status}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

