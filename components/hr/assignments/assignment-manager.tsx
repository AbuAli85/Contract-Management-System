'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
  Building2,
  Calendar,
  MapPin,
  Plus,
  Eye,
  Edit,
  Trash2,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { AssignmentFormDialog } from './assignment-form-dialog';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useCompany } from '@/components/providers/company-provider';
import Link from 'next/link';

interface Assignment {
  id: string;
  employer_employee_id: string;
  client_party_id: string;
  assignment_type: string;
  job_title: string;
  department?: string;
  work_location?: string;
  start_date: string;
  end_date?: string;
  status: 'active' | 'completed' | 'terminated' | 'transferred' | 'on_hold';
  deployment_letter_id?: string;
  client_contact_person?: string;
  client_contact_email?: string;
  client_contact_phone?: string;
  created_at: string;
  employer_employee?: {
    employee: {
      name_en?: string;
      name_ar?: string;
      email?: string;
    };
  };
  client?: {
    name_en?: string;
    name_ar?: string;
  };
  deployment_letter?: {
    id: string;
    contract_number?: string;
    status?: string;
  };
}

interface AssignmentManagerProps {
  employerEmployeeId?: string;
  locale?: string;
}

export function AssignmentManager({ employerEmployeeId, locale = 'en' }: AssignmentManagerProps) {
  const { companyId } = useCompany();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formDialogOpen, setFormDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch assignments
  const {
    data: assignmentsData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['assignments', employerEmployeeId, companyId, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (employerEmployeeId) {
        params.append('employer_employee_id', employerEmployeeId);
      }
      if (filterStatus !== 'all') {
        params.append('status', filterStatus);
      } else {
        params.append('active_only', 'false');
      }
      
      const response = await fetch(`/api/hr/assignments?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch assignments');
      }
      
      return response.json();
    },
  });

  const assignments: Assignment[] = assignmentsData?.assignments || [];

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason?: string }) => {
      const response = await fetch(`/api/hr/assignments/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ termination_reason: reason || 'Terminated by user' }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete assignment');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments'] });
      toast({
        title: locale === 'ar' ? 'تم الإنهاء بنجاح' : 'Assignment Terminated',
        description: locale === 'ar' ? 'تم إنهاء التعيين بنجاح' : 'Assignment has been terminated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: locale === 'ar' ? 'خطأ' : 'Error',
        description: error instanceof Error ? error.message : 'Failed to terminate assignment',
        variant: 'destructive',
      });
    },
  });

  const getStatusBadge = (status: Assignment['status']) => {
    switch (status) {
      case 'active':
        return (
          <Badge className="bg-green-500 hover:bg-green-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            {locale === 'ar' ? 'نشط' : 'Active'}
          </Badge>
        );
      case 'completed':
        return (
          <Badge className="bg-blue-500 hover:bg-blue-600">
            <CheckCircle className="h-3 w-3 mr-1" />
            {locale === 'ar' ? 'مكتمل' : 'Completed'}
          </Badge>
        );
      case 'terminated':
        return (
          <Badge className="bg-red-500 hover:bg-red-600">
            <XCircle className="h-3 w-3 mr-1" />
            {locale === 'ar' ? 'منتهي' : 'Terminated'}
          </Badge>
        );
      case 'on_hold':
        return (
          <Badge className="bg-yellow-500 hover:bg-yellow-600">
            <Clock className="h-3 w-3 mr-1" />
            {locale === 'ar' ? 'معلق' : 'On Hold'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAssignmentTypeLabel = (type: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      deployment: { en: 'Deployment', ar: 'نشر' },
      temporary: { en: 'Temporary', ar: 'مؤقت' },
      project: { en: 'Project', ar: 'مشروع' },
      consultation: { en: 'Consultation', ar: 'استشارة' },
      training: { en: 'Training', ar: 'تدريب' },
    };
    
    return labels[type]?.[locale as 'en' | 'ar'] || type;
  };

  const isActive = (assignment: Assignment) => {
    if (assignment.status !== 'active') return false;
    const today = new Date();
    const startDate = new Date(assignment.start_date);
    const endDate = assignment.end_date ? new Date(assignment.end_date) : null;
    
    return startDate <= today && (!endDate || endDate >= today);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'ar' ? 'التعيينات' : 'Assignments'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{locale === 'ar' ? 'التعيينات' : 'Assignments'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-red-600">
            {locale === 'ar' ? 'فشل تحميل التعيينات' : 'Failed to load assignments'}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {locale === 'ar' ? 'إدارة التعيينات' : 'Assignment Management'}
              </CardTitle>
              <CardDescription>
                {locale === 'ar'
                  ? `إجمالي التعيينات: ${assignments.length}`
                  : `Total Assignments: ${assignments.length}`}
              </CardDescription>
            </div>
            <Button onClick={() => {
              setEditingAssignment(null);
              setFormDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              {locale === 'ar' ? 'تعيين جديد' : 'New Assignment'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Status Filter */}
          <div className="mb-6">
            <div className="flex gap-2">
              {['all', 'active', 'completed', 'terminated', 'on_hold'].map((status) => (
                <Button
                  key={status}
                  variant={filterStatus === status ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setFilterStatus(status)}
                >
                  {status === 'all' && (locale === 'ar' ? 'الكل' : 'All')}
                  {status === 'active' && (locale === 'ar' ? 'نشط' : 'Active')}
                  {status === 'completed' && (locale === 'ar' ? 'مكتمل' : 'Completed')}
                  {status === 'terminated' && (locale === 'ar' ? 'منتهي' : 'Terminated')}
                  {status === 'on_hold' && (locale === 'ar' ? 'معلق' : 'On Hold')}
                </Button>
              ))}
            </div>
          </div>

          {/* Assignments Table */}
          {assignments.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{locale === 'ar' ? 'لا توجد تعيينات' : 'No assignments found'}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{locale === 'ar' ? 'الموظف' : 'Employee'}</TableHead>
                    <TableHead>{locale === 'ar' ? 'العميل' : 'Client'}</TableHead>
                    <TableHead>{locale === 'ar' ? 'المسمى الوظيفي' : 'Job Title'}</TableHead>
                    <TableHead>{locale === 'ar' ? 'التواريخ' : 'Dates'}</TableHead>
                    <TableHead>{locale === 'ar' ? 'الحالة' : 'Status'}</TableHead>
                    <TableHead>{locale === 'ar' ? 'الإجراءات' : 'Actions'}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {assignments.map((assignment) => (
                    <TableRow
                      key={assignment.id}
                      className={cn(
                        !isActive(assignment) && assignment.status === 'active' && 'bg-yellow-50'
                      )}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gray-400" />
                          {assignment.employer_employee?.employee?.name_en ||
                            assignment.employer_employee?.employee?.name_ar ||
                            'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {assignment.client?.name_en ||
                            assignment.client?.name_ar ||
                            'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{assignment.job_title}</div>
                          {assignment.department && (
                            <div className="text-xs text-gray-500">{assignment.department}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(assignment.start_date), 'MMM dd, yyyy')}
                          </div>
                          {assignment.end_date && (
                            <div className="text-xs text-gray-500 mt-1">
                              {locale === 'ar' ? 'حتى' : 'Until'}{' '}
                              {format(new Date(assignment.end_date), 'MMM dd, yyyy')}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(assignment.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {assignment.deployment_letter && (
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                            >
                              <Link href={`/en/contracts/${assignment.deployment_letter.id}`}>
                                <FileText className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setEditingAssignment(assignment);
                              setFormDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          {assignment.status === 'active' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (confirm(locale === 'ar' ? 'هل أنت متأكد من إنهاء هذا التعيين؟' : 'Are you sure you want to terminate this assignment?')) {
                                  deleteMutation.mutate({ id: assignment.id });
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Assignment Form Dialog */}
      <AssignmentFormDialog
        open={formDialogOpen}
        onOpenChange={setFormDialogOpen}
        assignment={editingAssignment}
        employerEmployeeId={employerEmployeeId}
        locale={locale}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['assignments'] });
          setFormDialogOpen(false);
          setEditingAssignment(null);
        }}
      />
    </div>
  );
}

