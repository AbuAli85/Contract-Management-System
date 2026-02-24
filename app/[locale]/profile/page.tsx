'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/lib/auth-service';
import { useToast } from '@/hooks/use-toast';
import {
  profileFormSchema,
  passwordChangeSchema,
  type ProfileFormData,
  type PasswordChangeData,
} from '@/lib/schemas/profile-form-schema';
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  User,
  Mail,
  Phone,
  Building,
  Briefcase,
  Camera,
  Key,
  Shield,
  Clock,
  Activity,
  Bell,
  Globe,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  RefreshCw,
} from 'lucide-react';
import { format } from 'date-fns';

// Types
interface UserProfile {
  full_name: string;
  email: string;
  phone?: string;
  department?: string;
  position?: string;
  avatar_url?: string;
  email_verified?: boolean;
  last_sign_in?: string;
  created_at: string;
  preferences?: {
    language: string;
    timezone: string;
    email_notifications: boolean;
    sms_notifications: boolean;
  };
}

interface ActivityLog {
  id: string;
  action: string;
  timestamp: string;
  details: string;
}

interface UserStats {
  contracts_created: number;
  promoters_managed: number;
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<UserStats>({
    contracts_created: 0,
    promoters_managed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  // React Hook Form for profile
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileFormSchema),
    mode: 'onChange',
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      department: '',
      position: '',
      avatar_url: '',
      preferences: {
        language: 'en',
        timezone: 'UTC',
        email_notifications: true,
        sms_notifications: false,
      },
    },
  });

  // React Hook Form for password change
  const passwordForm = useForm<PasswordChangeData>({
    resolver: zodResolver(passwordChangeSchema),
    mode: 'onChange',
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (user) {
      fetchProfileData();
    }
  }, [user]);

  const fetchProfileData = async () => {
    try {
      setLoading(true);

      // Fetch user profile with retry logic for 403 errors
      const profileResponse = await fetch('/api/users/profile');
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
        // Reset form with fetched data
        profileForm.reset({
          full_name: profileData.full_name || '',
          email: profileData.email || '',
          phone: profileData.phone || '',
          department: profileData.department || '',
          position: profileData.position || '',
          avatar_url: profileData.avatar_url || '',
          preferences: {
            language: profileData.preferences?.language || 'en',
            timezone: profileData.preferences?.timezone || 'UTC',
            email_notifications:
              profileData.preferences?.email_notifications !== false,
            sms_notifications:
              profileData.preferences?.sms_notifications === true,
          },
        });
      } else if (profileResponse.status === 403) {
        // Wait for auto-fix and retry
        console.log('🔄 Profile access denied, waiting for auto-fix...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        const retryResponse = await fetch('/api/users/profile');
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          setProfile(retryData);
          profileForm.reset({
            full_name: retryData.full_name || '',
            email: retryData.email || '',
            phone: retryData.phone || '',
            department: retryData.department || '',
            position: retryData.position || '',
            avatar_url: retryData.avatar_url || '',
            preferences: {
              language: retryData.preferences?.language || 'en',
              timezone: retryData.preferences?.timezone || 'UTC',
              email_notifications:
                retryData.preferences?.email_notifications !== false,
              sms_notifications:
                retryData.preferences?.sms_notifications === true,
            },
          });
        } else {
          throw new Error('Failed to load profile data after retry');
        }
      } else {
        const errorData = await profileResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error || errorData.message || 'Failed to load profile data'
        );
      }

      // Fetch activity log with retry logic for 403 errors
      const activityResponse = await fetch('/api/users/activity?limit=10');
      if (activityResponse.ok) {
        const activityData = await activityResponse.json();
        setActivity(activityData.activities || []);
      } else if (activityResponse.status === 403) {
        // Wait for auto-fix and retry
        console.log('🔄 Activity access denied, waiting for auto-fix...');
        await new Promise(resolve => setTimeout(resolve, 1500));
        const retryResponse = await fetch('/api/users/activity?limit=10');
        if (retryResponse.ok) {
          const retryData = await retryResponse.json();
          setActivity(retryData.activities || []);
        }
        // Don't throw error for activity - it's not critical
      }

      // Fetch stats
      const statsResponse = await fetch('/api/dashboard/stats');
      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats({
          contracts_created: statsData.totalContracts || 0,
          promoters_managed: statsData.totalPromoters || 0,
        });
      }
    } catch (error) {
      console.error('Error fetching profile data:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to load profile data';
      toast({
        title: 'Unable to Load Profile',
        description:
          errorMessage.includes('403') || errorMessage.includes('Forbidden')
            ? 'Please wait a moment and refresh the page. Your permissions are being set up automatically.'
            : errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (data: ProfileFormData) => {
    try {
      setSaving(true);

      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile(updatedProfile);
        toast({
          title: 'Success',
          description: 'Profile updated successfully',
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile changes',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: 'Error',
        description: 'Image size must be less than 2MB',
        variant: 'destructive',
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Error',
        description: 'Please upload an image file',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploadingAvatar(true);

      const formData = new FormData();
      formData.append('avatar', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const { url } = await response.json();
        profileForm.setValue('avatar_url', url);
        toast({
          title: 'Success',
          description: 'Avatar uploaded successfully',
        });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading avatar:', error);
      toast({
        title: 'Error',
        description: 'Failed to upload avatar',
        variant: 'destructive',
      });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleChangePassword = async (data: PasswordChangeData) => {
    try {
      setSaving(true);

      const response = await fetch('/api/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Password changed successfully',
        });
        setShowPasswordDialog(false);
        passwordForm.reset();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.message || 'Failed to change password',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error changing password:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <div className='container mx-auto py-6'>
        <div className='flex h-64 items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin text-primary' />
          <span className='ml-2'>Loading profile...</span>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className='container mx-auto py-6'>
        <Card className='border-red-200'>
          <CardContent className='flex flex-col items-center justify-center min-h-[400px] text-center px-4'>
            <div className='rounded-full bg-red-100 p-4 mb-4'>
              <AlertCircle className='h-12 w-12 text-red-600' />
            </div>
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>
              Unable to Load Profile
            </h3>
            <p className='text-gray-600 mb-6 max-w-md'>
              We couldn't load your profile information. This might be a
              temporary issue. Please try again.
            </p>
            <div className='flex gap-3'>
              <Button onClick={fetchProfileData} variant='default'>
                <RefreshCw className='h-4 w-4 mr-2' />
                Try Again
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant='outline'
              >
                Refresh Page
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-6 py-6'>
      {/* Page Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Profile Settings</h1>
          <p className='text-muted-foreground'>
            Manage your account settings and preferences
          </p>
        </div>
        <Button
          onClick={profileForm.handleSubmit(handleSaveProfile)}
          disabled={saving || !profileForm.formState.isValid}
        >
          {saving ? (
            <>
              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
              Saving...
            </>
          ) : (
            <>
              <Save className='mr-2 h-4 w-4' />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className='grid gap-6 md:grid-cols-3'>
        {/* Left Column - Main Profile */}
        <div className='space-y-6 md:col-span-2'>
          {/* User Information */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='h-5 w-5' />
                User Information
              </CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6'>
              {/* Avatar Upload */}
              <div className='flex items-center gap-4'>
                <Avatar className='h-24 w-24'>
                  <AvatarImage
                    src={profileForm.watch('avatar_url') || profile.avatar_url}
                    alt={profile.full_name}
                  />
                  <AvatarFallback className='text-2xl'>
                    {getInitials(profile.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div className='space-y-2'>
                  <Label htmlFor='avatar-upload' className='cursor-pointer'>
                    <div className='flex items-center gap-2'>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={uploadingAvatar}
                        asChild
                      >
                        <span>
                          {uploadingAvatar ? (
                            <>
                              <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Camera className='mr-2 h-4 w-4' />
                              Change Avatar
                            </>
                          )}
                        </span>
                      </Button>
                    </div>
                  </Label>
                  <input
                    id='avatar-upload'
                    type='file'
                    accept='image/*'
                    className='hidden'
                    onChange={handleAvatarUpload}
                    disabled={uploadingAvatar}
                    aria-label='Upload avatar image'
                    title='Upload avatar image'
                  />
                  <p className='text-xs text-muted-foreground'>
                    JPG, PNG or GIF. Max size 2MB.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className='grid gap-4 md:grid-cols-2'>
                {/* Full Name - with validation */}
                <Controller
                  name='full_name'
                  control={profileForm.control}
                  render={({ field }) => (
                    <div className='space-y-2'>
                      <Label htmlFor='full_name'>Full Name</Label>
                      <div className='relative'>
                        <User
                          className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground'
                          aria-hidden='true'
                        />
                        <Input
                          id='full_name'
                          value={field.value}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          className={`pl-9 ${profileForm.formState.errors.full_name ? 'border-red-500' : profileForm.formState.dirtyFields.full_name ? 'border-green-500' : ''}`}
                          disabled={saving}
                        />
                      </div>
                      {profileForm.formState.errors.full_name && (
                        <p className='text-sm text-red-500 flex items-center gap-1'>
                          <AlertCircle className='h-3 w-3' />
                          {profileForm.formState.errors.full_name.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                {/* Email - Read only */}
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email Address</Label>
                  <div className='relative'>
                    <Mail
                      className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground'
                      aria-hidden='true'
                    />
                    <Input
                      id='email'
                      type='email'
                      value={profile.email}
                      disabled
                      className='pl-9 bg-muted'
                    />
                  </div>
                  <p className='text-xs text-muted-foreground flex items-center gap-1'>
                    {profile.email_verified ? (
                      <>
                        <CheckCircle2 className='h-3 w-3 text-green-500' />
                        Verified
                      </>
                    ) : (
                      <>
                        <AlertCircle className='h-3 w-3 text-amber-500' />
                        Not verified
                      </>
                    )}
                  </p>
                </div>

                {/* Phone - with validation */}
                <Controller
                  name='phone'
                  control={profileForm.control}
                  render={({ field }) => (
                    <div className='space-y-2'>
                      <Label htmlFor='phone'>Phone Number</Label>
                      <div className='relative'>
                        <Phone
                          className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground'
                          aria-hidden='true'
                        />
                        <Input
                          id='phone'
                          type='tel'
                          value={field.value || ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          className={`pl-9 ${profileForm.formState.errors.phone ? 'border-red-500' : field.value && profileForm.formState.dirtyFields.phone ? 'border-green-500' : ''}`}
                          placeholder='+1 (555) 000-0000'
                          disabled={saving}
                        />
                      </div>
                      {profileForm.formState.errors.phone && (
                        <p className='text-sm text-red-500 flex items-center gap-1'>
                          <AlertCircle className='h-3 w-3' />
                          {profileForm.formState.errors.phone.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                {/* Department - with validation */}
                <Controller
                  name='department'
                  control={profileForm.control}
                  render={({ field }) => (
                    <div className='space-y-2'>
                      <Label htmlFor='department'>Department</Label>
                      <div className='relative'>
                        <Building
                          className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground'
                          aria-hidden='true'
                        />
                        <Input
                          id='department'
                          value={field.value || ''}
                          onChange={field.onChange}
                          onBlur={field.onBlur}
                          className={`pl-9 ${profileForm.formState.errors.department ? 'border-red-500' : field.value && profileForm.formState.dirtyFields.department ? 'border-green-500' : ''}`}
                          placeholder='e.g., Human Resources'
                          disabled={saving}
                        />
                      </div>
                      {profileForm.formState.errors.department && (
                        <p className='text-sm text-red-500 flex items-center gap-1'>
                          <AlertCircle className='h-3 w-3' />
                          {profileForm.formState.errors.department.message}
                        </p>
                      )}
                    </div>
                  )}
                />

                {/* Position - with validation */}
                <div className='space-y-2 md:col-span-2'>
                  <Controller
                    name='position'
                    control={profileForm.control}
                    render={({ field }) => (
                      <>
                        <Label htmlFor='position'>Position</Label>
                        <div className='relative'>
                          <Briefcase
                            className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground'
                            aria-hidden='true'
                          />
                          <Input
                            id='position'
                            value={field.value || ''}
                            onChange={field.onChange}
                            onBlur={field.onBlur}
                            className={`pl-9 ${profileForm.formState.errors.position ? 'border-red-500' : field.value && profileForm.formState.dirtyFields.position ? 'border-green-500' : ''}`}
                            placeholder='e.g., HR Manager'
                            disabled={saving}
                          />
                        </div>
                        {profileForm.formState.errors.position && (
                          <p className='text-sm text-red-500 flex items-center gap-1'>
                            <AlertCircle className='h-3 w-3' />
                            {profileForm.formState.errors.position.message}
                          </p>
                        )}
                      </>
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Shield className='h-5 w-5' />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account security and authentication
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='font-medium'>Password</p>
                  <p className='text-sm text-muted-foreground'>
                    Change your account password
                  </p>
                </div>
                <Dialog
                  open={showPasswordDialog}
                  onOpenChange={setShowPasswordDialog}
                >
                  <DialogTrigger asChild>
                    <Button variant='outline'>
                      <Key className='mr-2 h-4 w-4' />
                      Change Password
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Change Password</DialogTitle>
                      <DialogDescription>
                        Enter your current password and choose a new one
                      </DialogDescription>
                    </DialogHeader>
                    <div className='space-y-4'>
                      {/* Current Password */}
                      <Controller
                        name='currentPassword'
                        control={passwordForm.control}
                        render={({ field }) => (
                          <div className='space-y-2'>
                            <Label htmlFor='current-password'>
                              Current Password
                            </Label>
                            <Input
                              id='current-password'
                              type='password'
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              className={
                                passwordForm.formState.errors.currentPassword
                                  ? 'border-red-500'
                                  : ''
                              }
                              disabled={saving}
                            />
                            {passwordForm.formState.errors.currentPassword && (
                              <p className='text-sm text-red-500 flex items-center gap-1'>
                                <AlertCircle className='h-3 w-3' />
                                {
                                  passwordForm.formState.errors.currentPassword
                                    .message
                                }
                              </p>
                            )}
                          </div>
                        )}
                      />

                      {/* New Password */}
                      <Controller
                        name='newPassword'
                        control={passwordForm.control}
                        render={({ field }) => (
                          <div className='space-y-2'>
                            <Label htmlFor='new-password'>New Password</Label>
                            <Input
                              id='new-password'
                              type='password'
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              className={
                                passwordForm.formState.errors.newPassword
                                  ? 'border-red-500'
                                  : field.value &&
                                      !passwordForm.formState.errors.newPassword
                                    ? 'border-green-500'
                                    : ''
                              }
                              disabled={saving}
                            />
                            {passwordForm.formState.errors.newPassword && (
                              <p className='text-sm text-red-500 flex items-center gap-1'>
                                <AlertCircle className='h-3 w-3' />
                                {
                                  passwordForm.formState.errors.newPassword
                                    .message
                                }
                              </p>
                            )}
                            <p className='text-xs text-muted-foreground'>
                              Must be at least 8 characters with uppercase,
                              lowercase, and numbers
                            </p>
                          </div>
                        )}
                      />

                      {/* Confirm Password */}
                      <Controller
                        name='confirmPassword'
                        control={passwordForm.control}
                        render={({ field }) => (
                          <div className='space-y-2'>
                            <Label htmlFor='confirm-password'>
                              Confirm New Password
                            </Label>
                            <Input
                              id='confirm-password'
                              type='password'
                              value={field.value}
                              onChange={field.onChange}
                              onBlur={field.onBlur}
                              className={
                                passwordForm.formState.errors.confirmPassword
                                  ? 'border-red-500'
                                  : field.value &&
                                      !passwordForm.formState.errors
                                        .confirmPassword
                                    ? 'border-green-500'
                                    : ''
                              }
                              disabled={saving}
                            />
                            {passwordForm.formState.errors.confirmPassword && (
                              <p className='text-sm text-red-500 flex items-center gap-1'>
                                <AlertCircle className='h-3 w-3' />
                                {
                                  passwordForm.formState.errors.confirmPassword
                                    .message
                                }
                              </p>
                            )}
                          </div>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button
                        variant='outline'
                        onClick={() => {
                          setShowPasswordDialog(false);
                          passwordForm.reset();
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={passwordForm.handleSubmit(
                          handleChangePassword
                        )}
                        disabled={saving || !passwordForm.formState.isValid}
                      >
                        {saving ? (
                          <>
                            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                            Changing...
                          </>
                        ) : (
                          'Change Password'
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <Separator />

              <div className='grid gap-3'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <Clock className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm'>Last Login:</span>
                  </div>
                  <span className='text-sm text-muted-foreground'>
                    {profile.last_sign_in
                      ? format(
                          new Date(profile.last_sign_in),
                          'MMM d, yyyy h:mm a'
                        )
                      : 'Never'}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <User className='h-4 w-4 text-muted-foreground' />
                    <span className='text-sm'>Account Created:</span>
                  </div>
                  <span className='text-sm text-muted-foreground'>
                    {format(new Date(profile.created_at), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Globe className='h-5 w-5' />
                Preferences
              </CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid gap-4'>
                {/* Language */}
                <div className='space-y-2'>
                  <Label htmlFor='language'>Language</Label>
                  <Controller
                    name='preferences.language'
                    control={profileForm.control}
                    render={({ field }) => (
                      <Select
                        value={field.value || 'en'}
                        onValueChange={field.onChange}
                        disabled={saving}
                      >
                        <SelectTrigger id='language'>
                          <SelectValue placeholder='Select language' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='en'>English</SelectItem>
                          <SelectItem value='ar'>Arabic (العربية)</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                {/* Timezone */}
                <div className='space-y-2'>
                  <Label htmlFor='timezone'>Timezone</Label>
                  <Controller
                    name='preferences.timezone'
                    control={profileForm.control}
                    render={({ field }) => (
                      <Select
                        value={field.value || 'UTC'}
                        onValueChange={field.onChange}
                        disabled={saving}
                      >
                        <SelectTrigger id='timezone'>
                          <SelectValue placeholder='Select timezone' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value='UTC'>UTC</SelectItem>
                          <SelectItem value='America/New_York'>
                            Eastern Time (ET)
                          </SelectItem>
                          <SelectItem value='America/Chicago'>
                            Central Time (CT)
                          </SelectItem>
                          <SelectItem value='America/Denver'>
                            Mountain Time (MT)
                          </SelectItem>
                          <SelectItem value='America/Los_Angeles'>
                            Pacific Time (PT)
                          </SelectItem>
                          <SelectItem value='Europe/London'>
                            London (GMT)
                          </SelectItem>
                          <SelectItem value='Asia/Dubai'>
                            Dubai (GST)
                          </SelectItem>
                          <SelectItem value='Asia/Riyadh'>
                            Riyadh (AST)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <Separator />

                {/* Email Notifications */}
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label className='flex items-center gap-2'>
                      <Bell className='h-4 w-4' />
                      Email Notifications
                    </Label>
                    <p className='text-sm text-muted-foreground'>
                      Receive email updates and alerts
                    </p>
                  </div>
                  <Controller
                    name='preferences.email_notifications'
                    control={profileForm.control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value ?? true}
                        onCheckedChange={field.onChange}
                        disabled={saving}
                      />
                    )}
                  />
                </div>

                {/* SMS Notifications */}
                <div className='flex items-center justify-between'>
                  <div className='space-y-0.5'>
                    <Label className='flex items-center gap-2'>
                      <Phone className='h-4 w-4' />
                      SMS Notifications
                    </Label>
                    <p className='text-sm text-muted-foreground'>
                      Receive SMS alerts for important updates
                    </p>
                  </div>
                  <Controller
                    name='preferences.sms_notifications'
                    control={profileForm.control}
                    render={({ field }) => (
                      <Switch
                        checked={field.value ?? false}
                        onCheckedChange={field.onChange}
                        disabled={saving}
                      />
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Stats and Activity */}
        <div className='space-y-6'>
          {/* Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Activity className='h-5 w-5' />
                Statistics
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    Contracts Created
                  </span>
                  <Badge
                    variant='secondary'
                    className='text-base font-semibold'
                  >
                    {stats.contracts_created}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm text-muted-foreground'>
                    Promoters Managed
                  </span>
                  <Badge
                    variant='secondary'
                    className='text-base font-semibold'
                  >
                    {stats.promoters_managed}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Clock className='h-5 w-5' />
                Recent Activity
              </CardTitle>
              <CardDescription>Your last 10 actions</CardDescription>
            </CardHeader>
            <CardContent>
              {activity.length === 0 ? (
                <p className='text-sm text-muted-foreground text-center py-4'>
                  No recent activity
                </p>
              ) : (
                <div className='space-y-3'>
                  {activity.map(item => (
                    <div key={item.id} className='flex gap-2 text-sm'>
                      <Activity className='h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0' />
                      <div className='flex-1 space-y-1'>
                        <p className='leading-none'>{item.action}</p>
                        <p className='text-xs text-muted-foreground'>
                          {format(new Date(item.timestamp), 'MMM d, h:mm a')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Force dynamic rendering
export const dynamic = 'force-dynamic';
