'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import {
  Building2,
  Users,
  Calendar,
  DollarSign,
  FileText,
  CheckSquare,
  Clock,
  Star,
  TrendingUp,
  ArrowRight,
  Loader2,
  BarChart3,
  AlertTriangle,
  Plus,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface CompanyStats {
  employees: number;
  pending_leaves: number;
  pending_expenses: number;
  active_contracts: number;
  checked_in_today: number;
  open_tasks: number;
  pending_reviews: number;
}

interface CompanyData {
  id: string;
  name: string;
  logo_url: string | null;
  is_active: boolean;
  group_name: string | null;
  user_role: string;
  stats: CompanyStats;
}

interface Summary {
  total_companies: number;
  total_employees: number;
  total_pending_leaves: number;
  total_pending_expenses: number;
  total_contracts: number;
  total_open_tasks: number;
  total_checked_in: number;
}

const roleColors: Record<string, string> = {
  owner: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  manager: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
  hr: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400',
  member: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400',
};

export default function CrossCompanyDashboard() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [grouped, setGrouped] = useState<Record<string, CompanyData[]>>({});
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch('/api/company/cross-company-report');
      const data = await response.json();

      if (response.ok && data.success) {
        setCompanies(data.companies);
        setGrouped(data.grouped);
        setSummary(data.summary);
      } else {
        toast({
          title: 'Error',
          description: data.error,
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchToCompany = async (companyId: string) => {
    try {
      const response = await fetch('/api/user/companies/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ company_id: companyId }),
      });

      if (response.ok) {
        router.push('/en/employer/team');
        router.refresh();
      }
    } catch (error) {
      console.error('Error switching company:', error);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            Cross-Company Dashboard
          </h1>
          <p className="text-gray-500 mt-1">Overview of all your companies at a glance</p>
        </div>
        <Button onClick={() => router.push('/en/settings/company')}>
          <Plus className="h-4 w-4 mr-2" />
          Add Company
        </Button>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
          <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <Building2 className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{summary.total_companies}</p>
              <p className="text-sm opacity-80">Companies</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0">
            <CardContent className="pt-6">
              <Users className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{summary.total_employees}</p>
              <p className="text-sm opacity-80">Total Employees</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500 to-green-600 text-white border-0">
            <CardContent className="pt-6">
              <Clock className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{summary.total_checked_in}</p>
              <p className="text-sm opacity-80">Checked In Today</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
            <CardContent className="pt-6">
              <Calendar className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{summary.total_pending_leaves}</p>
              <p className="text-sm opacity-80">Pending Leaves</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-rose-500 to-pink-600 text-white border-0">
            <CardContent className="pt-6">
              <DollarSign className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{summary.total_pending_expenses}</p>
              <p className="text-sm opacity-80">Pending Expenses</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-violet-500 to-purple-600 text-white border-0">
            <CardContent className="pt-6">
              <FileText className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{summary.total_contracts}</p>
              <p className="text-sm opacity-80">Active Contracts</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-teal-500 to-cyan-600 text-white border-0">
            <CardContent className="pt-6">
              <CheckSquare className="h-8 w-8 mb-2 opacity-80" />
              <p className="text-3xl font-bold">{summary.total_open_tasks}</p>
              <p className="text-sm opacity-80">Open Tasks</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Companies by Group */}
      {Object.entries(grouped).map(([groupName, groupCompanies]) => (
        <div key={groupName} className="space-y-4">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">{groupName}</h2>
            <Badge variant="outline">{groupCompanies.length} companies</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {groupCompanies.map((company) => (
              <Card
                key={company.id}
                className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-0 shadow-md"
                onClick={() => handleSwitchToCompany(company.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-14 w-14 shadow-lg">
                      {company.logo_url ? (
                        <AvatarImage src={company.logo_url} />
                      ) : null}
                      <AvatarFallback className="text-lg font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                        {getInitials(company.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <span className="truncate">{company.name}</span>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600" />
                      </CardTitle>
                      <Badge className={cn('mt-1', roleColors[company.user_role] || roleColors.member)}>
                        {company.user_role}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="text-center p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Users className="h-4 w-4 mx-auto text-blue-600 mb-1" />
                      <p className="text-lg font-bold">{company.stats.employees}</p>
                      <p className="text-xs text-gray-500">Employees</p>
                    </div>
                    <div className="text-center p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                      <Clock className="h-4 w-4 mx-auto text-emerald-600 mb-1" />
                      <p className="text-lg font-bold">{company.stats.checked_in_today}</p>
                      <p className="text-xs text-gray-500">Present</p>
                    </div>
                    <div className="text-center p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                      <CheckSquare className="h-4 w-4 mx-auto text-amber-600 mb-1" />
                      <p className="text-lg font-bold">{company.stats.open_tasks}</p>
                      <p className="text-xs text-gray-500">Tasks</p>
                    </div>
                  </div>

                  {/* Pending Items */}
                  {(company.stats.pending_leaves > 0 || company.stats.pending_expenses > 0 || company.stats.pending_reviews > 0) && (
                    <div className="flex flex-wrap gap-2">
                      {company.stats.pending_leaves > 0 && (
                        <Badge variant="outline" className="gap-1 text-amber-600 border-amber-200 bg-amber-50">
                          <AlertTriangle className="h-3 w-3" />
                          {company.stats.pending_leaves} leave requests
                        </Badge>
                      )}
                      {company.stats.pending_expenses > 0 && (
                        <Badge variant="outline" className="gap-1 text-rose-600 border-rose-200 bg-rose-50">
                          <AlertTriangle className="h-3 w-3" />
                          {company.stats.pending_expenses} expenses
                        </Badge>
                      )}
                      {company.stats.pending_reviews > 0 && (
                        <Badge variant="outline" className="gap-1 text-purple-600 border-purple-200 bg-purple-50">
                          <Star className="h-3 w-3" />
                          {company.stats.pending_reviews} reviews
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Attendance Progress */}
                  {company.stats.employees > 0 && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>Today's Attendance</span>
                        <span>{Math.round((company.stats.checked_in_today / company.stats.employees) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(company.stats.checked_in_today / company.stats.employees) * 100} 
                        className="h-2"
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}

      {/* Empty State */}
      {companies.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Companies Yet</h3>
            <p className="text-gray-500 mb-4">Create your first company to get started</p>
            <Button onClick={() => router.push('/en/settings/company')}>
              <Plus className="h-4 w-4 mr-2" />
              Create Company
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

