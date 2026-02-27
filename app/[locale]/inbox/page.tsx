'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-service';
import { cn } from '@/lib/utils';
import {
  Inbox,
  Filter,
  User,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowRight,
} from 'lucide-react';

type AssigneeFilter = 'me' | 'unassigned' | 'all';

interface WorkItem {
  id: string;
  work_type: string | null;
  entity_type: string | null;
  entity_id: string | null;
  status: string | null;
  title: string | null;
  due_at: string | null;
  assignee_id: string | null;
  link: string;
}

interface InboxResponse {
  success: boolean;
  items: WorkItem[];
  total: number;
  limit: number;
  offset: number;
}

function formatDue(due_at: string | null) {
  if (!due_at) return 'No due date';
  try {
    const d = new Date(due_at);
    if (Number.isNaN(d.getTime())) return 'No due date';
    return d.toLocaleDateString();
  } catch {
    return 'No due date';
  }
}

function getStatusBadgeVariant(status: string | null | undefined):
  | 'default'
  | 'secondary'
  | 'destructive'
  | 'outline' {
  const s = (status || '').toLowerCase();
  switch (s) {
    case 'pending':
    case 'open':
      return 'secondary';
    case 'overdue':
      return 'destructive';
    case 'done':
    case 'completed':
      return 'default';
    default:
      return 'outline';
  }
}

