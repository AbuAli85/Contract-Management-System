'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Shield,
  Key,
  Eye,
  EyeOff,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Clock,
  Globe,
} from 'lucide-react';

export default function ProfileSecurityPage() {
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaCode, setMfaCode] = useState('');

  const securityStatus = {
    passwordStrength: 'strong',
    lastPasswordChange: '2024-01-10',
    mfaEnabled: false,
    activeSessions: 2,
    lastLogin: '2024-01-15 10:30:00',
    loginLocation: 'New York, NY',
  };

  const getPasswordStrengthColor = (strength: string) => {
    switch (strength) {
      case 'strong':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'weak':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className='space-y-6'>
      {/* Page Header */}
      <div className='space-y-2'>
        <h1 className='text-3xl font-bold tracking-tight'>Security Settings</h1>
        <p className='text-muted-foreground'>
          Manage your account security and authentication settings
        </p>
      </div>

      {/* Security Overview */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Shield className='h-5 w-5' />
            Security Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4'>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Key className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm font-medium'>Password Strength</span>
              </div>
              <Badge
                className={getPasswordStrengthColor(
                  securityStatus.passwordStrength
                )}
              >
                {securityStatus.passwordStrength.charAt(0).toUpperCase() +
                  securityStatus.passwordStrength.slice(1)}
              </Badge>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Clock className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm font-medium'>Last Changed</span>
              </div>
              <span className='text-sm text-muted-foreground'>
                {securityStatus.lastPasswordChange}
              </span>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Smartphone className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm font-medium'>2FA Status</span>
              </div>
              <Badge
                variant={securityStatus.mfaEnabled ? 'default' : 'secondary'}
              >
                {securityStatus.mfaEnabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Globe className='h-4 w-4 text-muted-foreground' />
                <span className='text-sm font-medium'>Active Sessions</span>
              </div>
              <span className='text-sm text-muted-foreground'>
                {securityStatus.activeSessions} devices
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Key className='h-5 w-5' />
            Change Password
          </CardTitle>
          <CardDescription>
            Update your account password to keep your account secure
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-2'>
            <Label htmlFor='currentPassword'>Current Password</Label>
            <div className='relative'>
              <Input
                id='currentPassword'
                type={showCurrentPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                placeholder='Enter your current password'
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='newPassword'>New Password</Label>
            <div className='relative'>
              <Input
                id='newPassword'
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder='Enter your new password'
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>
          <div className='space-y-2'>
            <Label htmlFor='confirmPassword'>Confirm New Password</Label>
            <div className='relative'>
              <Input
                id='confirmPassword'
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder='Confirm your new password'
              />
              <Button
                type='button'
                variant='ghost'
                size='sm'
                className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className='h-4 w-4' />
                ) : (
                  <Eye className='h-4 w-4' />
                )}
              </Button>
            </div>
          </div>
          <Button>Update Password</Button>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Smartphone className='h-5 w-5' />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='flex items-center justify-between'>
            <div className='space-y-0.5'>
              <Label>Enable 2FA</Label>
              <p className='text-sm text-muted-foreground'>
                Use an authenticator app for additional security
              </p>
            </div>
            <Switch checked={mfaEnabled} onCheckedChange={setMfaEnabled} />
          </div>

          {mfaEnabled && (
            <div className='space-y-4 rounded-lg border bg-muted/50 p-4'>
              <div className='space-y-2'>
                <Label htmlFor='mfaCode'>Verification Code</Label>
                <Input
                  id='mfaCode'
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value)}
                  placeholder='Enter 6-digit code'
                  maxLength={6}
                />
              </div>
              <div className='flex gap-2'>
                <Button size='sm'>Verify</Button>
                <Button variant='outline' size='sm'>
                  Setup Authenticator
                </Button>
              </div>
            </div>
          )}

          <Alert>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              Two-factor authentication adds an extra layer of security by
              requiring a verification code in addition to your password.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Session Management */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <Globe className='h-5 w-5' />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage your active login sessions across devices
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='space-y-3'>
            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-blue-100 p-2'>
                  <Globe className='h-4 w-4 text-blue-600' />
                </div>
                <div>
                  <p className='font-medium'>Chrome on Windows</p>
                  <p className='text-sm text-muted-foreground'>
                    {securityStatus.loginLocation} • {securityStatus.lastLogin}
                  </p>
                </div>
              </div>
              <Badge variant='default' className='bg-green-100 text-green-800'>
                Current
              </Badge>
            </div>

            <div className='flex items-center justify-between rounded-lg border p-3'>
              <div className='flex items-center gap-3'>
                <div className='rounded-lg bg-gray-100 p-2'>
                  <Smartphone className='h-4 w-4 text-gray-600' />
                </div>
                <div>
                  <p className='font-medium'>Mobile App</p>
                  <p className='text-sm text-muted-foreground'>
                    iPhone • 2024-01-14 15:20:00
                  </p>
                </div>
              </div>
              <Button variant='outline' size='sm'>
                Revoke
              </Button>
            </div>
          </div>

          <div className='flex gap-2'>
            <Button variant='outline'>Revoke All Sessions</Button>
            <Button variant='outline'>View All Sessions</Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <CheckCircle className='h-5 w-5' />
            Security Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-3'>
            <div className='flex items-start gap-3 rounded-lg border p-3'>
              <CheckCircle className='mt-0.5 h-5 w-5 text-green-600' />
              <div>
                <p className='font-medium'>Use a strong password</p>
                <p className='text-sm text-muted-foreground'>
                  Your password should be at least 8 characters long and include
                  a mix of letters, numbers, and symbols.
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3 rounded-lg border p-3'>
              <AlertTriangle className='mt-0.5 h-5 w-5 text-yellow-600' />
              <div>
                <p className='font-medium'>Enable two-factor authentication</p>
                <p className='text-sm text-muted-foreground'>
                  Add an extra layer of security by enabling 2FA on your
                  account.
                </p>
              </div>
            </div>

            <div className='flex items-start gap-3 rounded-lg border p-3'>
              <CheckCircle className='mt-0.5 h-5 w-5 text-green-600' />
              <div>
                <p className='font-medium'>Regular password updates</p>
                <p className='text-sm text-muted-foreground'>
                  Consider updating your password regularly for better security.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
