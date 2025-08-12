'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/lib/auth-service';
import { useToast } from '@/hooks/use-toast';

export function AdminRoleFixer() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const handleFixCurrentUserRole = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const response = await fetch('/api/admin/update-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: [user.id],
          newRole: 'admin',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Role Updated',
          description:
            'Your role has been updated to admin. Refreshing page...',
        });

        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: 'Update Failed',
          description: result.error || 'Failed to update role',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while updating the role',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFixAllAdminRoles = async () => {
    setLoading(true);
    try {
      // Get all users that should be admin
      const usersResponse = await fetch('/api/users');
      const usersData = await usersResponse.json();

      const adminEmails = [
        'luxsess2001@gmail.com',
        'operations@falconeyegroup.net',
      ];
      const adminUsers =
        usersData.users?.filter((u: any) => adminEmails.includes(u.email)) ||
        [];

      if (adminUsers.length === 0) {
        toast({
          title: 'No Users Found',
          description: 'No admin users found to update',
          variant: 'destructive',
        });
        return;
      }

      const response = await fetch('/api/admin/update-roles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userIds: adminUsers.map((u: any) => u.id),
          newRole: 'admin',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast({
          title: 'Roles Updated',
          description: `Updated ${result.updated?.length || 0} users to admin role. Refreshing page...`,
        });

        // Refresh the page after a short delay
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        toast({
          title: 'Update Failed',
          description: result.error || 'Failed to update roles',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating roles:', error);
      toast({
        title: 'Error',
        description: 'An error occurred while updating roles',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className='max-w-md'>
      <CardHeader>
        <CardTitle>Admin Role Fixer</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        <p className='text-sm text-muted-foreground'>
          If your role is showing as "User" instead of "Admin", use these
          buttons to fix it:
        </p>

        <Button
          onClick={handleFixCurrentUserRole}
          disabled={loading}
          className='w-full'
        >
          {loading ? 'Updating...' : 'Fix My Role to Admin'}
        </Button>

        <Button
          onClick={handleFixAllAdminRoles}
          disabled={loading}
          variant='outline'
          className='w-full'
        >
          {loading ? 'Updating...' : 'Fix All Admin Roles'}
        </Button>
      </CardContent>
    </Card>
  );
}