export default function InboxPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const locale = useMemo(() => {
    const raw = (params as any)?.locale;
    if (typeof raw === 'string' && ['en', 'ar'].includes(raw)) return raw;
    return 'en';
  }, [params]);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [assigneeFilter, setAssigneeFilter] = useState<AssigneeFilter>('me');
  const [workTypeFilter, setWorkTypeFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [overdueOnly, setOverdueOnly] = useState<'all' | 'overdue'>('all');
  const [search, setSearch] = useState('');

  const {
    data,
    isLoading,
    isFetching,
    refetch,
  } = useQuery<InboxResponse>({
    queryKey: [
      'inbox',
      statusFilter,
      assigneeFilter,
      workTypeFilter,
      sourceFilter,
      overdueOnly,
      search,
    ],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (assigneeFilter) params.set('assignee', assigneeFilter);
      if (workTypeFilter !== 'all') params.set('work_type', workTypeFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      if (overdueOnly === 'overdue') params.set('overdue', 'true');
      if (search) params.set('q', search);
      params.set('limit', '50');
      params.set('offset', '0');

      const res = await fetch(`/api/inbox?${params.toString()}`, {
        credentials: 'include',
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to load inbox items');
      }
      return res.json();
    },
    staleTime: 15_000,
  });

  const items: WorkItem[] = data?.items ?? [];

  const assignMutation = useMutation({
    mutationFn: async (item: WorkItem) => {
      const res = await fetch(`/api/inbox/${item.id}/assign`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to assign work item');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Assigned to you',
        description: 'This item has been assigned to you.',
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to assign',
        description:
          error?.message || 'Could not assign this item. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async (item: WorkItem) => {
      const res = await fetch(`/api/inbox/${item.id}/complete`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Failed to complete work item');
      }
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: 'Completed',
        description: 'The item has been marked as complete.',
      });
      refetch();
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to complete',
        description:
          error?.message || 'Could not complete this item. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleOpen = (item: WorkItem) => {
    const target = item.link || '/';
    router.push(`/${locale}${target}`);
  };

  const currentUserId = user?.id ?? null;

  return (
    <main className='max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
      <div className='flex items-center justify-between gap-4'>
        <div>
          <h1 className='text-3xl font-bold flex items-center gap-2'>
            <Inbox className='h-7 w-7 text-blue-600' />
            <span>Inbox</span>
          </h1>
          <p className='text-muted-foreground mt-1'>
            Centralized list of tasks and approvals that need your attention.
          </p>
        </div>
        <Button
          variant='outline'
          size='sm'
          onClick={() => refetch()}
          disabled={isFetching}
          className='gap-2'
        >
          {isFetching && <Loader2 className='h-4 w-4 animate-spin' />}
          Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Filter className='h-4 w-4 text-muted-foreground' />
            Filters
          </CardTitle>
          <CardDescription>
            Narrow down work items by status, assignee, type, and due date.
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
            <div>
              <label className='block text-xs font-medium mb-1'>Status</label>
              <Select
                value={statusFilter}
                onValueChange={value => setStatusFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  <SelectItem value='pending'>Pending</SelectItem>
                  <SelectItem value='open'>Open</SelectItem>
                  <SelectItem value='done'>Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='block text-xs font-medium mb-1'>Assignee</label>
              <Select
                value={assigneeFilter}
                onValueChange={value => setAssigneeFilter(value as AssigneeFilter)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='Assignee' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='me'>Assigned to me</SelectItem>
                  <SelectItem value='unassigned'>Unassigned</SelectItem>
                  <SelectItem value='all'>All</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='block text-xs font-medium mb-1'>Work Type</label>
              <Select
                value={workTypeFilter}
                onValueChange={value => setWorkTypeFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  <SelectItem value='task'>Task</SelectItem>
                  <SelectItem value='approval'>Approval</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='block text-xs font-medium mb-1'>Source</label>
              <Select
                value={sourceFilter}
                onValueChange={value => setSourceFilter(value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All sources' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All</SelectItem>
                  <SelectItem value='contracts'>Contracts</SelectItem>
                  <SelectItem value='tasks'>Tasks</SelectItem>
                  <SelectItem value='hr'>HR</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className='block text-xs font-medium mb-1'>Due</label>
              <Select
                value={overdueOnly}
                onValueChange={value =>
                  setOverdueOnly(value as 'all' | 'overdue')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Any time' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Any time</SelectItem>
                  <SelectItem value='overdue'>Overdue only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className='flex items-center gap-3'>
            <Input
              placeholder='Search by title or entity id...'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className='max-w-md'
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <span>Work Items</span>
            <Badge variant='outline'>{items.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className='flex items-center justify-center py-16 text-muted-foreground gap-2'>
              <Loader2 className='h-5 w-5 animate-spin' />
              <span>Loading inbox...</span>
            </div>
          ) : items.length === 0 ? (
            <div className='py-16 text-center text-muted-foreground space-y-2'>
              <p className='font-medium'>No work items found</p>
              <p className='text-sm'>
                Try adjusting your filters or check back later.
              </p>
            </div>
          ) : (
            <div className='overflow-x-auto'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Assignee</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => {
                    const isAssignedToMe =
                      currentUserId && item.assignee_id === currentUserId;
                    const isDone =
                      (item.status || '').toLowerCase() === 'done' ||
                      (item.status || '').toLowerCase() === 'completed';

                    return (
                      <TableRow key={item.id} className='hover:bg-muted/50'>
                        <TableCell
                          className='cursor-pointer max-w-xs'
                          onClick={() => handleOpen(item)}
                        >
                          <div className='flex items-center gap-2'>
                            <span className='truncate font-medium'>
                              {item.title || 'Untitled'}
                            </span>
                            <ArrowRight className='h-3 w-3 text-muted-foreground' />
                          </div>
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>
                          <Badge variant='outline'>
                            {item.work_type || 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className='whitespace-nowrap text-sm text-muted-foreground'>
                          {item.entity_type || '—'}{' '}
                          {item.entity_id
                            ? `• ${String(item.entity_id).slice(0, 8)}…`
                            : ''}
                        </TableCell>
                        <TableCell className='whitespace-nowrap text-sm'>
                          <div className='flex items-center gap-1'>
                            <Clock className='h-3 w-3 text-muted-foreground' />
                            <span>{formatDue(item.due_at)}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(item.status)}>
                            {item.status || 'unknown'}
                          </Badge>
                        </TableCell>
                        <TableCell className='whitespace-nowrap'>
                          <div className='flex items-center gap-1 text-sm text-muted-foreground'>
                            <User className='h-3 w-3' />
                            <span>
                              {item.assignee_id
                                ? isAssignedToMe
                                  ? 'You'
                                  : 'Assigned'
                                : 'Unassigned'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className='text-right whitespace-nowrap space-x-2'>
                          <Button
                            variant='outline'
                            size='sm'
                            disabled={
                              assignMutation.isPending ||
                              !currentUserId ||
                              isAssignedToMe
                            }
                            onClick={() => assignMutation.mutate(item)}
                          >
                            <User className='h-3 w-3 mr-1' />
                            Assign to me
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            disabled={completeMutation.isPending || isDone}
                            onClick={() => completeMutation.mutate(item)}
                            className={cn(
                              isDone &&
                                'border-green-500 text-green-600 bg-green-50'
                            )}
                          >
                            <CheckCircle2 className='h-3 w-3 mr-1' />
                            {isDone ? 'Completed' : 'Complete'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

