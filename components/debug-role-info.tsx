'use client';

import { useAuth } from '@/lib/auth-service';
import { useUserProfile } from '@/hooks/use-user-profile';
import { useRolePermissions } from '@/components/user-role-display';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function DebugRoleInfo() {
  const { user } = useAuth();
  const { profile } = useUserProfile();
  const { currentRole, roleInfo } = useRolePermissions();

  const handleRefreshProfile = async () => {
    // Force a profile refresh
    window.location.reload();
  };

  return (
    <Card className='max-w-md'>
      <CardHeader>
        <CardTitle>Debug Role Info</CardTitle>
      </CardHeader>
      <CardContent className='space-y-2 text-sm'>
        <p>
          <strong>Auth User ID:</strong> {user?.id}
        </p>
        <p>
          <strong>Auth User Email:</strong> {user?.email}
        </p>
        <p>
          <strong>Auth User Metadata Role:</strong>{' '}
          {user?.user_metadata?.role || 'null'}
        </p>
        <p>
          <strong>Profile Role:</strong> {profile?.role || 'null'}
        </p>
        <p>
          <strong>Current Role (hook):</strong> {currentRole}
        </p>
        <p>
          <strong>Role Display:</strong> {roleInfo.displayText}
        </p>
        <p>
          <strong>Profile Full Name:</strong> {profile?.full_name || 'null'}
        </p>
        <p>
          <strong>Profile Display Name:</strong>{' '}
          {profile?.display_name || 'null'}
        </p>
        <Button onClick={handleRefreshProfile} size='sm'>
          Refresh Profile
        </Button>
      </CardContent>
    </Card>
  );
}
