'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Shield, Search, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PermissionsManagerProps {
  employerEmployeeId: string;
}

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
  const { toast } = useToast();

  useEffect(() => {
    fetchPermissions();
    fetchAvailablePermissions();
  }, [employerEmployeeId]);

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
      setSelectedPermissions(new Set(granted));
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

  const filteredPermissions = availablePermissions.filter(perm =>
    perm.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    perm.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const groupedPermissions = filteredPermissions.reduce((acc, perm) => {
    const category = perm.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(perm);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Manage Permissions
          </CardTitle>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              'Saving...'
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Permissions
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        {loading ? (
          <p>Loading permissions...</p>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category} className="space-y-2">
                <h4 className="font-semibold text-sm uppercase text-gray-500">
                  {category.replace(/_/g, ' ')}
                </h4>
                <div className="space-y-2">
                  {(perms as any[]).map((perm: any) => (
                    <label
                      key={perm.id}
                      className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50"
                    >
                      <Checkbox
                        checked={selectedPermissions.has(perm.name)}
                        onCheckedChange={() => togglePermission(perm.name)}
                      />
                      <div className="flex-1">
                        <p className="font-medium">{perm.name}</p>
                        {perm.description && (
                          <p className="text-sm text-gray-500">
                            {perm.description}
                          </p>
                        )}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

