'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Loader2,
  UserPlus,
  Search,
  Users,
  CheckCircle2,
  Briefcase,
  Calendar,
  MapPin,
  DollarSign,
  Building2,
  FileText,
  ArrowLeft,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';

interface AddTeamMemberDialogProps {
  onSuccess?: () => void;
}

interface AvailableEmployee {
  id: string;
  email: string;
  full_name: string;
  first_name?: string;
  last_name?: string;
  role?: string;
  status?: string;
  avatar_url?: string;
  isInTeam: boolean;
}

const CURRENCIES = [
  { value: 'OMR', label: 'OMR', symbol: 'ر.ع.' },
  { value: 'USD', label: 'USD', symbol: '$' },
  { value: 'AED', label: 'AED', symbol: 'د.إ' },
  { value: 'SAR', label: 'SAR', symbol: '﷼' },
  { value: 'EUR', label: 'EUR', symbol: '€' },
  { value: 'GBP', label: 'GBP', symbol: '£' },
];

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time', icon: '🏢' },
  { value: 'part_time', label: 'Part Time', icon: '⏰' },
  { value: 'contract', label: 'Contract', icon: '📝' },
  { value: 'intern', label: 'Intern', icon: '🎓' },
  { value: 'consultant', label: 'Consultant', icon: '💼' },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getStatusColor(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'active':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400';
    case 'pending':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400';
  }
}

