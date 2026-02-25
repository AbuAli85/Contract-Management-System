'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Eye,
  EyeOff,
  Loader2,
  Mail,
  Lock,
  User,
  Building,
  Phone,
} from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

interface RegisterFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  role: string;
  phone?: string;
  companyName?: string;
}

export function RealTimeRegisterForm() {
  const [formData, setFormData] = useState<RegisterFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    role: 'provider',
    phone: '',
    companyName: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    feedback: '',
  });

  const router = useRouter();
  const { toast } = useToast();
  const supabase = createClient();

  // Real-time password strength validation
  useEffect(() => {
    if (formData.password) {
      const score = calculatePasswordStrength(formData.password);
      setPasswordStrength(score);
    } else {
      setPasswordStrength({ score: 0, feedback: '' });
    }
  }, [formData.password]);

  const calculatePasswordStrength = (password: string) => {
    let score = 0;
    let feedback = '';

    if (password.length >= 8) score += 1;
    if (password.match(/[a-z]/)) score += 1;
    if (password.match(/[A-Z]/)) score += 1;
    if (password.match(/[0-9]/)) score += 1;
    if (password.match(/[^a-zA-Z0-9]/)) score += 1;

    switch (score) {
      case 0:
      case 1:
        feedback = 'Very weak password';
        break;
      case 2:
        feedback = 'Weak password';
        break;
      case 3:
        feedback = 'Fair password';
        break;
      case 4:
        feedback = 'Good password';
        break;
      case 5:
        feedback = 'Strong password';
        break;
    }

    return { score, feedback };
  };

  const validateForm = (): string | null => {
    if (!formData.email || !formData.password || !formData.fullName) {
      return 'Please fill in all required fields';
    }

    if (!formData.email.includes('@')) {
      return 'Please enter a valid email address';
    }

    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }

    if (formData.password !== formData.confirmPassword) {
      return 'Passwords do not match';
    }

    if (passwordStrength.score < 3) {
      return 'Please choose a stronger password';
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Step 1: Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.fullName,
            role: formData.role,
            phone: formData.phone,
            company_name: formData.companyName,
          },
        },
      });

      if (authError) {
        throw new Error(authError.message);
      }

      if (!authData.user) {
        throw new Error('Registration failed - no user returned');
      }

      // Step 2: Create public user profile
      const { error: profileError } = await supabase.from('users').insert({
        id: authData.user.id,
        email: formData.email,
        full_name: formData.fullName,
        role: formData.role,
        status: 'active',
        phone: formData.phone || null,
      });

      if (profileError) {

        // If profile creation fails, clean up auth user
        await supabase.auth.admin.deleteUser(authData.user.id);
        throw new Error(`Profile creation failed: ${profileError.message}`);
      }

      // Step 3: Create company if provider
      if (formData.role === 'provider' && formData.companyName) {
        const { error: companyError } = await supabase
          .from('companies')
          .insert({
            name: formData.companyName,
            slug: formData.companyName.toLowerCase().replace(/\s+/g, '-'),
            description: `${formData.companyName} - Professional services provider`,
            email: formData.email,
            phone: formData.phone,
            business_type: 'small_business',
            is_active: true,
            is_verified: false,
            created_by: authData.user.id,
          });

        if (companyError) {
          // Don't fail registration if company creation fails
        } else {
        }
      }

      setSuccess(
        'Registration successful! Please check your email to confirm your account.'
      );

      toast({
        title: 'Registration Successful',
        description:
          'Please check your email to confirm your account before signing in.',
        variant: 'default',
      });

      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push(`/${locale}/auth/login`);
      }, 3000);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);

      toast({
        title: 'Registration Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof RegisterFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null); // Clear error when user starts typing
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength.score) {
      case 0:
      case 1:
        return 'bg-red-500';
      case 2:
        return 'bg-orange-500';
      case 3:
        return 'bg-yellow-500';
      case 4:
        return 'bg-blue-500';
      case 5:
        return 'bg-green-500';
      default:
        return 'bg-gray-300';
    }
  };

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8'>
      <Card className='max-w-md w-full space-y-8'>
        <CardHeader className='text-center'>
          <CardTitle className='text-2xl font-bold text-gray-900'>
            Create Account
          </CardTitle>
          <CardDescription>Join our Contract Management System</CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className='space-y-6'>
            {/* Email */}
            <div>
              <Label
                htmlFor='email'
                className='block text-sm font-medium text-gray-700'
              >
                Email Address *
              </Label>
              <div className='mt-1 relative'>
                <Input
                  id='email'
                  type='email'
                  required
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className='pl-10'
                  placeholder='Enter your email'
                />
                <Mail className='h-4 w-4 absolute left-3 top-3 text-gray-400' />
              </div>
            </div>

            {/* Full Name */}
            <div>
              <Label
                htmlFor='fullName'
                className='block text-sm font-medium text-gray-700'
              >
                Full Name *
              </Label>
              <div className='mt-1 relative'>
                <Input
                  id='fullName'
                  type='text'
                  required
                  value={formData.fullName}
                  onChange={e => handleInputChange('fullName', e.target.value)}
                  className='pl-10'
                  placeholder='Enter your full name'
                />
                <User className='h-4 w-4 absolute left-3 top-3 text-gray-400' />
              </div>
            </div>

            {/* Role */}
            <div>
              <Label
                htmlFor='role'
                className='block text-sm font-medium text-gray-700'
              >
                Account Type *
              </Label>
              <Select
                value={formData.role}
                onValueChange={value => handleInputChange('role', value)}
              >
                <SelectTrigger className='mt-1'>
                  <SelectValue placeholder='Select account type' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='provider'>Service Provider</SelectItem>
                  <SelectItem value='client'>Client</SelectItem>
                  <SelectItem value='user'>General User</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Phone */}
            <div>
              <Label
                htmlFor='phone'
                className='block text-sm font-medium text-gray-700'
              >
                Phone Number
              </Label>
              <div className='mt-1 relative'>
                <Input
                  id='phone'
                  type='tel'
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  className='pl-10'
                  placeholder='Enter your phone number'
                />
                <Phone className='h-4 w-4 absolute left-3 top-3 text-gray-400' />
              </div>
            </div>

            {/* Company Name (for providers) */}
            {formData.role === 'provider' && (
              <div>
                <Label
                  htmlFor='companyName'
                  className='block text-sm font-medium text-gray-700'
                >
                  Company Name
                </Label>
                <div className='mt-1 relative'>
                  <Input
                    id='companyName'
                    type='text'
                    value={formData.companyName}
                    onChange={e =>
                      handleInputChange('companyName', e.target.value)
                    }
                    className='pl-10'
                    placeholder='Enter your company name'
                  />
                  <Building className='h-4 w-4 absolute left-3 top-3 text-gray-400' />
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <Label
                htmlFor='password'
                className='block text-sm font-medium text-gray-700'
              >
                Password *
              </Label>
              <div className='mt-1 relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={e => handleInputChange('password', e.target.value)}
                  className='pl-10 pr-10'
                  placeholder='Enter your password'
                />
                <Lock className='h-4 w-4 absolute left-3 top-3 text-gray-400' />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-3 text-gray-400 hover:text-gray-600'
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>

              {/* Password Strength Indicator */}
              {formData.password && (
                <div className='mt-2'>
                  <div className='flex items-center space-x-2'>
                    <div className='flex-1 bg-gray-200 rounded-full h-2'>
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getPasswordStrengthColor()}`}
                        style={{
                          width: `${(passwordStrength.score / 5) * 100}%`,
                        }}
                      />
                    </div>
                    <span className='text-xs text-gray-600'>
                      {passwordStrength.feedback}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div>
              <Label
                htmlFor='confirmPassword'
                className='block text-sm font-medium text-gray-700'
              >
                Confirm Password *
              </Label>
              <div className='mt-1 relative'>
                <Input
                  id='confirmPassword'
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={formData.confirmPassword}
                  onChange={e =>
                    handleInputChange('confirmPassword', e.target.value)
                  }
                  className='pl-10 pr-10'
                  placeholder='Confirm your password'
                />
                <Lock className='h-4 w-4 absolute left-3 top-3 text-gray-400' />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-3 text-gray-400 hover:text-gray-600'
                >
                  {showConfirmPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </button>
              </div>

              {/* Password Match Indicator */}
              {formData.confirmPassword && (
                <div className='mt-1'>
                  {formData.password === formData.confirmPassword ? (
                    <span className='text-xs text-green-600'>
                      ✓ Passwords match
                    </span>
                  ) : (
                    <span className='text-xs text-red-600'>
                      ✗ Passwords do not match
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Success Message */}
            {success && (
              <Alert className='border-green-200 bg-green-50'>
                <AlertDescription className='text-green-800'>
                  {success}
                </AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type='submit'
              disabled={loading}
              className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed'
            >
              {loading ? (
                <>
                  <Loader2 className='animate-spin -ml-1 mr-3 h-4 w-4' />
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>

            {/* Login Link */}
            <div className='text-center'>
              <p className='text-sm text-gray-600'>
                Already have an account?{' '}
                <button
                  type='button'
                  onClick={() => router.push(`/${locale}/auth/login`)}
                  className='font-medium text-blue-600 hover:text-blue-500'
                >
                  Sign in
                </button>
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
