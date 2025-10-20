'use client';

import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
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
  Eye,
  EyeOff,
  CheckCircle,
  AlertCircle,
  User,
  Building,
  Shield,
  RefreshCw,
} from 'lucide-react';
import CaptchaHandler from './captcha-handler';

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

export default function UnifiedSignupForm() {
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
  const [step, setStep] = useState(1);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaError, setCaptchaError] = useState('');
  const captchaRef = useRef<any>(null);
  const router = useRouter();

  const supabase = createClient();

  // Check if Supabase client is available
  if (!supabase) {
    return (
      <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader>
            <CardTitle className='text-center text-red-600'>
              Configuration Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertCircle className='h-4 w-4' />
              <AlertDescription>
                Supabase client is not properly configured. Please check your
                environment variables.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

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

  const validateStep1 = (): string | null => {
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
    return null;
  };

  const validateStep2 = (): string | null => {
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

  const handleNext = () => {
    const validationError = validateStep1();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setError('');
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateStep2();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');
    setCaptchaError('');

    try {
      console.log('🔐 Unified Signup - Starting signup process...');
      console.log('🔐 Unified Signup - Email:', formData.email);
      console.log('🔐 Unified Signup - Role:', formData.role);

      // Step 1: Create auth user with CAPTCHA if needed
      let signupOptions: any = {
        email: formData.email.trim(),
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName.trim(),
            role: formData.role,
            phone: formData.phone?.trim() || null,
            company: formData.company?.trim() || null,
          },
        },
      };

      // Add CAPTCHA token if available
      if (captchaToken) {
        signupOptions.options.captchaToken = captchaToken;
      }

      const { data: authData, error: authError } =
        await supabase.auth.signUp(signupOptions);

      if (authError) {
        console.error('🔐 Unified Signup - Auth error:', authError);

        // Check if it's a CAPTCHA error
        if (
          authError.message.includes('captcha') ||
          authError.message.includes('verification')
        ) {
          setShowCaptcha(true);
          setError('Please complete the CAPTCHA verification');
          return;
        }

        setError(`Signup failed: ${authError.message}`);
        return;
      }

      if (!authData.user) {
        setError('Signup failed: No user data returned');
        return;
      }

      console.log('🔐 Unified Signup - Auth user created:', authData.user.id);

      // Step 2: Create user profile
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: formData.email.trim(),
        full_name: formData.fullName.trim(),
        role: formData.role,
        status: 'active', // Auto-approve for demo purposes
        phone: formData.phone?.trim() || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (profileError) {
        console.error('🔐 Unified Signup - Profile error:', profileError);
        // Don't fail the signup if profile creation fails
        console.warn(
          'Profile creation failed, but auth user was created successfully'
        );
      } else {
        console.log('🔐 Unified Signup - Profile created successfully');
      }

      // Step 3: Create company if provider
      if (formData.role === 'provider' && formData.company) {
        const { error: companyError } = await supabase
          .from('companies')
          .insert({
            name: formData.company.trim(),
            owner_id: authData.user.id,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (companyError) {
          console.warn('Company creation failed:', companyError);
        } else {
          console.log('Company created successfully');
        }
      }

      setSuccess('Account created successfully! Redirecting to login...');

      // Redirect to login after a delay
      setTimeout(() => {
        router.push(
          '/en/auth/login?message=Account created successfully. You can now sign in.'
        );
      }, 2000);
    } catch (error) {
      console.error('🔐 Unified Signup - Exception:', error);
      setError(
        `Unexpected error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaReady = (token: string) => {
    setCaptchaToken(token);
    setCaptchaError('');
    setError('');
  };

  const handleCaptchaError = (error: string) => {
    setCaptchaError(error);
    setCaptchaToken(null);
  };

  const resetCaptcha = () => {
    if (captchaRef.current) {
      captchaRef.current.reset();
    }
    setCaptchaToken(null);
    setCaptchaError('');
  };

  const renderStep1 = () => (
    <div className='space-y-4'>
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
    </div>
  );

  const renderStep2 = () => (
    <div className='space-y-4'>
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
            {showPassword ? (
              <EyeOff className='h-4 w-4' />
            ) : (
              <Eye className='h-4 w-4' />
            )}
          </Button>
        </div>
        <p className='text-xs text-gray-500'>
          Must be at least 8 characters with uppercase, lowercase, and number
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
            {showConfirmPassword ? (
              <EyeOff className='h-4 w-4' />
            ) : (
              <Eye className='h-4 w-4' />
            )}
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl font-bold text-gray-900'>
            Create Account
          </CardTitle>
          <p className='text-sm text-gray-600'>
            {step === 1 ? 'Tell us about yourself' : 'Set up your password'}
          </p>
          <div className='flex justify-center mt-2'>
            <div className='flex space-x-2'>
              <div
                className={`w-2 h-2 rounded-full ${step >= 1 ? 'bg-blue-600' : 'bg-gray-300'}`}
              />
              <div
                className={`w-2 h-2 rounded-full ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'}`}
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <form
            onSubmit={
              step === 1
                ? e => {
                    e.preventDefault();
                    handleNext();
                  }
                : handleSignup
            }
            className='space-y-4'
          >
            {step === 1 ? renderStep1() : renderStep2()}

            {/* CAPTCHA Section */}
            {showCaptcha && (
              <div className='space-y-2'>
                <Label>Security Verification</Label>
                <div className='flex items-center gap-2'>
                  <CaptchaHandler
                    ref={captchaRef}
                    onCaptchaReady={handleCaptchaReady}
                    onCaptchaError={handleCaptchaError}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={resetCaptcha}
                    disabled={loading}
                  >
                    <RefreshCw className='h-4 w-4' />
                  </Button>
                </div>
                {captchaError && (
                  <p className='text-sm text-red-600'>{captchaError}</p>
                )}
              </div>
            )}

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

            <div className='flex space-x-2'>
              {step === 2 && (
                <Button
                  type='button'
                  variant='outline'
                  onClick={handleBack}
                  disabled={loading}
                  className='flex-1'
                >
                  Back
                </Button>
              )}
              <Button
                type='submit'
                className={step === 1 ? 'w-full' : 'flex-1'}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    {step === 1 ? 'Next...' : 'Creating Account...'}
                  </>
                ) : step === 1 ? (
                  'Next'
                ) : (
                  'Create Account'
                )}
              </Button>
            </div>
          </form>

          {/* Navigation */}
          <div className='mt-6 pt-4 border-t text-center'>
            <Button
              variant='ghost'
              onClick={() => router.push('/en/auth/login')}
            >
              Already have an account? Sign in
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
