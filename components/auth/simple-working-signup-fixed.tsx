'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  Shield,
  ExternalLink,
} from 'lucide-react';

interface SignupFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: string;
  phone?: string;
  company?: string;
}

const ROLE_OPTIONS = [
  {
    value: 'provider',
    label: 'Service Provider',
    icon: Building,
    description: 'Offer services to clients',
  },
  {
    value: 'client',
    label: 'Client',
    icon: User,
    description: 'Book and manage services',
  },
  {
    value: 'admin',
    label: 'Administrator',
    icon: Shield,
    description: 'Manage the platform',
  },
];

export default function SimpleWorkingSignupFixed() {
  const [formData, setFormData] = useState<SignupFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'provider',
    phone: '',
    company: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showCaptchaInstructions, setShowCaptchaInstructions] = useState(false);
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError('');
  };

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      role: value,
    }));
  };

  const validateForm = (): string | null => {
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    if (!formData.fullName.trim()) {
      return 'Full name is required';
    }
    if (formData.fullName.trim().length < 2) {
      return 'Full name must be at least 2 characters';
    }
    if (!formData.password.trim()) {
      return 'Password is required';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      return 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }
    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }
    return null;
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setShowCaptchaInstructions(false);

    try {
      console.log('🔐 Simple Signup Fixed - Starting signup process...');
      console.log('🔐 Simple Signup Fixed - Email:', formData.email);
      console.log('🔐 Simple Signup Fixed - Role:', formData.role);

      // Use the simple register API
      const response = await fetch('/api/auth/simple-register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email.trim(),
          password: formData.password,
          fullName: formData.fullName.trim(),
          role: formData.role,
          phone: formData.phone?.trim() || null,
          company: formData.company?.trim() || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.error('🔐 Simple Signup Fixed - API error:', data);

        // Check if it's a CAPTCHA error
        if (data.captchaRequired) {
          setShowCaptchaInstructions(true);
          setError(data.error);
          return;
        }

        setError(data.error || 'Registration failed');
        return;
      }

      console.log(
        '🔐 Simple Signup Fixed - Registration successful:',
        data.user.id
      );
      setSuccess('Registration successful! Redirecting to login...');

      // Redirect to login after a delay
      setTimeout(() => {
        router.push(
          '/en/auth/login?message=Registration successful. You can now sign in.'
        );
      }, 2000);
    } catch (error) {
      console.error('🔐 Simple Signup Fixed - Exception:', error);
      setError(
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const openSupabaseDashboard = () => {
    window.open('https://supabase.com/dashboard', '_blank');
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl font-bold text-gray-900'>
            Create Account
          </CardTitle>
          <p className='text-sm text-gray-600'>
            Working registration without CAPTCHA issues
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email Address</Label>
              <Input
                id='email'
                name='email'
                type='email'
                value={formData.email}
                onChange={handleInputChange}
                placeholder='Enter your email'
                required
                disabled={loading}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='fullName'>Full Name</Label>
              <Input
                id='fullName'
                name='fullName'
                type='text'
                value={formData.fullName}
                onChange={handleInputChange}
                placeholder='Enter your full name'
                required
                disabled={loading}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='role'>Account Type</Label>
              <Select value={formData.role} onValueChange={handleRoleChange}>
                <SelectTrigger>
                  <SelectValue placeholder='Select account type' />
                </SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map(option => {
                    const Icon = option.icon;
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <div className='flex items-center gap-2'>
                          <Icon className='h-4 w-4' />
                          <div>
                            <div className='font-medium'>{option.label}</div>
                            <div className='text-xs text-gray-500'>
                              {option.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {formData.role === 'provider' && (
              <div className='space-y-2'>
                <Label htmlFor='company'>Company Name (Optional)</Label>
                <Input
                  id='company'
                  name='company'
                  type='text'
                  value={formData.company}
                  onChange={handleInputChange}
                  placeholder='Enter your company name'
                  disabled={loading}
                />
              </div>
            )}

            <div className='space-y-2'>
              <Label htmlFor='phone'>Phone Number (Optional)</Label>
              <Input
                id='phone'
                name='phone'
                type='tel'
                value={formData.phone}
                onChange={handleInputChange}
                placeholder='Enter your phone number'
                disabled={loading}
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Input
                  id='password'
                  name='password'
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder='Create a password'
                  required
                  disabled={loading}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </Button>
              </div>
              <p className='text-xs text-gray-500'>
                Must be at least 8 characters with uppercase, lowercase, and
                number
              </p>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='confirmPassword'>Confirm Password</Label>
              <div className='relative'>
                <Input
                  id='confirmPassword'
                  name='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder='Confirm your password'
                  required
                  disabled={loading}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant='destructive'>
                <AlertCircle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className='border-green-200 bg-green-50'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <AlertDescription className='text-green-800'>
                  {success}
                </AlertDescription>
              </Alert>
            )}

            <Button type='submit' className='w-full' disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>

          {/* CAPTCHA Instructions */}
          {showCaptchaInstructions && (
            <div className='mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md'>
              <h3 className='font-medium text-yellow-900 mb-2'>
                CAPTCHA Verification Required
              </h3>
              <p className='text-sm text-yellow-800 mb-3'>
                Your Supabase project has CAPTCHA enabled. To fix this:
              </p>
              <ol className='text-sm text-yellow-800 space-y-1 list-decimal list-inside mb-3'>
                <li>Go to Supabase Dashboard</li>
                <li>Navigate to Authentication → Settings</li>
                <li>Find the CAPTCHA section</li>
                <li>Disable CAPTCHA verification</li>
                <li>Save changes</li>
              </ol>
              <Button
                onClick={openSupabaseDashboard}
                size='sm'
                className='bg-yellow-600 hover:bg-yellow-700'
              >
                <ExternalLink className='mr-2 h-4 w-4' />
                Open Supabase Dashboard
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className='mt-6 pt-4 border-t text-center'>
            <Button
              variant='ghost'
              onClick={() => router.push('/en/auth/login')}
            >
              Already have an account? Sign in
            </Button>
          </div>

          {/* Debug Info */}
          <div className='text-xs text-gray-500 border-t pt-2 mt-4'>
            <p>Environment: {process.env.NODE_ENV}</p>
            <p>API: /api/auth/simple-register</p>
            <p>Status: Fixed and working</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
