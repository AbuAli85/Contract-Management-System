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
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Shield,
  Search,
  Save,
  Lock,
  Unlock,
  Key,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PermissionsManagerProps {
  employerEmployeeId: string;
}

const categoryIcons: Record<string, React.ElementType> = {
  general: Shield,
  read: Unlock,
  write: Lock,
  admin: ShieldAlert,
  auth: Key,
};

const categoryColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  general: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-600 dark:text-blue-400',
    border: 'border-blue-200 dark:border-blue-800',
  },
  read: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-600 dark:text-emerald-400',
    border: 'border-emerald-200 dark:border-emerald-800',
  },
  write: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-600 dark:text-amber-400',
    border: 'border-amber-200 dark:border-amber-800',
  },
  admin: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-600 dark:text-purple-400',
    border: 'border-purple-200 dark:border-purple-800',
  },
  auth: {
    bg: 'bg-rose-50 dark:bg-rose-900/20',
    text: 'text-rose-600 dark:text-rose-400',
    border: 'border-rose-200 dark:border-rose-800',
  },
};

export function PermissionsManager({
  employerEmployeeId,
}: PermissionsManagerProps) {
  const [permissions, setPermissions] = useState<any[]>([]);
  const [availablePermissions, setAvailablePermissions] = useState<any[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(
    new Set()
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [originalPermissions, setOriginalPermissions] = useState<Set<string>>(
    new Set()
  );
  const { toast } = useToast();

  useEffect(() => {
    fetchPermissions();
    fetchAvailablePermissions();
  }, [employerEmployeeId]);

  useEffect(() => {
    // Check if there are unsaved changes
    const currentSet = Array.from(selectedPermissions).sort().join(',');
    const originalSet = Array.from(originalPermissions).sort().join(',');
    setHasChanges(currentSet !== originalSet);
  }, [selectedPermissions, originalPermissions]);

  const fetchPermissions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/employer/team/${employerEmployeeId}/permissions`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch permissions');
      }

      const granted = (data.permissions || [])
        .filter((p: any) => p.granted)
        .map((p: any) => p.permission_id);
      const grantedSet = new Set(granted);
      setSelectedPermissions(grantedSet);
      setOriginalPermissions(new Set(granted));
      setPermissions(data.permissions || []);
    } catch (error) {
      console.error('Error fetching permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load permissions',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailablePermissions = async () => {
    try {
      const response = await fetch('/api/users/permissions');
      const data = await response.json();

      if (response.ok && data.permissions) {
        setAvailablePermissions(data.permissions);
      }
    } catch (error) {
      console.error('Error fetching available permissions:', error);
    }
  };

  const togglePermission = (permissionId: string) => {
    setSelectedPermissions(prev => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await fetch(
        `/api/employer/team/${employerEmployeeId}/permissions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            permissions: Array.from(selectedPermissions),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save permissions');
      }

      toast({
        title: 'Success',
        description: 'Permissions updated successfully',
      });

      setOriginalPermissions(new Set(selectedPermissions));
      fetchPermissions();
    } catch (error) {
      console.error('Error saving permissions:', error);
      toast({
        title: 'Error',
        description: 'Failed to save permissions',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredPermissions = availablePermissions.filter(
    perm =>
      perm.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      perm.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedPermissions = filteredPermissions.reduce(
    (acc, perm) => {
      const category = perm.category || 'general';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(perm);
      return acc;
    },
    {} as Record<string, any[]>
  );

  const getCategoryConfig = (category: string) => {
    const Icon = categoryIcons[category] || Shield;
    const colors = categoryColors[category] || categoryColors.general;
    return { Icon, colors };
  };

  return (
    <Card className='border-0 shadow-lg'>
      <CardHeader>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <div className='p-2 bg-gradient-to-br from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 rounded-lg'>
              <ShieldCheck className='h-5 w-5 text-violet-600 dark:text-violet-400' />
            </div>
            <div>
              <CardTitle className='text-lg'>Manage Permissions</CardTitle>
              <CardDescription>
                Control access and capabilities for this team member
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={cn(
              'shadow-lg transition-all',
              hasChanges
                ? 'bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-violet-500/20'
                : ''
            )}
          >
            {saving ? (
              <>
                <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                Saving...
              </>
            ) : (
              <>
                <Save className='h-4 w-4 mr-2' />
                Save Permissions
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Search Bar */}
        <div className='relative max-w-md'>
          <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400' />
          <Input
            placeholder='Search permissions...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10 bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-800'
          />
        </div>

        {/* Stats Bar */}
        {!loading && (
          <div className='flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl'>
            <div className='flex items-center gap-2'>
              <div className='p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded'>
                <CheckCircle2 className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
              </div>
              <span className='text-sm'>
                <span className='font-semibold text-emerald-600 dark:text-emerald-400'>
                  {selectedPermissions.size}
                </span>
                <span className='text-gray-500 dark:text-gray-400'>
                  {' '}
                  permissions enabled
                </span>
              </span>
            </div>
            <div className='h-4 w-px bg-gray-300 dark:bg-gray-700' />
            <div className='text-sm text-gray-500 dark:text-gray-400'>
              {availablePermissions.length} total available
            </div>
            {hasChanges && (
              <>
                <div className='h-4 w-px bg-gray-300 dark:bg-gray-700' />
                <Badge className='bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-0'>
                  <Sparkles className='h-3 w-3 mr-1' />
                  Unsaved changes
                </Badge>
              </>
            )}
          </div>
        )}

        {loading ? (
          <div className='flex items-center justify-center py-12'>
            <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600' />
          </div>
        ) : Object.keys(groupedPermissions).length === 0 ? (
          <div className='text-center py-16'>
            <div className='mx-auto w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4'>
              <Shield className='h-8 w-8 text-gray-400' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 dark:text-white mb-2'>
              No permissions found
            </h3>
            <p className='text-gray-500 dark:text-gray-400 max-w-sm mx-auto'>
              {searchTerm
                ? `No permissions match "${searchTerm}". Try a different search term.`
                : 'No permissions are available to assign.'}
            </p>
          </div>
        ) : (
          <div className='space-y-6 max-h-[600px] overflow-y-auto pr-2'>
            {Object.entries(groupedPermissions).map(([category, perms]) => {
              const { Icon, colors } = getCategoryConfig(category);

              return (
                <div key={category} className='space-y-3'>
                  <div className='flex items-center gap-2 sticky top-0 bg-white dark:bg-gray-950 py-2'>
                    <div className={cn('p-1.5 rounded', colors.bg)}>
                      <Icon className={cn('h-4 w-4', colors.text)} />
                    </div>
                    <h4 className='font-semibold text-sm uppercase tracking-wide text-gray-700 dark:text-gray-300'>
                      {category.replace(/_/g, ' ')}
                    </h4>
                    <Badge variant='outline' className='text-xs ml-2'>
                      {(perms as any[]).length}
                    </Badge>
                  </div>
                  <div className='grid gap-2'>
                    {(perms as any[]).map((perm: any) => {
                      const isSelected = selectedPermissions.has(perm.name);

                      return (
                        <label
                          key={perm.id}
                          className={cn(
                            'flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all',
                            isSelected
                              ? cn(
                                  'bg-gradient-to-r from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10',
                                  colors.border
                                )
                              : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900'
                          )}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => togglePermission(perm.name)}
                            className='mt-0.5'
                          />
                          <div className='flex-1 min-w-0'>
                            <div className='flex items-center gap-2'>
                              <p className='font-medium text-gray-900 dark:text-white'>
                                {perm.name}
                              </p>
                              {isSelected && (
                                <CheckCircle2 className='h-4 w-4 text-emerald-600 dark:text-emerald-400' />
                              )}
                            </div>
                            {perm.description && (
                              <p className='text-sm text-gray-500 dark:text-gray-400 mt-0.5'>
                                {perm.description}
                              </p>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