export function AddTeamMemberDialog({ onSuccess }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableEmployees, setAvailableEmployees] = useState<
    AvailableEmployee[]
  >([]);
  const [filteredEmployees, setFilteredEmployees] = useState<
    AvailableEmployee[]
  >([]);
  const [selectedEmployee, setSelectedEmployee] =
    useState<AvailableEmployee | null>(null);
  const [formData, setFormData] = useState({
    employee_code: '',
    job_title: '',
    department: '',
    employment_type: 'full_time',
    hire_date: '',
    reporting_manager_id: '',
    salary: '',
    currency: 'OMR',
    work_location: '',
    notes: '',
  });
  const { toast } = useToast();

  // Fetch available employees/promoters when dialog opens
  useEffect(() => {
    if (open) {
      fetchAvailableEmployees();
    }
  }, [open]);

  // Filter employees based on search term
  useEffect(() => {
    if (searchTerm.trim()) {
      const filtered = availableEmployees.filter(
        emp =>
          emp.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.last_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredEmployees(filtered);
    } else {
      setFilteredEmployees(availableEmployees);
    }
  }, [searchTerm, availableEmployees]);

  const fetchAvailableEmployees = async () => {
    try {
      setLoadingEmployees(true);
      setError('');
      const supabase = createClient();

      if (!supabase) {
        throw new Error('Database connection unavailable');
      }

      // Get current user to determine employer
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get current team members to filter them out
      const { data: currentTeam } = await supabase
        .from('employer_employees')
        .select('employee_id')
        .eq('employer_id', user.id)
        .eq('employment_status', 'active');

      const currentTeamIds = new Set(
        (currentTeam || []).map(t => t.employee_id)
      );

      // ✅ COMPANY SCOPE: Get company's party_id to filter promoters
      const { data: userProfile } = await supabase
        .from('profiles')
        .select('active_company_id, email')
        .eq('id', user.id)
        .single();

      let employerEmail: string | null = null;
      let companyPartyId: string | null = null;

      if (userProfile?.active_company_id) {
        const { data: company } = await supabase
          .from('companies')
          .select('party_id')
          .eq('id', userProfile.active_company_id)
          .single();

        if (company?.party_id) {
          companyPartyId = company.party_id;
          const { data: party } = await supabase
            .from('parties')
            .select('contact_email')
            .eq('id', companyPartyId)
            .single();

          employerEmail =
            party?.contact_email?.toLowerCase() ||
            userProfile.email?.toLowerCase() ||
            null;
        }
      }

      // Fetch all promoters (employees) from the promoters table
      // ✅ COMPANY SCOPE: Filter by company's party_id if available
      let promotersQuery = supabase
        .from('promoters')
        .select(
          'id, name_en, name_ar, email, mobile_number, phone, status, employer_id, profile_picture_url'
        )
        .order('name_en', { ascending: true });

      if (companyPartyId) {
        promotersQuery = promotersQuery.eq('employer_id', companyPartyId);
      }

      const { data: allPromoters, error: promotersError } =
        await promotersQuery;

      if (promotersError) throw promotersError;

      // Filter out inactive/terminated promoters AND employer themselves
      const promoters = (allPromoters || []).filter(promoter => {
        // Exclude inactive/terminated
        if (
          promoter.status === 'terminated' ||
          promoter.status === 'suspended' ||
          promoter.status === 'inactive'
        ) {
          return false;
        }

        // ✅ FIX: Exclude employer themselves from employee list
        if (employerEmail && promoter.email?.toLowerCase() === employerEmail) {
          return false;
        }

        return true;
      });

      // Map to available employees and mark if already in team
      const employees: AvailableEmployee[] = (promoters || []).map(
        promoter => ({
          id: promoter.id,
          email: promoter.email || '',
          full_name: promoter.name_en || promoter.name_ar || 'Unknown',
          first_name: promoter.name_en?.split(' ')[0] || undefined,
          last_name:
            promoter.name_en?.split(' ').slice(1).join(' ') || undefined,
          role: 'promoter',
          status: promoter.status || 'active',
          avatar_url: promoter.profile_picture_url || undefined,
          isInTeam: currentTeamIds.has(promoter.id),
        })
      );

      setAvailableEmployees(employees);
      setFilteredEmployees(employees);
    } catch (err) {
      console.error('Error fetching available employees:', err);
      setError('Failed to load available employees');
      toast({
        title: 'Error',
        description: 'Failed to load employees list',
        variant: 'destructive',
      });
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleEmployeeSelect = (employee: AvailableEmployee) => {
    if (employee.isInTeam) {
      toast({
        title: 'Already in Team',
        description: `${employee.full_name} is already in your team`,
        variant: 'default',
      });
      return;
    }
    setSelectedEmployee(employee);
    setError('');
    // Reset form data when selecting a new employee
    setFormData({
      employee_code: '',
      job_title: '',
      department: '',
      employment_type: 'full_time',
      hire_date: new Date().toISOString().split('T')[0], // Default to today
      reporting_manager_id: '',
      salary: '',
      currency: 'OMR',
      work_location: '',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      setError('Please select an employee');
      toast({
        title: 'Validation Error',
        description: 'Please select an employee to add to your team',
        variant: 'destructive',
      });
      return;
    }

    if (selectedEmployee.isInTeam) {
      setError('This employee is already in your team');
      toast({
        title: 'Already in Team',
        description: `${selectedEmployee.full_name} is already a member of your team`,
        variant: 'default',
      });
      return;
    }

    // Validate salary if provided
    if (
      formData.salary &&
      (isNaN(parseFloat(formData.salary)) || parseFloat(formData.salary) < 0)
    ) {
      setError('Salary must be a valid positive number');
      toast({
        title: 'Validation Error',
        description: 'Please enter a valid salary amount',
        variant: 'destructive',
      });
      return;
    }

    // Validate hire date if provided
    if (formData.hire_date) {
      const hireDate = new Date(formData.hire_date);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      if (hireDate > today) {
        setError('Hire date cannot be in the future');
        toast({
          title: 'Validation Error',
          description: 'Hire date must be today or in the past',
          variant: 'destructive',
        });
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/employer/team', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          employee_id: selectedEmployee.id,
          ...formData,
          salary: formData.salary ? parseFloat(formData.salary) : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add team member');
      }

      toast({
        title: '🎉 Team member added!',
        description: `${selectedEmployee.full_name} has been added to your team successfully`,
      });

      setOpen(false);
      setSelectedEmployee(null);
      setSearchTerm('');
      setFormData({
        employee_code: '',
        job_title: '',
        department: '',
        employment_type: 'full_time',
        hire_date: '',
        reporting_manager_id: '',
        salary: '',
        currency: 'OMR',
        work_location: '',
        notes: '',
      });

      if (onSuccess) {
        onSuccess();
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to add team member';
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

  const availableCount = filteredEmployees.filter(e => !e.isInTeam).length;
  const inTeamCount = filteredEmployees.filter(e => e.isInTeam).length;

  // Reset form when dialog closes
  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setSelectedEmployee(null);
      setSearchTerm('');
      setError('');
      setFormData({
        employee_code: '',
        job_title: '',
        department: '',
        employment_type: 'full_time',
        hire_date: '',
        reporting_manager_id: '',
        salary: '',
        currency: 'OMR',
        work_location: '',
        notes: '',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className='gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-500/25'>
          <UserPlus className='h-4 w-4' />
          Add Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-[700px] max-h-[90vh] overflow-y-auto p-0'>
        <DialogHeader className='p-6 pb-4 border-b bg-gradient-to-r from-slate-50 to-blue-50/50 dark:from-slate-900 dark:to-blue-950/20'>
          <DialogTitle className='flex items-center gap-2 text-xl'>
            <div className='p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50'>
              <UserPlus className='h-5 w-5 text-blue-600 dark:text-blue-400' />
            </div>
            Add Team Member
          </DialogTitle>
          <DialogDescription className='text-slate-500 dark:text-slate-400'>
            {!selectedEmployee
              ? 'Select from available employees/promoters or search for a specific user'
              : 'Fill in the employment details for the selected team member'}
          </DialogDescription>
        </DialogHeader>

        <div className='p-6'>
          {!selectedEmployee ? (
            // Employee Selection View
            <div className='space-y-4'>
              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Search Bar */}
              <div className='relative'>
                <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400' />
                <Input
                  type='text'
                  placeholder='Search employees by name or email...'
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className='pl-10 h-11 bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-blue-500/20'
                />
              </div>

              {/* Stats Pills */}
              <div className='flex gap-3'>
                <div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium'>
                  <Users className='h-4 w-4' />
                  {availableCount} Available
                </div>
                <div className='flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm font-medium'>
                  <CheckCircle2 className='h-4 w-4' />
                  {inTeamCount} In Team
                </div>
              </div>

              {/* Employee List */}
              {loadingEmployees ? (
                <div className='flex flex-col items-center justify-center py-16 text-slate-500'>
                  <Loader2 className='h-8 w-8 animate-spin text-blue-500 mb-3' />
                  <span>Loading employees...</span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className='text-center py-16 text-slate-500'>
                  <div className='w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center'>
                    <Users className='h-8 w-8 text-slate-400' />
                  </div>
                  <p className='font-medium'>No employees found</p>
                  {searchTerm && (
                    <p className='text-sm mt-1 text-slate-400'>
                      Try a different search term
                    </p>
                  )}
                </div>
              ) : (
                <div className='border rounded-xl overflow-hidden max-h-[350px] overflow-y-auto bg-white dark:bg-slate-900'>
                  {filteredEmployees.map((employee, index) => {
                    const isSelected = selectedEmployee?.id === employee.id;
                    return (
                      <button
                        key={employee.id}
                        type='button'
                        onClick={() => handleEmployeeSelect(employee)}
                        disabled={employee.isInTeam || loading}
                        className={cn(
                          'w-full text-left p-4 transition-all duration-200',
                          index !== filteredEmployees.length - 1 &&
                            'border-b border-slate-100 dark:border-slate-800',
                          employee.isInTeam
                            ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800/50'
                            : 'cursor-pointer hover:bg-blue-50/50 dark:hover:bg-blue-900/20',
                          isSelected &&
                            'bg-blue-50 dark:bg-blue-900/30 ring-2 ring-inset ring-blue-500'
                        )}
                      >
                        <div className='flex items-center gap-4'>
                          <Avatar className='h-11 w-11 border-2 border-white dark:border-slate-700 shadow-sm'>
                            <AvatarImage
                              src={employee.avatar_url}
                              alt={employee.full_name}
                            />
                            <AvatarFallback className='bg-gradient-to-br from-blue-500 to-indigo-600 text-white text-sm font-medium'>
                              {getInitials(employee.full_name)}
                            </AvatarFallback>
                          </Avatar>

                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2 flex-wrap'>
                              <p className='font-semibold text-slate-900 dark:text-white truncate'>
                                {employee.full_name}
                              </p>
                              {employee.isInTeam && (
                                <Badge className='bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 text-xs'>
                                  ✓ In Team
                                </Badge>
                              )}
                              {employee.status && !employee.isInTeam && (
                                <Badge
                                  className={cn(
                                    'text-xs',
                                    getStatusColor(employee.status)
                                  )}
                                >
                                  {employee.status}
                                </Badge>
                              )}
                            </div>
                            <p className='text-sm text-slate-500 dark:text-slate-400 truncate mt-0.5'>
                              {employee.email || 'No email'}
                            </p>
                          </div>

                          {!employee.isInTeam && (
                            <div className='flex-shrink-0 w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center'>
                              <UserPlus className='h-4 w-4 text-blue-600 dark:text-blue-400' />
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            // Employee Details Form
            <form onSubmit={handleSubmit} className='space-y-5'>
              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Selected Employee Card */}
              <div className='p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl'>
                <div className='flex items-center gap-4'>
                  <Avatar className='h-14 w-14 border-2 border-white dark:border-slate-700 shadow-md'>
                    <AvatarImage
                      src={selectedEmployee.avatar_url}
                      alt={selectedEmployee.full_name}
                    />
                    <AvatarFallback className='bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-semibold'>
                      {getInitials(selectedEmployee.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className='flex-1 min-w-0'>
                    <p className='font-semibold text-slate-900 dark:text-white text-lg'>
                      {selectedEmployee.full_name}
                    </p>
                    <p className='text-sm text-slate-500 dark:text-slate-400'>
                      {selectedEmployee.email}
                    </p>
                  </div>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setSelectedEmployee(null)}
                    className='gap-1.5'
                  >
                    <ArrowLeft className='h-3.5 w-3.5' />
                    Change
                  </Button>
                </div>
              </div>

              {/* Employment Details Form */}
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label
                    htmlFor='employee_code'
                    className='flex items-center gap-2 text-slate-700 dark:text-slate-300'
                  >
                    <FileText className='h-3.5 w-3.5' />
                    Employee Code
                  </Label>
                  <Input
                    id='employee_code'
                    value={formData.employee_code}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        employee_code: e.target.value,
                      })
                    }
                    placeholder='e.g., EMP001'
                    className='h-10'
                  />
                </div>

                <div className='space-y-2'>
                  <Label
                    htmlFor='job_title'
                    className='flex items-center gap-2 text-slate-700 dark:text-slate-300'
                  >
                    <Briefcase className='h-3.5 w-3.5' />
                    Job Title
                  </Label>
                  <Input
                    id='job_title'
                    value={formData.job_title}
                    onChange={e =>
                      setFormData({ ...formData, job_title: e.target.value })
                    }
                    placeholder='e.g., Sales Representative'
                    className='h-10'
                  />
                </div>

                <div className='space-y-2'>
                  <Label
                    htmlFor='department'
                    className='flex items-center gap-2 text-slate-700 dark:text-slate-300'
                  >
                    <Building2 className='h-3.5 w-3.5' />
                    Department
                  </Label>
                  <Input
                    id='department'
                    value={formData.department}
                    onChange={e =>
                      setFormData({ ...formData, department: e.target.value })
                    }
                    placeholder='e.g., Sales, Marketing'
                    className='h-10'
                  />
                </div>

                <div className='space-y-2'>
                  <Label
                    htmlFor='employment_type'
                    className='flex items-center gap-2 text-slate-700 dark:text-slate-300'
                  >
                    <Sparkles className='h-3.5 w-3.5' />
                    Employment Type
                  </Label>
                  <Select
                    value={formData.employment_type}
                    onValueChange={value =>
                      setFormData({ ...formData, employment_type: value })
                    }
                  >
                    <SelectTrigger id='employment_type' className='h-10'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {EMPLOYMENT_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <span className='flex items-center gap-2'>
                            <span>{type.icon}</span>
                            <span>{type.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label
                    htmlFor='hire_date'
                    className='flex items-center gap-2 text-slate-700 dark:text-slate-300'
                  >
                    <Calendar className='h-3.5 w-3.5' />
                    Hire Date
                  </Label>
                  <Input
                    id='hire_date'
                    type='date'
                    value={formData.hire_date}
                    onChange={e =>
                      setFormData({ ...formData, hire_date: e.target.value })
                    }
                    max={new Date().toISOString().split('T')[0]}
                    className='h-10'
                  />
                </div>

                <div className='space-y-2'>
                  <Label
                    htmlFor='salary'
                    className='flex items-center gap-2 text-slate-700 dark:text-slate-300'
                  >
                    <DollarSign className='h-3.5 w-3.5' />
                    Salary
                  </Label>
                  <div className='flex gap-2'>
                    <Select
                      value={formData.currency}
                      onValueChange={value =>
                        setFormData({ ...formData, currency: value })
                      }
                    >
                      <SelectTrigger className='w-24 h-10'>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(currency => (
                          <SelectItem
                            key={currency.value}
                            value={currency.value}
                          >
                            {currency.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id='salary'
                      type='number'
                      step='0.01'
                      min='0'
                      value={formData.salary}
                      onChange={e =>
                        setFormData({ ...formData, salary: e.target.value })
                      }
                      placeholder='0.00'
                      className='flex-1 h-10'
                    />
                  </div>
                </div>
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='work_location'
                  className='flex items-center gap-2 text-slate-700 dark:text-slate-300'
                >
                  <MapPin className='h-3.5 w-3.5' />
                  Work Location
                </Label>
                <Input
                  id='work_location'
                  value={formData.work_location}
                  onChange={e =>
                    setFormData({ ...formData, work_location: e.target.value })
                  }
                  placeholder='e.g., Office, Remote, Hybrid, Store Name'
                  className='h-10'
                />
              </div>

              <div className='space-y-2'>
                <Label
                  htmlFor='notes'
                  className='text-slate-700 dark:text-slate-300'
                >
                  Notes (Optional)
                </Label>
                <Textarea
                  id='notes'
                  value={formData.notes}
                  onChange={e =>
                    setFormData({ ...formData, notes: e.target.value })
                  }
                  placeholder='Any additional notes about this team member...'
                  className='min-h-[80px] resize-none'
                />
              </div>

              <DialogFooter className='gap-2 pt-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => {
                    setSelectedEmployee(null);
                    setError('');
                  }}
                  disabled={loading}
                  className='gap-2'
                >
                  <ArrowLeft className='h-4 w-4' />
                  Back
                </Button>
                <Button
                  type='submit'
                  disabled={loading}
                  className='gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white min-w-[140px]'
                >
                  {loading ? (
                    <>
                      <Loader2 className='h-4 w-4 animate-spin' />
                      Adding...
                    </>
                  ) : (
                    <>
                      <UserPlus className='h-4 w-4' />
                      Add to Team
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
