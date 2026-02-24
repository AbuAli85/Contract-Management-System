'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
import {
  Key,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Shield,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ForcePasswordChangeProps {
  userEmail: string;
  onSuccess?: () => void;
}

export function ForcePasswordChange({
  userEmail,
  onSuccess,
}: ForcePasswordChangeProps) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  const validatePassword = (password: string): string[] => {
    const errors: string[] = [];
    if (password.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('At least one uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('At least one lowercase letter');
    if (!/[0-9]/.test(password)) errors.push('At least one number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password))
      errors.push('At least one special character');
    return errors;
  };

  const passwordErrors = validatePassword(newPassword);
  const isPasswordValid =
    passwordErrors.length === 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) {
      setError('Please enter your current (temporary) password');
      return;
    }

    if (passwordErrors.length > 0) {
      setError('Password does not meet requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (currentPassword === newPassword) {
      setError('New password must be different from current password');
      return;
    }

    try {
      setLoading(true);

      // Call the change password API
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }

      // Update the profile to remove must_change_password flag
      if (supabase) {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          await supabase
            .from('profiles')
            .update({
              must_change_password: false,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id);

          // Also update user metadata
          await supabase.auth.updateUser({
            data: { must_change_password: false },
          });
        }
      }

      toast({
        title: 'Password Changed!',
        description: 'Your password has been updated successfully.',
      });

      onSuccess?.();

      // Redirect to dashboard
      router.push('/en/dashboard');
    } catch (err: any) {
      console.error('Password change error:', err);
      setError(err.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className='min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4'>
      <Card className='w-full max-w-md shadow-2xl border-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur'>
        <CardHeader className='space-y-4 text-center pb-2'>
          <div className='mx-auto w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg'>
            <Key className='h-8 w-8 text-white' />
          </div>
          <div>
            <CardTitle className='text-2xl font-bold'>
              Change Your Password
            </CardTitle>
            <CardDescription className='text-base mt-2'>
              For security, please create a new password for your account.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-4'>
            {error && (
              <Alert
                variant='destructive'
                className='border-red-200 bg-red-50 dark:bg-red-900/20'
              >
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='p-3 rounded-lg bg-gray-50 dark:bg-gray-800 text-sm'>
              <p className='text-gray-600 dark:text-gray-400'>
                Logged in as:{' '}
                <span className='font-medium text-gray-900 dark:text-white'>
                  {userEmail}
                </span>
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='current-password'>Temporary Password</Label>
              <div className='relative'>
                <Lock className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  id='current-password'
                  type={showCurrentPassword ? 'text' : 'password'}
                  placeholder='Enter temporary password'
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className='pl-10 pr-10'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  {showCurrentPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='new-password'>New Password</Label>
              <div className='relative'>
                <Key className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  id='new-password'
                  type={showNewPassword ? 'text' : 'password'}
                  placeholder='Create new password'
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className='pl-10 pr-10'
                  required
                />
                <button
                  type='button'
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'
                >
                  {showNewPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>

              {/* Password requirements */}
              {newPassword && (
                <div className='mt-2 space-y-1'>
                  {[
                    {
                      text: 'At least 8 characters',
                      met: newPassword.length >= 8,
                    },
                    {
                      text: 'Uppercase letter',
                      met: /[A-Z]/.test(newPassword),
                    },
                    {
                      text: 'Lowercase letter',
                      met: /[a-z]/.test(newPassword),
                    },
                    { text: 'Number', met: /[0-9]/.test(newPassword) },
                    {
                      text: 'Special character',
                      met: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
                    },
                  ].map((req, i) => (
                    <div key={i} className='flex items-center gap-2 text-xs'>
                      <CheckCircle2
                        className={`h-3 w-3 ${req.met ? 'text-emerald-500' : 'text-gray-300'}`}
                      />
                      <span
                        className={
                          req.met ? 'text-emerald-600' : 'text-gray-500'
                        }
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirm-password'>Confirm New Password</Label>
              <div className='relative'>
                <Shield className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400' />
                <Input
                  id='confirm-password'
                  type='password'
                  placeholder='Confirm new password'
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className='pl-10'
                  required
                />
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className='text-xs text-red-500'>Passwords do not match</p>
              )}
              {confirmPassword &&
                newPassword === confirmPassword &&
                confirmPassword.length > 0 && (
                  <p className='text-xs text-emerald-500 flex items-center gap-1'>
                    <CheckCircle2 className='h-3 w-3' /> Passwords match
                  </p>
                )}
            </div>

            <Button
              type='submit'
              disabled={loading || !isPasswordValid}
              className='w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-semibold h-11'
            >
              {loading ? (
                <>
                  <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                  Updating Password...
                </>
              ) : (
                <>
                  <Key className='h-4 w-4 mr-2' />
                  Update Password
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
