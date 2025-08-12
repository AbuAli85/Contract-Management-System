'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/auth-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Mail, Phone, Building, Briefcase } from 'lucide-react';
import { getRoleDisplay } from '@/lib/role-hierarchy';

export default function ProfilePage() {
  const { user, profile, loading, updateProfile } = useAuth();
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    avatar_url: profile?.avatar_url || '',
  });
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdating(true);
    setError(null);
    setSuccess(null);

    try {
      const { error } = await updateProfile(formData);

      if (error) {
        setError(error);
      } else {
        setSuccess('Profile updated successfully!');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Loader2 className='h-8 w-8 animate-spin' />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className='flex min-h-screen items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardContent className='pt-6'>
            <p className='text-center text-muted-foreground'>
              No profile found. Please contact an administrator.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-2xl'>
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='h-5 w-5' />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Update your personal information and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {error && (
                <Alert variant='destructive'>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription>{success}</AlertDescription>
                </Alert>
              )}

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <div className='space-y-2'>
                  <Label htmlFor='email' className='flex items-center gap-2'>
                    <Mail className='h-4 w-4' />
                    Email
                  </Label>
                  <Input
                    id='email'
                    type='email'
                    value={user?.email || ''}
                    disabled
                    className='bg-gray-50'
                  />
                  <p className='text-sm text-muted-foreground'>
                    Email cannot be changed
                  </p>
                </div>

                <div className='space-y-2'>
                  <Label
                    htmlFor='full_name'
                    className='flex items-center gap-2'
                  >
                    <User className='h-4 w-4' />
                    Full Name
                  </Label>
                  <Input
                    id='full_name'
                    type='text'
                    value={formData.full_name}
                    onChange={e =>
                      handleInputChange('full_name', e.target.value)
                    }
                    placeholder='Enter your full name'
                  />
                </div>

                <div className='space-y-2'>
                  <Label
                    htmlFor='avatar_url'
                    className='flex items-center gap-2'
                  >
                    <User className='h-4 w-4' />
                    Avatar URL
                  </Label>
                  <Input
                    id='avatar_url'
                    type='url'
                    value={formData.avatar_url}
                    onChange={e =>
                      handleInputChange('avatar_url', e.target.value)
                    }
                    placeholder='Enter your avatar URL'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='role'>Role</Label>
                  <Input
                    id='role'
                    type='text'
                    value={getRoleDisplay(profile?.role || 'user').displayText}
                    disabled
                    className='bg-gray-50'
                  />
                  <p className='text-sm text-muted-foreground'>
                    Role is managed by administrators
                  </p>
                </div>
              </div>

              <div className='flex justify-end'>
                <Button type='submit' disabled={updating}>
                  {updating ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Updating...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
