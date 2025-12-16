'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import {
  Users,
  MoreVertical,
  Shield,
  UserMinus,
  Loader2,
  Search,
  Crown,
  Briefcase,
  Mail,
  Phone,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { InviteAdminDialog } from '@/components/company/invite-admin-dialog';
import { cn } from '@/lib/utils';

interface CompanyMember {
  id: string;
  role: string;
  department: string | null;
  job_title: string | null;
  is_primary: boolean;
  joined_at: string;
  status: string;
  user: {
    id: string;
    full_name: string | null;
    email: string | null;
    avatar_url: string | null;
    phone: string | null;
  } | null;
}

const roleConfig: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  owner: { label: 'Owner', color: 'bg-purple-100 text-purple-700', icon: Crown },
  admin: { label: 'Admin', color: 'bg-blue-100 text-blue-700', icon: Shield },
  manager: { label: 'Manager', color: 'bg-emerald-100 text-emerald-700', icon: Briefcase },
  hr: { label: 'HR', color: 'bg-pink-100 text-pink-700', icon: Users },
  accountant: { label: 'Accountant', color: 'bg-amber-100 text-amber-700', icon: Briefcase },
  member: { label: 'Member', color: 'bg-gray-100 text-gray-700', icon: Users },
  viewer: { label: 'Viewer', color: 'bg-gray-100 text-gray-500', icon: Users },
};

export default function CompanyMembersPage() {
  const [members, setMembers] = useState<CompanyMember[]>([]);
  const [myRole, setMyRole] = useState<string>('member');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [companyId, setCompanyId] = useState<string | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanyAndMembers();
  }, []);

  const fetchCompanyAndMembers = async () => {
    try {
      // First get active company
      const companyResponse = await fetch('/api/company/settings');
      const companyData = await companyResponse.json();

      if (!companyResponse.ok || !companyData.company) {
        setLoading(false);
        return;
      }

      setCompanyId(companyData.company.id);

      // Then fetch members
      const membersResponse = await fetch(`/api/user/companies/${companyData.company.id}/members`);
      const membersData = await membersResponse.json();

      if (membersResponse.ok && membersData.success) {
        setMembers(membersData.members || []);
        setMyRole(membersData.my_role || 'member');
      }
    } catch (error) {
      console.error('Error fetching members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!companyId) return;

    try {
      const response = await fetch(`/api/user/companies/${companyId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Member Removed',
          description: 'The member has been removed from the company',
        });
        fetchCompanyAndMembers();
      } else {
        const data = await response.json();
        throw new Error(data.error);
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const canManageMembers = ['owner', 'admin'].includes(myRole);

  const getInitials = (name: string | null) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredMembers = members.filter((member: CompanyMember) => {
    const name = member.user?.full_name || '';
    const email = member.user?.email || '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!companyId) {
    return (
      <Card className="max-w-lg mx-auto mt-12">
        <CardContent className="py-12 text-center">
          <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Company Selected</h2>
          <p className="text-gray-500">Please select a company from the header dropdown.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6" />
            Company Members
          </h1>
          <p className="text-gray-500">Manage who has access to this company</p>
        </div>
        {canManageMembers && (
          <InviteAdminDialog onSuccess={fetchCompanyAndMembers} />
        )}
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <Input
          placeholder="Search members..."
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Members Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member: CompanyMember) => {
          const defaultRole = { label: 'Member', color: 'bg-gray-100 text-gray-700', icon: Users };
          const roleCfg = roleConfig[member.role] || defaultRole;
          const RoleIcon = roleCfg.icon;

          return (
            <Card key={member.id} className="group hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={member.user?.avatar_url || undefined} />
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                      {getInitials(member.user?.full_name ?? null)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold truncate">
                        {member.user?.full_name || 'Unknown'}
                      </h3>
                      {member.is_primary && (
                        <Badge variant="outline" className="text-xs">Primary</Badge>
                      )}
                    </div>

                    <Badge className={cn('mt-1', roleCfg?.color ?? 'bg-gray-100 text-gray-700')}>
                      <RoleIcon className="h-3 w-3 mr-1" />
                      {roleCfg?.label ?? 'Member'}
                    </Badge>

                    {member.user?.email && (
                      <p className="text-sm text-gray-500 mt-2 flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3" />
                        {member.user.email}
                      </p>
                    )}

                    {member.job_title && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        {member.job_title}
                      </p>
                    )}
                  </div>

                  {canManageMembers && member.role !== 'owner' && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Shield className="h-4 w-4 mr-2" />
                          Change Role
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-red-600"
                          onClick={() => handleRemoveMember(member.id)}
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredMembers.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Members Found</h3>
            <p className="text-gray-500">
              {searchTerm ? 'Try a different search term' : 'Invite team members to get started'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

