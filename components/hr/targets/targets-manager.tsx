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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Target,
  Plus,
  Filter,
  Search,
  TrendingUp,
  Eye,
  Calendar,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

interface EmployeeTarget {
  id: string;
  title: string;
  description: string | null;
  target_type: string;
  target_value: number;
  current_value: number;
  unit: string | null;
  period_type: string;
  start_date: string;
  end_date: string;
  status: string;
  progress_percentage: number;
  employer_employee: {
    id: string;
    employee: {
      name_en?: string;
      name_ar?: string;
    };
    job_title?: string;
  };
}

export function TargetsManager() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // Fetch targets
  const { data: targetsData, isLoading } = useQuery({
    queryKey: ['hr-targets', statusFilter, typeFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(typeFilter !== 'all' && { target_type: typeFilter }),
      });
      const response = await fetch(`/api/hr/targets?${params}`);
      if (!response.ok) throw new Error('Failed to fetch targets');
      return response.json();
    },
  });

  const targets = (targetsData?.targets || []) as EmployeeTarget[];

  // Filter by search term
  const filteredTargets = targets.filter(target => {
    if (!searchTerm) return true;
    const name =
      target.employer_employee?.employee?.name_en ||
      target.employer_employee?.employee?.name_ar ||
      '';
    return (
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      target.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      active: 'default',
      completed: 'default',
      paused: 'secondary',
      cancelled: 'destructive',
    };

    return (
      <Badge variant={variants[status] || 'outline'}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'bg-green-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Targets Management</h1>
          <p className='text-muted-foreground mt-1'>
            Set and track employee performance targets and goals
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className='h-4 w-4 mr-2' />
              Create Target
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-2xl'>
            <DialogHeader>
              <DialogTitle>Create New Target</DialogTitle>
              <DialogDescription>
                Set a new performance target for an employee
              </DialogDescription>
            </DialogHeader>
            <TargetForm
              onSuccess={() => {
                setCreateDialogOpen(false);
                queryClient.invalidateQueries({ queryKey: ['hr-targets'] });
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Targets</CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{targets.length}</div>
            <p className='text-xs text-muted-foreground'>All targets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {targets.filter(t => t.status === 'active').length}
            </div>
            <p className='text-xs text-muted-foreground'>In progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Completed</CardTitle>
            <Target className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {targets.filter(t => t.status === 'completed').length}
            </div>
            <p className='text-xs text-muted-foreground'>Achieved</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Avg Progress</CardTitle>
            <TrendingUp className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {targets.length > 0
                ? Math.round(
                    targets.reduce((sum, t) => sum + t.progress_percentage, 0) /
                      targets.length
                  )
                : 0}
              %
            </div>
            <p className='text-xs text-muted-foreground'>Average completion</p>
          </CardContent>
        </Card>
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
                placeholder='Search targets...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className='pl-10'
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Status' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Status</SelectItem>
                <SelectItem value='active'>Active</SelectItem>
                <SelectItem value='completed'>Completed</SelectItem>
                <SelectItem value='paused'>Paused</SelectItem>
                <SelectItem value='cancelled'>Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='all'>All Types</SelectItem>
                <SelectItem value='performance'>Performance</SelectItem>
                <SelectItem value='sales'>Sales</SelectItem>
                <SelectItem value='quality'>Quality</SelectItem>
                <SelectItem value='efficiency'>Efficiency</SelectItem>
                <SelectItem value='training'>Training</SelectItem>
              </SelectContent>
            </Select>

            <Button variant='outline'>
              <Filter className='h-4 w-4 mr-2' />
              Apply Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Targets Table */}
      <Card>
        <CardHeader>
          <CardTitle>Targets</CardTitle>
          <CardDescription>
            {filteredTargets.length} targets found
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredTargets.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              No targets found
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Target</TableHead>
                  <TableHead>Employee</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTargets.map(target => (
                  <TableRow key={target.id}>
                    <TableCell>
                      <div>
                        <div className='font-medium'>{target.title}</div>
                        {target.description && (
                          <div className='text-sm text-muted-foreground'>
                            {target.description.substring(0, 50)}...
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {target.employer_employee?.employee?.name_en ||
                        target.employer_employee?.employee?.name_ar ||
                        'Unknown'}
                    </TableCell>
                    <TableCell>
                      <div className='space-y-1'>
                        <div className='flex items-center justify-between text-sm'>
                          <span>{target.progress_percentage}%</span>
                          <span className='text-muted-foreground'>
                            {target.current_value} / {target.target_value}{' '}
                            {target.unit || ''}
                          </span>
                        </div>
                        <Progress
                          value={target.progress_percentage}
                          className='h-2'
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      {target.target_value} {target.unit || ''}
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        <div>
                          {format(new Date(target.start_date), 'MMM dd, yyyy')}
                        </div>
                        <div className='text-muted-foreground'>
                          to {format(new Date(target.end_date), 'MMM dd, yyyy')}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(target.status)}</TableCell>
                    <TableCell>
                      <Button variant='ghost' size='sm'>
                        <Eye className='h-4 w-4 mr-2' />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Target Form Component
function TargetForm({ onSuccess }: { onSuccess: () => void }) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    employer_employee_id: '',
    title: '',
    description: '',
    target_type: 'performance',
    target_value: '',
    unit: '',
    period_type: 'monthly',
    start_date: '',
    end_date: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/hr/targets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          target_value: parseFloat(formData.target_value),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create target');
      }

      toast({
        title: 'Success',
        description: 'Target created successfully',
      });
      onSuccess();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <div className='space-y-2'>
        <Label>Employee ID</Label>
        <Input
          value={formData.employer_employee_id}
          onChange={e =>
            setFormData({ ...formData, employer_employee_id: e.target.value })
          }
          placeholder='Employer Employee ID'
          required
        />
      </div>

      <div className='space-y-2'>
        <Label>Title</Label>
        <Input
          value={formData.title}
          onChange={e => setFormData({ ...formData, title: e.target.value })}
          placeholder='Target title'
          required
        />
      </div>

      <div className='space-y-2'>
        <Label>Description</Label>
        <Textarea
          value={formData.description}
          onChange={e =>
            setFormData({ ...formData, description: e.target.value })
          }
          placeholder='Target description'
          rows={3}
        />
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label>Target Type</Label>
          <Select
            value={formData.target_type}
            onValueChange={value =>
              setFormData({ ...formData, target_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='performance'>Performance</SelectItem>
              <SelectItem value='sales'>Sales</SelectItem>
              <SelectItem value='quality'>Quality</SelectItem>
              <SelectItem value='efficiency'>Efficiency</SelectItem>
              <SelectItem value='training'>Training</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className='space-y-2'>
          <Label>Period Type</Label>
          <Select
            value={formData.period_type}
            onValueChange={value =>
              setFormData({ ...formData, period_type: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='daily'>Daily</SelectItem>
              <SelectItem value='weekly'>Weekly</SelectItem>
              <SelectItem value='monthly'>Monthly</SelectItem>
              <SelectItem value='quarterly'>Quarterly</SelectItem>
              <SelectItem value='yearly'>Yearly</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label>Target Value</Label>
          <Input
            type='number'
            value={formData.target_value}
            onChange={e =>
              setFormData({ ...formData, target_value: e.target.value })
            }
            placeholder='100'
            required
          />
        </div>

        <div className='space-y-2'>
          <Label>Unit</Label>
          <Input
            value={formData.unit}
            onChange={e => setFormData({ ...formData, unit: e.target.value })}
            placeholder='e.g., hours, tasks, revenue'
          />
        </div>
      </div>

      <div className='grid grid-cols-2 gap-4'>
        <div className='space-y-2'>
          <Label>Start Date</Label>
          <Input
            type='date'
            value={formData.start_date}
            onChange={e =>
              setFormData({ ...formData, start_date: e.target.value })
            }
            required
          />
        </div>

        <div className='space-y-2'>
          <Label>End Date</Label>
          <Input
            type='date'
            value={formData.end_date}
            onChange={e =>
              setFormData({ ...formData, end_date: e.target.value })
            }
            required
          />
        </div>
      </div>

      <Button type='submit' disabled={loading} className='w-full'>
        {loading ? 'Creating...' : 'Create Target'}
      </Button>
    </form>
  );
}
