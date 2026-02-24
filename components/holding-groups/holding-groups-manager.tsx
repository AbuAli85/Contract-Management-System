'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  PlusIcon,
  EditIcon,
  TrashIcon,
  BuildingIcon,
  Loader2,
  UsersIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from 'lucide-react';
import { HoldingGroupMembersManager } from './holding-group-members-manager';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

interface HoldingGroup {
  id: string;
  name_en: string;
  name_ar?: string;
  description?: string;
  logo_url?: string;
  is_active: boolean;
  members?: HoldingGroupMember[];
}

interface HoldingGroupMember {
  id: string;
  holding_group_id: string;
  party_id?: string;
  company_id?: string;
  member_type: 'party' | 'company';
  party?: {
    id: string;
    name_en: string;
    name_ar?: string;
    type: string;
    overall_status: string;
  };
  company?: {
    id: string;
    name: string;
    email?: string;
    is_active: boolean;
  };
}

export function HoldingGroupsManager() {
  const [holdingGroups, setHoldingGroups] = useState<HoldingGroup[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<HoldingGroup | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name_en: '',
    name_ar: '',
    description: '',
    logo_url: '',
  });

  useEffect(() => {
    fetchHoldingGroups();
  }, []);

  async function fetchHoldingGroups() {
    setIsLoading(true);
    try {
      const response = await fetch('/api/holding-groups?include_members=true');
      const { data, error } = await response.json();

      if (error) throw new Error(error);
      setHoldingGroups(data || []);
    } catch (error: any) {
      toast({
        title: 'Error fetching holding groups',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const url = editingGroup
        ? `/api/holding-groups/${editingGroup.id}`
        : '/api/holding-groups';
      const method = editingGroup ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const { data, error } = await response.json();

      if (error) throw new Error(error);

      toast({
        title: editingGroup ? 'Holding group updated' : 'Holding group created',
        description: `Successfully ${editingGroup ? 'updated' : 'created'} ${data.name_en}`,
      });

      setIsDialogOpen(false);
      resetForm();
      fetchHoldingGroups();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    try {
      const response = await fetch(`/api/holding-groups/${id}`, {
        method: 'DELETE',
      });

      const { error } = await response.json();

      if (error) throw new Error(error);

      toast({
        title: 'Holding group deleted',
        description: `Successfully deleted ${name}`,
      });

      fetchHoldingGroups();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  }

  function handleEdit(group: HoldingGroup) {
    setEditingGroup(group);
    setFormData({
      name_en: group.name_en,
      name_ar: group.name_ar || '',
      description: group.description || '',
      logo_url: group.logo_url || '',
    });
    setIsDialogOpen(true);
  }

  function handleAddNew() {
    setEditingGroup(null);
    resetForm();
    setIsDialogOpen(true);
  }

  function resetForm() {
    setFormData({
      name_en: '',
      name_ar: '',
      description: '',
      logo_url: '',
    });
    setEditingGroup(null);
  }

  function toggleGroupExpansion(groupId: string) {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  }

  if (isLoading) {
    return (
      <div className='flex items-center justify-center p-8'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Holding Groups</h1>
          <p className='text-muted-foreground'>
            Manage holding groups and their member companies
          </p>
        </div>
        <Button onClick={handleAddNew}>
          <PlusIcon className='mr-2 h-4 w-4' />
          Add Holding Group
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Holding Groups</CardTitle>
          <CardDescription>
            Groups that manage multiple companies (e.g., Falcon Eye Group)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {holdingGroups.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              No holding groups found. Create one to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name (EN)</TableHead>
                  <TableHead>Name (AR)</TableHead>
                  <TableHead>Members</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {holdingGroups.map(group => {
                  const isExpanded = expandedGroups.has(group.id);
                  return (
                    <React.Fragment key={group.id}>
                      <TableRow>
                        <TableCell className='font-medium'>
                          <div className='flex items-center gap-2'>
                            <span>{group.name_en}</span>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => toggleGroupExpansion(group.id)}
                              className='h-6 w-6 p-0'
                            >
                              {isExpanded ? (
                                <ChevronUpIcon className='h-4 w-4' />
                              ) : (
                                <ChevronDownIcon className='h-4 w-4' />
                              )}
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell>{group.name_ar || '-'}</TableCell>
                        <TableCell>
                          <div className='flex items-center gap-2'>
                            <BuildingIcon className='h-4 w-4' />
                            <span>{group.members?.length || 0} companies</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`px-2 py-1 rounded-full text-xs ${
                              group.is_active
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {group.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </TableCell>
                        <TableCell className='text-right'>
                          <div className='flex justify-end gap-2'>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => toggleGroupExpansion(group.id)}
                              title='Manage Members'
                            >
                              <UsersIcon className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() => handleEdit(group)}
                              title='Edit'
                            >
                              <EditIcon className='h-4 w-4' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='sm'
                              onClick={() =>
                                handleDelete(group.id, group.name_en)
                              }
                              title='Delete'
                            >
                              <TrashIcon className='h-4 w-4 text-destructive' />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <TableRow>
                          <TableCell colSpan={5} className='bg-muted/30 p-0'>
                            <div className='p-4'>
                              <HoldingGroupMembersManager
                                holdingGroupId={group.id}
                                holdingGroupName={group.name_en}
                                onMembersChange={fetchHoldingGroups}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              {editingGroup ? 'Edit Holding Group' : 'Create Holding Group'}
            </DialogTitle>
            <DialogDescription>
              {editingGroup
                ? 'Update the holding group details'
                : 'Create a new holding group to manage multiple companies'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='name_en'>Name (English) *</Label>
              <Input
                id='name_en'
                value={formData.name_en}
                onChange={e =>
                  setFormData({ ...formData, name_en: e.target.value })
                }
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='name_ar'>Name (Arabic)</Label>
              <Input
                id='name_ar'
                value={formData.name_ar}
                onChange={e =>
                  setFormData({ ...formData, name_ar: e.target.value })
                }
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='description'>Description</Label>
              <Textarea
                id='description'
                value={formData.description}
                onChange={e =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='logo_url'>Logo URL</Label>
              <Input
                id='logo_url'
                type='url'
                value={formData.logo_url}
                onChange={e =>
                  setFormData({ ...formData, logo_url: e.target.value })
                }
                placeholder='https://example.com/logo.png'
              />
            </div>
            <div className='flex justify-end gap-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button type='submit'>
                {editingGroup ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
