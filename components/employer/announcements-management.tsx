'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Megaphone,
  Plus,
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  Pin,
  MoreVertical,
  Pencil,
  Trash2,
  Eye,
  Loader2,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  content: string;
  priority: string;
  is_pinned: boolean;
  expires_at: string | null;
  target_departments: string[] | null;
  created_at: string;
  read_count: number;
}

const priorityConfig: Record<
  string,
  { icon: React.ElementType; color: string; bg: string; label: string }
> = {
  low: {
    icon: Info,
    color: 'text-gray-500',
    bg: 'bg-gray-100 dark:bg-gray-900',
    label: 'Low',
  },
  normal: {
    icon: Bell,
    color: 'text-blue-500',
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    label: 'Normal',
  },
  important: {
    icon: AlertCircle,
    color: 'text-amber-500',
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    label: 'Important',
  },
  urgent: {
    icon: AlertTriangle,
    color: 'text-red-500',
    bg: 'bg-red-100 dark:bg-red-900/30',
    label: 'Urgent',
  },
};

export function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] =
    useState<Announcement | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'normal',
    is_pinned: false,
    expires_at: '',
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await fetch('/api/employer/announcements');
      const data = await response.json();

      if (response.ok && data.success) {
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      priority: 'normal',
      is_pinned: false,
      expires_at: '',
    });
    setEditingAnnouncement(null);
  };

  const openEditDialog = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      is_pinned: announcement.is_pinned,
      expires_at: announcement.expires_at?.slice(0, 16) || '',
    });
    setDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingAnnouncement
        ? `/api/employer/announcements/${editingAnnouncement.id}`
        : '/api/employer/announcements';

      const response = await fetch(url, {
        method: editingAnnouncement ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          expires_at: formData.expires_at || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      toast({
        title: editingAnnouncement
          ? '✅ Announcement Updated'
          : '✅ Announcement Created',
        description: 'Your team will be notified',
      });

      setDialogOpen(false);
      resetForm();
      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const response = await fetch(`/api/employer/announcements/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      toast({
        title: '🗑️ Announcement Deleted',
      });

      fetchAnnouncements();
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const togglePin = async (announcement: Announcement) => {
    try {
      await fetch(`/api/employer/announcements/${announcement.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_pinned: !announcement.is_pinned }),
      });

      fetchAnnouncements();
    } catch (error) {
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-12'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold flex items-center gap-2'>
            <Megaphone className='h-6 w-6 text-orange-600' />
            Team Announcements
          </h2>
          <p className='text-gray-500'>
            Create and manage announcements for your team
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={open => {
            setDialogOpen(open);
            if (!open) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button>
              <Plus className='h-4 w-4 mr-2' />
              New Announcement
            </Button>
          </DialogTrigger>
          <DialogContent className='max-w-lg'>
            <DialogHeader>
              <DialogTitle>
                {editingAnnouncement
                  ? 'Edit Announcement'
                  : 'Create Announcement'}
              </DialogTitle>
              <DialogDescription>
                {editingAnnouncement
                  ? 'Update this announcement'
                  : 'Create a new announcement for your team'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className='space-y-4'>
              <div className='space-y-2'>
                <Label>Title</Label>
                <Input
                  value={formData.title}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, title: e.target.value }))
                  }
                  placeholder='Announcement title...'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label>Content</Label>
                <Textarea
                  value={formData.content}
                  onChange={e =>
                    setFormData(prev => ({ ...prev, content: e.target.value }))
                  }
                  placeholder='Write your announcement...'
                  rows={5}
                  required
                />
              </div>

              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={v =>
                      setFormData(prev => ({ ...prev, priority: v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(priorityConfig).map(([key, config]) => (
                        <SelectItem key={key} value={key}>
                          <div className='flex items-center gap-2'>
                            <config.icon
                              className={cn('h-4 w-4', config.color)}
                            />
                            {config.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className='space-y-2'>
                  <Label>Expires At (Optional)</Label>
                  <Input
                    type='datetime-local'
                    value={formData.expires_at}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        expires_at: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>

              <div className='flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg'>
                <div className='flex items-center gap-2'>
                  <Pin className='h-4 w-4 text-amber-500' />
                  <span className='text-sm font-medium'>Pin to top</span>
                </div>
                <Switch
                  checked={formData.is_pinned}
                  onCheckedChange={checked =>
                    setFormData(prev => ({ ...prev, is_pinned: checked }))
                  }
                />
              </div>

              <DialogFooter>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => setDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type='submit' disabled={submitting}>
                  {submitting && (
                    <Loader2 className='h-4 w-4 animate-spin mr-2' />
                  )}
                  {editingAnnouncement ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Announcement List */}
      <div className='space-y-4'>
        {announcements.length === 0 ? (
          <Card className='border-0 shadow-lg'>
            <CardContent className='py-12 text-center'>
              <Megaphone className='h-16 w-16 mx-auto mb-4 text-gray-300' />
              <h3 className='text-lg font-medium mb-2'>No Announcements Yet</h3>
              <p className='text-gray-500 mb-4'>
                Create your first announcement to communicate with your team
              </p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className='h-4 w-4 mr-2' />
                Create Announcement
              </Button>
            </CardContent>
          </Card>
        ) : (
          announcements.map(announcement => {
            const config =
              priorityConfig[announcement.priority] || priorityConfig.normal;
            const PriorityIcon = config.icon;
            const isExpired =
              announcement.expires_at &&
              new Date(announcement.expires_at) < new Date();

            return (
              <Card
                key={announcement.id}
                className={cn(
                  'border-0 shadow-lg transition-all hover:shadow-xl',
                  announcement.is_pinned && 'ring-2 ring-amber-400',
                  isExpired && 'opacity-60'
                )}
              >
                <CardContent className='p-6'>
                  <div className='flex items-start gap-4'>
                    <div
                      className={cn('p-3 rounded-xl flex-shrink-0', config.bg)}
                    >
                      <PriorityIcon className={cn('h-5 w-5', config.color)} />
                    </div>

                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-4'>
                        <div>
                          <div className='flex items-center gap-2 flex-wrap'>
                            {announcement.is_pinned && (
                              <Pin className='h-4 w-4 text-amber-500' />
                            )}
                            <h3 className='font-semibold text-lg'>
                              {announcement.title}
                            </h3>
                            <Badge
                              className={cn(
                                config.bg,
                                config.color,
                                'border-0'
                              )}
                            >
                              {config.label}
                            </Badge>
                            {isExpired && (
                              <Badge variant='secondary'>Expired</Badge>
                            )}
                          </div>
                          <p className='text-sm text-gray-500 mt-1'>
                            {formatDistanceToNow(
                              new Date(announcement.created_at),
                              { addSuffix: true }
                            )}
                            {announcement.expires_at && (
                              <>
                                {' '}
                                • Expires{' '}
                                {format(
                                  new Date(announcement.expires_at),
                                  'MMM d, yyyy'
                                )}
                              </>
                            )}
                          </p>
                        </div>

                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='icon'>
                              <MoreVertical className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuItem
                              onClick={() => togglePin(announcement)}
                            >
                              <Pin className='h-4 w-4 mr-2' />
                              {announcement.is_pinned ? 'Unpin' : 'Pin to top'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openEditDialog(announcement)}
                            >
                              <Pencil className='h-4 w-4 mr-2' />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(announcement.id)}
                              className='text-red-600'
                            >
                              <Trash2 className='h-4 w-4 mr-2' />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <p className='mt-3 text-gray-700 dark:text-gray-300 whitespace-pre-wrap line-clamp-3'>
                        {announcement.content}
                      </p>

                      <div className='mt-4 flex items-center gap-4 text-sm text-gray-500'>
                        <div className='flex items-center gap-1'>
                          <Eye className='h-4 w-4' />
                          {announcement.read_count} read
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
