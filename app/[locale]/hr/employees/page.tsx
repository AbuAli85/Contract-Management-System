'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  MoreHorizontal,
  Download,
  Upload,
} from 'lucide-react';
import Link from 'next/link';

interface Employee {
  id: number;
  employee_code: string;
  full_name: string;
  job_title: string;
  department_name: string;
  employment_status: string;
  hire_date: string;
  phone: string;
  email: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchEmployees();
  }, [currentPage, searchTerm, statusFilter, departmentFilter]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(departmentFilter !== 'all' && { department_id: departmentFilter }),
      });

      const response = await fetch(`/api/hr/employees?${params}`);
      const data = await response.json();

      if (response.ok) {
        setEmployees(data.data || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        console.error('Error fetching employees:', data.error);
        // Show empty state on error - do not use mock data in production
        setEmployees([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { variant: 'default' as const, label: 'Active' },
      probation: { variant: 'secondary' as const, label: 'Probation' },
      on_leave: { variant: 'outline' as const, label: 'On Leave' },
      terminated: { variant: 'destructive' as const, label: 'Terminated' },
    };

    const config =
      statusConfig[status as keyof typeof statusConfig] || statusConfig.active;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600'></div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      {/* Header */}
      <div className='flex justify-between items-center'>
        <div>
          <h1 className='text-3xl font-bold text-gray-900'>Employees</h1>
          <p className='text-gray-600 mt-2'>Manage your workforce</p>
        </div>
        <div className='flex space-x-3'>
          <Button variant='outline'>
            <Download className='w-4 h-4 mr-2' />
            Export
          </Button>
          <Button variant='outline'>
            <Upload className='w-4 h-4 mr-2' />
            Import
          </Button>
          <Button asChild>
            <Link href='/hr/employees/new'>
              <Plus className='w-4 h-4 mr-2' />
              Add Employee
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='relative'>
              <Search className='absolute left-3 top-3 h-4 w-4 text-gray-400' />
              <Input
                placeholder='Search employees...'
                value={searchTerm}
                onChange={e => handleSearch(e.target.value)}
                className='pl-10'
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Employment Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='probation'>Probation</SelectItem>
                <SelectItem value='on_leave'>On Leave</SelectItem>
                <SelectItem value='terminated'>Terminated</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={departmentFilter}
              onValueChange={setDepartmentFilter}
            >
              <SelectTrigger>
                <SelectValue placeholder='Department' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Departments</SelectItem>
                <SelectItem value='1'>Human Resources</SelectItem>
                <SelectItem value='2'>Information Technology</SelectItem>
                <SelectItem value='3'>Finance</SelectItem>
                <SelectItem value='4'>Operations</SelectItem>
                <SelectItem value='5'>Sales</SelectItem>
                <SelectItem value='6'>Customer Service</SelectItem>
              </SelectContent>
            </Select>

            <Button variant='outline' onClick={fetchEmployees}>
              <Filter className='w-4 h-4 mr-2' />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Employees Table */}
      <Card>
        <CardHeader>
          <CardTitle>Employee List</CardTitle>
          <CardDescription>{employees.length} employees found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className='overflow-x-auto'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee Code</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Job Title</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Hire Date</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {employees.map(employee => (
                  <TableRow key={employee.id}>
                    <TableCell className='font-medium'>
                      {employee.employee_code}
                    </TableCell>
                    <TableCell>{employee.full_name}</TableCell>
                    <TableCell>{employee.job_title}</TableCell>
                    <TableCell>{employee.department_name}</TableCell>
                    <TableCell>
                      {getStatusBadge(employee.employment_status)}
                    </TableCell>
                    <TableCell>
                      {new Date(employee.hire_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <div className='text-sm'>{employee.email}</div>
                        <div className='text-sm text-gray-500'>
                          {employee.phone}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='flex space-x-2'>
                        <Button variant='ghost' size='sm' asChild>
                          <Link href={`/hr/employees/${employee.id}`}>
                            <Eye className='w-4 h-4' />
                          </Link>
                        </Button>
                        <Button variant='ghost' size='sm' asChild>
                          <Link href={`/hr/employees/${employee.id}/edit`}>
                            <Edit className='w-4 h-4' />
                          </Link>
                        </Button>
                        <Button variant='ghost' size='sm'>
                          <MoreHorizontal className='w-4 h-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex items-center justify-between mt-4'>
              <div className='text-sm text-gray-500'>
                Page {currentPage} of {totalPages}
              </div>
              <div className='flex space-x-2'>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
