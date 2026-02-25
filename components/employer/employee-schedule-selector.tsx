'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Users,
  Search,
  MapPin,
  Building2,
  UserPlus,
  X,
  CheckCircle2,
  Filter,
  Download,
  Upload,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface Employee {
  id: string;
  employee_code?: string;
  job_title?: string;
  department?: string;
  employee: {
    id: string;
    full_name: string;
    email: string;
    phone?: string;
  };
}

interface EmployeeGroup {
  id: string;
  name: string;
  description?: string;
  group_type: 'location' | 'department' | 'custom' | 'project';
  office_location?: {
    id: string;
    name: string;
    address: string;
  };
  employee_count: number;
}

interface EmployeeScheduleSelectorProps {
  companyId?: string;
  selectedEmployeeIds: string[];
  selectedGroupIds: string[];
  assignmentType: 'all' | 'selected' | 'groups' | 'location_based';
  onSelectionChange: (data: {
    employeeIds: string[];
    groupIds: string[];
    assignmentType: 'all' | 'selected' | 'groups' | 'location_based';
  }) => void;
  showLocationBased?: boolean;
}

export function EmployeeScheduleSelector({
  companyId,
  selectedEmployeeIds = [],
  selectedGroupIds = [],
  assignmentType = 'all',
  onSelectionChange,
  showLocationBased = true,
}: EmployeeScheduleSelectorProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [groups, setGroups] = useState<EmployeeGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoterOnlyCount, setPromoterOnlyCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployees();
    fetchGroups();
  }, [companyId]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      // Note: API doesn't filter by status parameter, so we filter in component
      const response = await fetch('/api/employer/team');
      const data = await response.json();

      if (response.ok) {
        // The API returns 'team' not 'employees', and also check for 'employees' for compatibility
        const teamMembers = data.team || data.employees || [];

        // Count promoter-only vs actual employees
        const promoterOnly = teamMembers.filter((e: any) =>
          e.id?.toString().startsWith('promoter_')
        );
        const actualEmployees = teamMembers.filter(
          (e: any) => e.id && !e.id.toString().startsWith('promoter_')
        );
        setPromoterOnlyCount(promoterOnly.length);

        if (teamMembers.length === 0) {
          console.warn('No employees found. Response:', data);
          setEmployees([]);
          return;
        }

        // Map the response to match our Employee interface
        const mappedEmployees = teamMembers
          .filter((emp: any) => {
            // Filter out promoter-only records (they have IDs starting with 'promoter_')
            // Only include actual employer_employee records
            // NOTE: Promoter-only records cannot be assigned to attendance groups
            // because attendance_group_assignments requires employer_employee_id
            const hasValidId =
              emp.id && !emp.id.toString().startsWith('promoter_');

            // Filter by active status - be lenient (null/undefined means active)
            const isActive =
              !emp.employment_status || emp.employment_status === 'active';

            // Must have employee data (from promoters table)
            const hasEmployeeData =
              emp.employee !== null && emp.employee !== undefined;

            const isValid = hasValidId && isActive && hasEmployeeData;

            if (!isValid && hasValidId) {
            }

            return isValid;
          })
          .map((emp: any) => {
            // Handle different response structures
            // The API returns employee data in emp.employee (from promoters table)
            const employeeProfile = emp.employee || {};
            const employeeId = employeeProfile?.id || emp.employee_id;

            const mapped = {
              id: emp.id, // employer_employee.id (this is what we need for assignments)
              employee_code: emp.employee_code || null,
              job_title: emp.job_title || null,
              department: emp.department || null,
              employee: {
                id: employeeId,
                full_name:
                  employeeProfile?.full_name ||
                  employeeProfile?.name_en ||
                  employeeProfile?.name ||
                  'Unknown Employee',
                email: employeeProfile?.email || '',
                phone:
                  employeeProfile?.phone ||
                  employeeProfile?.mobile_number ||
                  '',
              },
            };

            return mapped;
          });

        setEmployees(mappedEmployees);
      } else {
        console.error('Failed to fetch employees:', data.error);
        setEmployees([]);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setEmployees([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await fetch('/api/employer/attendance-groups');
      const data = await response.json();

      if (response.ok && data.groups) {
        setGroups(data.groups);
      }
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const departments = useMemo(() => {
    const depts = new Set<string>();
    employees.forEach(emp => {
      if (emp.department) {
        depts.add(emp.department);
      }
    });
    return Array.from(depts).sort();
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    let filtered = employees;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        emp =>
          emp.employee.full_name.toLowerCase().includes(query) ||
          emp.employee.email.toLowerCase().includes(query) ||
          emp.employee_code?.toLowerCase().includes(query) ||
          emp.job_title?.toLowerCase().includes(query)
      );
    }

    if (departmentFilter !== 'all') {
      filtered = filtered.filter(emp => emp.department === departmentFilter);
    }

    return filtered;
  }, [employees, searchQuery, departmentFilter]);

  const locationBasedGroups = useMemo(() => {
    return groups.filter(g => g.group_type === 'location');
  }, [groups]);

  const handleAssignmentTypeChange = (
    type: 'all' | 'selected' | 'groups' | 'location_based'
  ) => {
    onSelectionChange({
      employeeIds: type === 'selected' ? selectedEmployeeIds : [],
      groupIds: type === 'groups' ? selectedGroupIds : [],
      assignmentType: type,
    });
  };

  const handleEmployeeToggle = (employeeId: string) => {
    const newIds = selectedEmployeeIds.includes(employeeId)
      ? selectedEmployeeIds.filter(id => id !== employeeId)
      : [...selectedEmployeeIds, employeeId];

    onSelectionChange({
      employeeIds: newIds,
      groupIds: selectedGroupIds,
      assignmentType: 'selected',
    });
  };

  const handleSelectAll = () => {
    const allIds = filteredEmployees.map(emp => emp.id);
    onSelectionChange({
      employeeIds: allIds,
      groupIds: selectedGroupIds,
      assignmentType: 'selected',
    });
  };

  const handleDeselectAll = () => {
    onSelectionChange({
      employeeIds: [],
      groupIds: selectedGroupIds,
      assignmentType: 'selected',
    });
  };

  const handleGroupToggle = (groupId: string) => {
    const newIds = selectedGroupIds.includes(groupId)
      ? selectedGroupIds.filter(id => id !== groupId)
      : [...selectedGroupIds, groupId];

    onSelectionChange({
      employeeIds: selectedEmployeeIds,
      groupIds: newIds,
      assignmentType: 'groups',
    });
  };

  const handleLocationBasedSelect = (locationId: string) => {
    // Find groups for this location
    const locationGroups = groups.filter(
      g => g.office_location?.id === locationId
    );
    const groupIds = locationGroups.map(g => g.id);

    onSelectionChange({
      employeeIds: [],
      groupIds,
      assignmentType: 'location_based',
    });
  };

  return (
    <div className='space-y-4'>
      <Tabs
        value={assignmentType}
        onValueChange={value =>
          handleAssignmentTypeChange(
            value as 'all' | 'selected' | 'groups' | 'location_based'
          )
        }
      >
        <TabsList className='grid w-full grid-cols-4'>
          <TabsTrigger value='all'>All Employees</TabsTrigger>
          <TabsTrigger value='selected'>Selected</TabsTrigger>
          <TabsTrigger value='groups'>Groups</TabsTrigger>
          {showLocationBased && (
            <TabsTrigger value='location_based'>By Location</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value='all' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Users className='h-5 w-5' />
                All Active Employees
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground'>
                This schedule will be sent to all active employees in your
                company.
              </p>
              <div className='mt-4 flex items-center gap-2'>
                <Badge variant='secondary'>{employees.length} employees</Badge>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='selected' className='space-y-4'>
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <CardTitle className='flex items-center gap-2'>
                  <UserPlus className='h-5 w-5' />
                  Select Employees
                </CardTitle>
                <div className='flex gap-2'>
                  <Button variant='outline' size='sm' onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleDeselectAll}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex gap-2'>
                <div className='flex-1'>
                  <Input
                    placeholder='Search by name, email, code, or job title...'
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className='w-full'
                  />
                </div>
                <Select
                  value={departmentFilter}
                  onValueChange={setDepartmentFilter}
                >
                  <SelectTrigger className='w-[180px]'>
                    <SelectValue placeholder='Department' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='all'>All Departments</SelectItem>
                    {departments.map(dept => (
                      <SelectItem key={dept} value={dept}>
                        {dept}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className='flex items-center justify-between text-sm'>
                <span className='text-muted-foreground'>
                  {loading
                    ? 'Loading...'
                    : `${filteredEmployees.length} employees found`}
                </span>
                <Badge variant='secondary'>
                  {selectedEmployeeIds.length} selected
                </Badge>
              </div>

              {loading ? (
                <div className='flex items-center justify-center py-8'>
                  <Loader2 className='h-6 w-6 animate-spin text-muted-foreground' />
                  <span className='ml-2 text-sm text-muted-foreground'>
                    Loading employees...
                  </span>
                </div>
              ) : filteredEmployees.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground border rounded-md'>
                  <Users className='h-12 w-12 mx-auto mb-4 opacity-50' />
                  <p className='font-medium'>No employees found</p>
                  <p className='text-sm mt-2'>
                    {searchQuery || departmentFilter !== 'all' ? (
                      'Try adjusting your search or filters'
                    ) : promoterOnlyCount > 0 ? (
                      <>
                        You have {promoterOnlyCount} promoter-only record
                        {promoterOnlyCount !== 1 ? 's' : ''} that need to be
                        added as employees.
                        <br />
                        <span className='text-xs mt-1 block'>
                          Go to <strong>Team Management</strong> and use "Add
                          Team Member" to convert them to employees.
                        </span>
                      </>
                    ) : (
                      'Add employees to your team first at /en/employer/team'
                    )}
                  </p>
                </div>
              ) : (
                <ScrollArea className='h-[400px] border rounded-md p-4'>
                  <div className='space-y-2'>
                    {filteredEmployees.map(employee => {
                      const isSelected = selectedEmployeeIds.includes(
                        employee.id
                      );
                      return (
                        <div
                          key={employee.id}
                          className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-primary/10 border-primary'
                              : 'hover:bg-accent'
                          }`}
                          onClick={() => handleEmployeeToggle(employee.id)}
                        >
                          <div className='flex items-center gap-3 flex-1'>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                handleEmployeeToggle(employee.id)
                              }
                            />
                            <div className='flex-1'>
                              <div className='font-medium'>
                                {employee.employee?.full_name || 'Unknown'}
                              </div>
                              <div className='text-sm text-muted-foreground flex items-center gap-2'>
                                {employee.employee_code && (
                                  <span>#{employee.employee_code}</span>
                                )}
                                {employee.job_title && (
                                  <>
                                    <span>•</span>
                                    <span>{employee.job_title}</span>
                                  </>
                                )}
                                {employee.department && (
                                  <>
                                    <span>•</span>
                                    <span>{employee.department}</span>
                                  </>
                                )}
                              </div>
                              <div className='text-xs text-muted-foreground'>
                                {employee.employee?.email || 'No email'}
                              </div>
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className='h-5 w-5 text-primary' />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value='groups' className='space-y-4'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Building2 className='h-5 w-5' />
                Employee Groups
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-muted-foreground mb-4'>
                Select one or more employee groups. All employees in selected
                groups will receive the schedule.
              </p>

              <div className='grid gap-3'>
                {groups.map(group => {
                  const isSelected = selectedGroupIds.includes(group.id);
                  return (
                    <div
                      key={group.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-primary/10 border-primary'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => handleGroupToggle(group.id)}
                    >
                      <div className='flex items-start justify-between'>
                        <div className='flex-1'>
                          <div className='flex items-center gap-2'>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() =>
                                handleGroupToggle(group.id)
                              }
                            />
                            <div className='font-medium'>{group.name}</div>
                            <Badge variant='outline' className='ml-2'>
                              {group.group_type}
                            </Badge>
                          </div>
                          {group.description && (
                            <p className='text-sm text-muted-foreground mt-1'>
                              {group.description}
                            </p>
                          )}
                          <div className='flex items-center gap-4 mt-2 text-sm text-muted-foreground'>
                            {group.office_location && (
                              <div className='flex items-center gap-1'>
                                <MapPin className='h-3 w-3' />
                                {group.office_location.name}
                              </div>
                            )}
                            <div className='flex items-center gap-1'>
                              <Users className='h-3 w-3' />
                              {group.employee_count} employees
                            </div>
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle2 className='h-5 w-5 text-primary' />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {groups.length === 0 && (
                <div className='text-center py-8 text-muted-foreground'>
                  <Building2 className='h-12 w-12 mx-auto mb-2 opacity-50' />
                  <p>No employee groups created yet.</p>
                  <p className='text-sm'>
                    Create groups to organize employees by location or
                    department.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {showLocationBased && (
          <TabsContent value='location_based' className='space-y-4'>
            <Card>
              <CardHeader>
                <CardTitle className='flex items-center gap-2'>
                  <MapPin className='h-5 w-5' />
                  Location-Based Assignment
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-sm text-muted-foreground mb-4'>
                  Automatically assign employees based on their location groups.
                  Employees in groups associated with the schedule's location
                  will receive the links.
                </p>

                <div className='grid gap-3'>
                  {locationBasedGroups.map(group => {
                    const isSelected = selectedGroupIds.includes(group.id);
                    return (
                      <div
                        key={group.id}
                        className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => handleGroupToggle(group.id)}
                      >
                        <div className='flex items-start justify-between'>
                          <div className='flex-1'>
                            <div className='flex items-center gap-2'>
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() =>
                                  handleGroupToggle(group.id)
                                }
                              />
                              <div className='font-medium'>{group.name}</div>
                            </div>
                            {group.office_location && (
                              <div className='text-sm text-muted-foreground mt-1 flex items-center gap-1'>
                                <MapPin className='h-3 w-3' />
                                {group.office_location.address}
                              </div>
                            )}
                            <div className='text-sm text-muted-foreground mt-2 flex items-center gap-1'>
                              <Users className='h-3 w-3' />
                              {group.employee_count} employees at this location
                            </div>
                          </div>
                          {isSelected && (
                            <CheckCircle2 className='h-5 w-5 text-primary' />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {locationBasedGroups.length === 0 && (
                  <div className='text-center py-8 text-muted-foreground'>
                    <MapPin className='h-12 w-12 mx-auto mb-2 opacity-50' />
                    <p>No location-based groups found.</p>
                    <p className='text-sm'>
                      Create location groups to automatically assign employees
                      by workplace.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {/* Selection Summary */}
      {(selectedEmployeeIds.length > 0 ||
        selectedGroupIds.length > 0 ||
        assignmentType === 'all') && (
        <Card className='bg-muted/50'>
          <CardContent className='pt-6'>
            <div className='flex items-center justify-between'>
              <div>
                <div className='font-medium'>Assignment Summary</div>
                <div className='text-sm text-muted-foreground mt-1'>
                  {assignmentType === 'all' && (
                    <span>All active employees ({employees.length})</span>
                  )}
                  {assignmentType === 'selected' && (
                    <span>
                      {selectedEmployeeIds.length} employee
                      {selectedEmployeeIds.length !== 1 ? 's' : ''} selected
                    </span>
                  )}
                  {assignmentType === 'groups' && (
                    <span>
                      {selectedGroupIds.length} group
                      {selectedGroupIds.length !== 1 ? 's' : ''} selected
                    </span>
                  )}
                  {assignmentType === 'location_based' && (
                    <span>Location-based assignment active</span>
                  )}
                </div>
              </div>
              <Badge variant='default'>
                {assignmentType === 'all'
                  ? 'All Employees'
                  : assignmentType === 'selected'
                    ? 'Selected'
                    : assignmentType === 'groups'
                      ? 'Groups'
                      : 'Location-Based'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
