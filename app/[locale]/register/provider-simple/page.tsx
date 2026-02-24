'use client';

import { useState } from 'react';
import { useRouter , useParams} from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Building,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from 'lucide-react';

interface FormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  company: string;
  phone: string;
  services: string[];
  description: string;
}

const AVAILABLE_SERVICES = [
  'Labor Supply',
  'Technical Services',
  'Consulting',
  'Training',
  'Maintenance',
  'Security',
  'Cleaning',
  'Catering',
  'Transportation',
  'IT Services',
];

export default function SimpleProviderRegistrationPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const router = useRouter();
  const [formData, setFormData] = useState<FormData>({
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    company: '',
    phone: '',
    services: [],
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    if (formData.services.length === 0) {
      setError('Please select at least one service');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/register-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          role: 'provider',
          phone: formData.phone,
          company: formData.company,
          services: formData.services,
          description: formData.description,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Registration failed');
      }

      setSuccess(true);

      // Redirect after 3 seconds
      setTimeout(() => {
        router.push(`/${locale}/auth/login?message=registration-success`);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleService = (service: string) => {
    setFormData(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service],
    }));
  };

  if (success) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 flex items-center justify-center p-4'>
        <Card className='w-full max-w-md'>
          <CardHeader className='text-center'>
            <CheckCircle className='h-12 w-12 text-green-600 mx-auto mb-4' />
            <CardTitle className='text-2xl text-green-700'>
              Registration Successful!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert className='border-green-200 bg-green-50'>
              <CheckCircle className='h-4 w-4 text-green-600' />
              <AlertDescription className='text-green-700'>
                Your provider account has been created successfully! You will be
                redirected to the login page.
              </AlertDescription>
            </Alert>
            <div className='mt-4 text-center'>
              <Button onClick={() => router.push(`/${locale}/auth/login`)}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'>
      <div className='container mx-auto px-4 max-w-2xl'>
        {/* Header */}
        <div className='mb-8'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.back()}
            className='mb-4'
          >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back
          </Button>
          <div className='text-center'>
            <Building className='h-12 w-12 text-blue-600 mx-auto mb-4' />
            <h1 className='text-3xl font-bold text-gray-900 mb-2'>
              Provider Registration
            </h1>
            <p className='text-gray-600'>
              Join as a service provider and start offering your services
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Your Provider Account</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              {/* Personal Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Personal Information</h3>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='fullName'>Full Name *</Label>
                    <Input
                      id='fullName'
                      required
                      value={formData.fullName}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          fullName: e.target.value,
                        }))
                      }
                      placeholder='John Doe'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='email'>Email *</Label>
                    <Input
                      id='email'
                      type='email'
                      required
                      value={formData.email}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      placeholder='john@example.com'
                    />
                  </div>
                </div>

                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='password'>Password *</Label>
                    <Input
                      id='password'
                      type='password'
                      required
                      value={formData.password}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          password: e.target.value,
                        }))
                      }
                      placeholder='Minimum 8 characters'
                    />
                  </div>

                  <div className='space-y-2'>
                    <Label htmlFor='confirmPassword'>Confirm Password *</Label>
                    <Input
                      id='confirmPassword'
                      type='password'
                      required
                      value={formData.confirmPassword}
                      onChange={e =>
                        setFormData(prev => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder='Confirm your password'
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='phone'>Phone Number</Label>
                  <Input
                    id='phone'
                    type='tel'
                    value={formData.phone}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder='+968 XXXX XXXX'
                  />
                </div>
              </div>

              {/* Company Information */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Company Information</h3>

                <div className='space-y-2'>
                  <Label htmlFor='company'>Company Name *</Label>
                  <Input
                    id='company'
                    required
                    value={formData.company}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        company: e.target.value,
                      }))
                    }
                    placeholder='Your Company Name'
                  />
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='description'>Company Description</Label>
                  <Textarea
                    id='description'
                    value={formData.description}
                    onChange={e =>
                      setFormData(prev => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder='Describe your company and what services you provide...'
                    rows={3}
                  />
                </div>
              </div>

              {/* Services Selection */}
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Services Offered *</h3>
                <p className='text-sm text-gray-600'>
                  Select the services your company can provide:
                </p>

                <div className='grid grid-cols-2 md:grid-cols-3 gap-2'>
                  {AVAILABLE_SERVICES.map(service => (
                    <button
                      key={service}
                      type='button'
                      onClick={() => toggleService(service)}
                      className={`p-2 text-sm rounded-lg border transition-colors ${
                        formData.services.includes(service)
                          ? 'bg-blue-100 border-blue-300 text-blue-800'
                          : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>

                {formData.services.length > 0 && (
                  <div className='space-y-2'>
                    <Label>Selected Services:</Label>
                    <div className='flex flex-wrap gap-1'>
                      {formData.services.map(service => (
                        <Badge key={service} variant='secondary'>
                          {service}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Error Display */}
              {error && (
                <Alert variant='destructive'>
                  <AlertCircle className='h-4 w-4' />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Submit Button */}
              <Button
                type='submit'
                className='w-full'
                disabled={loading}
                size='lg'
              >
                {loading ? (
                  <>
                    <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                    Creating Account...
                  </>
                ) : (
                  'Create Provider Account'
                )}
              </Button>
            </form>

            <div className='mt-6 text-center text-sm text-gray-600'>
              Already have an account?{' '}
              <button
                onClick={() => router.push(`/${locale}/auth/login`)}
                className='text-blue-600 hover:underline'
              >
                Sign in here
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
