'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Shield, Building, Mail, Calendar } from 'lucide-react';

export function UserProfile() {
  const { user } = useAuth();
  const { userRole, hasPermission, companyId, isCompanyMember } =
    useEnhancedRBAC();
  const [, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const supabase = createClient();

        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  if (!user) {
    return (
      <div className='text-center p-8'>
        <p className='text-gray-600'>Please log in to view your profile.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className='text-center p-8'>
        <p className='text-gray-600'>Loading profile...</p>
      </div>
    );
  }

  return (
    <div className='max-w-4xl mx-auto p-6 space-y-6'>
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <User className='h-5 w-5' />
            User Profile
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Email</label>
              <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-md'>
                <Mail className='h-4 w-4 text-gray-500' />
                <span>{user.email}</span>
              </div>
            </div>

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>Role</label>
              <div className='flex items-center gap-2'>
                <Shield className='h-4 w-4 text-gray-500' />
                <Badge variant={userRole === 'admin' ? 'default' : 'secondary'}>
                  {userRole || 'user'}
                </Badge>
              </div>
            </div>

            {companyId && (
              <div className='space-y-2'>
                <label className='text-sm font-medium text-gray-700'>
                  Company
                </label>
                <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-md'>
                  <Building className='h-4 w-4 text-gray-500' />
                  <span>Company ID: {companyId}</span>
                  <Badge variant={isCompanyMember ? 'default' : 'outline'}>
                    {isCompanyMember ? 'Active Member' : 'Inactive'}
                  </Badge>
                </div>
              </div>
            )}

            <div className='space-y-2'>
              <label className='text-sm font-medium text-gray-700'>
                Account Created
              </label>
              <div className='flex items-center gap-2 p-3 bg-gray-50 rounded-md'>
                <Calendar className='h-4 w-4 text-gray-500' />
                <span>{new Date(user.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          {hasPermission('profile.edit') && (
            <div className='pt-4'>
              <Button variant='outline'>Edit Profile</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {hasPermission('dashboard.view_all') && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Access</CardTitle>
          </CardHeader>
          <CardContent>
            <p className='text-gray-600'>
              You have administrative access to the system. You can manage
              users, contracts, and system settings.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
