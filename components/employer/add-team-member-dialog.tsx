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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Loader2, UserPlus, Search, Users, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

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
  isInTeam: boolean;
}

export function AddTeamMemberDialog({ onSuccess }: AddTeamMemberDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [availableEmployees, setAvailableEmployees] = useState<AvailableEmployee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<AvailableEmployee[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<AvailableEmployee | null>(null);
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

      const currentTeamIds = new Set((currentTeam || []).map(t => t.employee_id));

      // Fetch all profiles (promoters/employees)
      // These are the same people from the promoters page
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email, full_name, first_name, last_name, role, status')
        .order('full_name', { ascending: true });

      if (profilesError) throw profilesError;

      // Map to available employees and mark if already in team
      const employees: AvailableEmployee[] = (profiles || []).map(profile => ({
        id: profile.id,
        email: profile.email || '',
        full_name: profile.full_name || profile.first_name + ' ' + profile.last_name || 'Unknown',
        first_name: profile.first_name,
        last_name: profile.last_name,
        role: profile.role,
        status: profile.status,
        isInTeam: currentTeamIds.has(profile.id),
      }));

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
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployee) {
      setError('Please select an employee');
      return;
    }

    if (selectedEmployee.isInTeam) {
      setError('This employee is already in your team');
      return;
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
        title: 'Success',
        description: `${selectedEmployee.full_name} added to team successfully`,
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
      // Reset all state when dialog closes
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
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Add Team Member
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Team Member</DialogTitle>
          <DialogDescription>
            Select from available employees/promoters or search for a specific user
          </DialogDescription>
        </DialogHeader>

        {!selectedEmployee ? (
          // Employee Selection View
          <div className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Search Bar */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                type="text"
                placeholder="Search employees by name or email..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                <span className="text-gray-600">
                  {availableCount} Available
                </span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-gray-600">
                  {inTeamCount} Already in Team
                </span>
              </div>
            </div>

            {/* Employee List */}
            {loadingEmployees ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                <span className="ml-2 text-gray-600">Loading employees...</span>
              </div>
            ) : filteredEmployees.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Users className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p>No employees found</p>
                {searchTerm && (
                  <p className="text-sm mt-2">Try a different search term</p>
                )}
              </div>
            ) : (
              <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                {filteredEmployees.map(employee => {
                  const isSelected = selectedEmployee !== null && (selectedEmployee as AvailableEmployee).id === employee.id;
                  return (
                    <button
                      key={employee.id}
                      type="button"
                      onClick={() => handleEmployeeSelect(employee)}
                      disabled={employee.isInTeam || loading}
                      className={`w-full text-left p-4 border-b last:border-b-0 hover:bg-gray-50 transition-colors ${
                        employee.isInTeam
                          ? 'opacity-50 cursor-not-allowed bg-gray-50'
                          : 'cursor-pointer'
                      } ${isSelected ? 'bg-blue-50 border-blue-200' : ''}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium">{employee.full_name}</p>
                            {employee.isInTeam && (
                              <Badge variant="secondary" className="text-xs">
                                In Team
                              </Badge>
                            )}
                            {employee.role && (
                              <Badge variant="outline" className="text-xs">
                                {employee.role}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 mt-1">
                            {employee.email}
                          </p>
                        </div>
                        {!employee.isInTeam && (
                          <UserPlus className="h-5 w-5 text-gray-400" />
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
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Selected Employee Info */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-800">
                    Selected: {selectedEmployee.full_name}
                  </p>
                  <p className="text-xs text-blue-600">{selectedEmployee.email}</p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEmployee(null)}
                >
                  Change
                </Button>
              </div>
            </div>

            {/* Employment Details Form */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employee_code">Employee Code</Label>
                <Input
                  id="employee_code"
                  value={formData.employee_code}
                  onChange={e =>
                    setFormData({ ...formData, employee_code: e.target.value })
                  }
                  placeholder="EMP001"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="job_title">Job Title</Label>
                <Input
                  id="job_title"
                  value={formData.job_title}
                  onChange={e =>
                    setFormData({ ...formData, job_title: e.target.value })
                  }
                  placeholder="Software Engineer"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Input
                  id="department"
                  value={formData.department}
                  onChange={e =>
                    setFormData({ ...formData, department: e.target.value })
                  }
                  placeholder="Engineering"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="employment_type">Employment Type</Label>
                <Select
                  value={formData.employment_type}
                  onValueChange={value =>
                    setFormData({ ...formData, employment_type: value })
                  }
                >
                  <SelectTrigger id="employment_type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full_time">Full Time</SelectItem>
                    <SelectItem value="part_time">Part Time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="intern">Intern</SelectItem>
                    <SelectItem value="consultant">Consultant</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="hire_date">Hire Date</Label>
                <Input
                  id="hire_date"
                  type="date"
                  value={formData.hire_date}
                  onChange={e =>
                    setFormData({ ...formData, hire_date: e.target.value })
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="salary">Salary</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  value={formData.salary}
                  onChange={e =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="work_location">Work Location</Label>
              <Input
                id="work_location"
                value={formData.work_location}
                onChange={e =>
                  setFormData({ ...formData, work_location: e.target.value })
                }
                placeholder="Office / Remote"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <textarea
                id="notes"
                className="w-full min-h-[80px] px-3 py-2 border rounded-md"
                value={formData.notes}
                onChange={e =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Additional notes..."
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setSelectedEmployee(null);
                  setError('');
                }}
                disabled={loading}
              >
                Back
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add to Team
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
