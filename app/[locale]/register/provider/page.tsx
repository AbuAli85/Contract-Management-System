'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Settings,
  ArrowLeft,
  Users,
  Shield,
  Award,
  CheckCircle,
  Building2,
  Clock,
} from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-service';

export default function ProviderRegistrationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Professional form data state
  const [formData, setFormData] = useState({
    companyName: '',
    businessType: '',
    registrationNumber: '',
    taxNumber: '',
    phoneNumber: '',
    email: '',
    website: '',
    contactPerson: '',
    address: '',
    city: '',
    postalCode: '',
    description: '',
    acceptTerms: false,
  });

  useEffect(() => {
    // Don't redirect unauthenticated users - they need to register first!
    // If user is already authenticated, they might want to complete their profile
    setIsPageLoading(false);
  }, [user, router]);

  // Form validation function
  const isFormValid = () => {
    const requiredFields = [
      'companyName',
      'businessType',
      'registrationNumber',
      'taxNumber',
      'phoneNumber',
      'email',
      'contactPerson',
      'address',
      'city',
      'postalCode',
      'description',
    ];

    // Check if all required fields are filled
    const allFieldsFilled = requiredFields.every(
      field => formData[field].trim() !== ''
    );

    // Check if description meets minimum length requirement
    const descriptionValid = formData.description.length >= 100;

    // Check if terms are accepted
    const termsAccepted = formData.acceptTerms;

    // Basic email validation
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);

    return allFieldsFilled && descriptionValid && termsAccepted && emailValid;
  };

  const handleRegistrationSubmit = async () => {
    if (!isFormValid()) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    try {
      setIsLoading(true);

      // Prepare registration data
      const registrationData = {
        email: formData.email,
        password: 'TempPass123!', // Temporary password - user will need to reset
        fullName: formData.contactPerson,
        role: 'provider',
        phone: formData.phoneNumber,
        company: formData.companyName,
        // Additional provider-specific data
        businessType: formData.businessType,
        registrationNumber: formData.registrationNumber,
        taxNumber: formData.taxNumber,
        website: formData.website,
        address: formData.address,
        city: formData.city,
        postalCode: formData.postalCode,
        description: formData.description,
      };

      console.log('🚀 Submitting professional registration:', registrationData);

      // Submit to registration API
      const response = await fetch('/api/auth/register-new', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const result = await response.json();

      if (response.ok) {
        console.log('✅ Registration successful:', result);
        setRegistrationComplete(true);

        // If approval is required, redirect to check status page
        if (result.requiresApproval) {
          setTimeout(() => {
            window.location.href = '/en/check-registration';
          }, 3000);
        } else {
          // Direct access (legacy path)
          setTimeout(() => {
            router.push('/dashboard');
          }, 3000);
        }
      } else {
        console.error('❌ Registration failed:', result);
        alert(`Registration failed: ${result.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('❌ Registration error:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegistrationSuccess = () => {
    setRegistrationComplete(true);

    // Redirect to dashboard after 3 seconds
    setTimeout(() => {
      router.push('/dashboard');
    }, 3000);
  };

  const handleRegistrationError = (error: string) => {
    console.error('Registration error:', error);
    // Error is handled by the form component
  };

  if (isPageLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto'></div>
          <p className='mt-4 text-muted-foreground'>Loading...</p>
        </div>
      </div>
    );
  }

  // Don't block registration for unauthenticated users - they need to register first!
  // The form will handle authentication as part of the registration process

  if (registrationComplete) {
    return (
      <div className='min-h-screen flex items-center justify-center p-6'>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className='text-center max-w-md'
        >
          <Card>
            <CardHeader className='text-center'>
              <div className='mx-auto mb-4 bg-green-100 p-3 rounded-full w-fit'>
                <CheckCircle className='h-8 w-8 text-green-600' />
              </div>
              <CardTitle className='text-2xl text-blue-700'>
                Registration Submitted!
              </CardTitle>
              <CardDescription>
                Your professional service provider application has been
                submitted for review.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className='border-blue-200 bg-blue-50'>
                <Clock className='h-4 w-4 text-blue-600' />
                <AlertDescription className='text-blue-700'>
                  <strong>Your registration is pending admin approval.</strong>
                  <br />
                  • Our team will review your application within 24-48 hours
                  <br />
                  • You'll receive an email notification once approved
                  <br />• Check your registration status at any time
                </AlertDescription>
              </Alert>

              <div className='mt-6 space-y-4'>
                <h4 className='font-semibold text-sm'>What's Next?</h4>
                <ul className='text-sm text-muted-foreground space-y-2'>
                  <li className='flex items-center gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-500' />
                    Profile created and submitted for review
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-4 w-4 rounded-full border-2 border-orange-500 animate-pulse' />
                    Admin verification (1-2 business days)
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-4 w-4 rounded-full border-2 border-gray-300' />
                    Add your service portfolio
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-4 w-4 rounded-full border-2 border-gray-300' />
                    Start managing promoters and contracts
                  </li>
                </ul>
              </div>

              <Button
                onClick={() => router.push('/dashboard')}
                className='w-full mt-6'
              >
                Go to Dashboard
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 py-8'>
      <div className='container mx-auto px-4'>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className='mb-8'
        >
          <div className='flex items-center gap-4 mb-6'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => router.back()}
              className='flex items-center gap-2'
            >
              <ArrowLeft className='h-4 w-4' />
              Back
            </Button>
            <div>
              <h1 className='text-3xl font-bold flex items-center gap-2'>
                <Settings className='h-8 w-8 text-green-600' />
                Service Provider Registration
              </h1>
              <p className='text-muted-foreground'>
                Register your company to offer services and manage promoters
              </p>
            </div>
          </div>

          {/* Provider Benefits */}
          <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
            <Card className='bg-white/50 border-green-200'>
              <CardHeader className='text-center pb-4'>
                <Users className='h-8 w-8 text-green-600 mx-auto mb-2' />
                <CardTitle className='text-lg'>Promoter Management</CardTitle>
                <CardDescription className='text-sm'>
                  Manage your workforce and track performance
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='bg-white/50 border-blue-200'>
              <CardHeader className='text-center pb-4'>
                <Shield className='h-8 w-8 text-blue-600 mx-auto mb-2' />
                <CardTitle className='text-lg'>Contract Security</CardTitle>
                <CardDescription className='text-sm'>
                  Secure contracts with verified clients
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='bg-white/50 border-purple-200'>
              <CardHeader className='text-center pb-4'>
                <Award className='h-8 w-8 text-purple-600 mx-auto mb-2' />
                <CardTitle className='text-lg'>Quality Assurance</CardTitle>
                <CardDescription className='text-sm'>
                  Build reputation through quality service delivery
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='bg-white/50 border-orange-200'>
              <CardHeader className='text-center pb-4'>
                <Settings className='h-8 w-8 text-orange-600 mx-auto mb-2' />
                <CardTitle className='text-lg'>Business Tools</CardTitle>
                <CardDescription className='text-sm'>
                  Access advanced business management tools
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Services offered preview */}
          <Card className='mb-8 bg-white/70'>
            <CardHeader>
              <CardTitle className='text-lg'>
                Available Service Categories
              </CardTitle>
              <CardDescription>
                Select from these service categories when completing your
                profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='flex flex-wrap gap-2'>
                {[
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
                ].map(service => (
                  <Badge key={service} variant='secondary' className='text-xs'>
                    {service}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Professional Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className='mt-8'
        >
          <Card className='bg-white/90 backdrop-blur-sm border-2 border-blue-200 shadow-lg'>
            <CardHeader className='bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg'>
              <CardTitle className='text-2xl flex items-center gap-3'>
                <Building2 className='h-6 w-6 text-blue-600' />
                Professional Company Registration
              </CardTitle>
              <CardDescription className='text-base'>
                Complete all required fields to register your company as a
                verified service provider
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6 p-8'>
              {/* Company Information Section */}
              <div className='border-l-4 border-blue-500 pl-4'>
                <h3 className='text-lg font-semibold text-gray-800 mb-4'>
                  Company Information
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='companyName'
                      className='text-sm font-medium text-gray-700'
                    >
                      Company Name <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='companyName'
                      value={formData.companyName}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          companyName: e.target.value,
                        })
                      }
                      placeholder='Enter your official company name'
                      className='border-2 focus:border-blue-500'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='businessType'
                      className='text-sm font-medium text-gray-700'
                    >
                      Business Type <span className='text-red-500'>*</span>
                    </Label>
                    <select
                      id='businessType'
                      value={formData.businessType}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          businessType: e.target.value,
                        })
                      }
                      className='w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none'
                      required
                    >
                      <option value=''>Select business type</option>
                      <option value='consulting'>Consulting Services</option>
                      <option value='manufacturing'>Manufacturing</option>
                      <option value='construction'>Construction</option>
                      <option value='technology'>Technology Services</option>
                      <option value='healthcare'>Healthcare</option>
                      <option value='education'>Education & Training</option>
                      <option value='logistics'>
                        Logistics & Transportation
                      </option>
                      <option value='finance'>Financial Services</option>
                      <option value='retail'>Retail & Commerce</option>
                      <option value='other'>Other</option>
                    </select>
                  </div>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='registrationNumber'
                      className='text-sm font-medium text-gray-700'
                    >
                      Commercial Registration Number{' '}
                      <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='registrationNumber'
                      value={formData.registrationNumber}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          registrationNumber: e.target.value,
                        })
                      }
                      placeholder='e.g., 1010123456'
                      className='border-2 focus:border-blue-500'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='taxNumber'
                      className='text-sm font-medium text-gray-700'
                    >
                      Tax Registration Number{' '}
                      <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='taxNumber'
                      value={formData.taxNumber}
                      onChange={e =>
                        setFormData({ ...formData, taxNumber: e.target.value })
                      }
                      placeholder='Enter tax registration number'
                      className='border-2 focus:border-blue-500'
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className='border-l-4 border-green-500 pl-4'>
                <h3 className='text-lg font-semibold text-gray-800 mb-4'>
                  Contact Information
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='phoneNumber'
                      className='text-sm font-medium text-gray-700'
                    >
                      Business Phone Number{' '}
                      <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='phoneNumber'
                      type='tel'
                      value={formData.phoneNumber}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                      placeholder='+966 11 123 4567'
                      className='border-2 focus:border-blue-500'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='email'
                      className='text-sm font-medium text-gray-700'
                    >
                      Business Email <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='email'
                      type='email'
                      value={formData.email}
                      onChange={e =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      placeholder='info@yourcompany.com'
                      className='border-2 focus:border-blue-500'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='website'
                      className='text-sm font-medium text-gray-700'
                    >
                      Company Website
                    </Label>
                    <Input
                      id='website'
                      type='url'
                      value={formData.website}
                      onChange={e =>
                        setFormData({ ...formData, website: e.target.value })
                      }
                      placeholder='https://yourcompany.com'
                      className='border-2 focus:border-blue-500'
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='contactPerson'
                      className='text-sm font-medium text-gray-700'
                    >
                      Contact Person <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='contactPerson'
                      value={formData.contactPerson}
                      onChange={e =>
                        setFormData({
                          ...formData,
                          contactPerson: e.target.value,
                        })
                      }
                      placeholder='Full name of primary contact'
                      className='border-2 focus:border-blue-500'
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className='border-l-4 border-purple-500 pl-4'>
                <h3 className='text-lg font-semibold text-gray-800 mb-4'>
                  Business Address
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-6'>
                  <div className='space-y-2 md:col-span-2'>
                    <Label
                      htmlFor='address'
                      className='text-sm font-medium text-gray-700'
                    >
                      Full Business Address{' '}
                      <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='address'
                      value={formData.address}
                      onChange={e =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      placeholder='Street address, building number, district'
                      className='border-2 focus:border-blue-500'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='city'
                      className='text-sm font-medium text-gray-700'
                    >
                      City <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='city'
                      value={formData.city}
                      onChange={e =>
                        setFormData({ ...formData, city: e.target.value })
                      }
                      placeholder='City name'
                      className='border-2 focus:border-blue-500'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label
                      htmlFor='postalCode'
                      className='text-sm font-medium text-gray-700'
                    >
                      Postal Code <span className='text-red-500'>*</span>
                    </Label>
                    <Input
                      id='postalCode'
                      value={formData.postalCode}
                      onChange={e =>
                        setFormData({ ...formData, postalCode: e.target.value })
                      }
                      placeholder='12345'
                      className='border-2 focus:border-blue-500'
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Company Description Section */}
              <div className='border-l-4 border-orange-500 pl-4'>
                <h3 className='text-lg font-semibold text-gray-800 mb-4'>
                  Company Description
                </h3>
                <div className='space-y-2'>
                  <Label
                    htmlFor='description'
                    className='text-sm font-medium text-gray-700'
                  >
                    Detailed Company Description{' '}
                    <span className='text-red-500'>*</span>
                  </Label>
                  <textarea
                    id='description'
                    value={formData.description}
                    onChange={e =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder='Provide a comprehensive description of your company, services offered, experience, and capabilities (minimum 100 characters)'
                    className='w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:border-blue-500 focus:outline-none resize-none'
                    rows={4}
                    required
                    minLength={100}
                  />
                  <p className='text-xs text-gray-500'>
                    {formData.description.length}/100 characters minimum
                  </p>
                </div>
              </div>

              {/* Terms and Conditions */}
              <div className='bg-gray-50 p-4 rounded-lg border'>
                <div className='flex items-start space-x-3'>
                  <input
                    type='checkbox'
                    id='terms'
                    checked={formData.acceptTerms}
                    onChange={e =>
                      setFormData({
                        ...formData,
                        acceptTerms: e.target.checked,
                      })
                    }
                    className='mt-1'
                    required
                  />
                  <Label
                    htmlFor='terms'
                    className='text-sm text-gray-700 leading-relaxed'
                  >
                    I agree to the{' '}
                    <a href='#' className='text-blue-600 hover:underline'>
                      Terms and Conditions
                    </a>{' '}
                    and
                    <a href='#' className='text-blue-600 hover:underline ml-1'>
                      Privacy Policy
                    </a>
                    . I confirm that all information provided is accurate and
                    up-to-date.
                    <span className='text-red-500 ml-1'>*</span>
                  </Label>
                </div>
              </div>

              <div className='flex justify-center mt-8'>
                <Button
                  onClick={handleRegistrationSubmit}
                  className='px-12 py-3 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold shadow-lg'
                  size='lg'
                  disabled={!isFormValid() || isLoading}
                >
                  {isLoading ? (
                    <>
                      <div className='animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2'></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Building2 className='h-5 w-5 mr-2' />
                      Complete Professional Registration
                    </>
                  )}
                </Button>
              </div>

              <p className='text-sm text-gray-600 text-center mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-200'>
                <span className='font-medium'>Important:</span> All fields
                marked with <span className='text-red-500'>*</span> are
                required. Your registration will be reviewed within 24-48 hours.
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Requirements section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='mt-12'
        >
          <div className='grid md:grid-cols-2 gap-6'>
            <Card className='bg-white/70'>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <Shield className='h-5 w-5 text-blue-600' />
                  Verification Requirements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-3 text-sm'>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-500 mt-0.5 flex-shrink-0' />
                    Valid Commercial Registration (CR)
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-500 mt-0.5 flex-shrink-0' />
                    Business License (if applicable)
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-500 mt-0.5 flex-shrink-0' />
                    Tax Registration Certificate
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-500 mt-0.5 flex-shrink-0' />
                    Company Bank Account Details
                  </li>
                  <li className='flex items-start gap-2'>
                    <CheckCircle className='h-4 w-4 text-green-500 mt-0.5 flex-shrink-0' />
                    Insurance Certificates (if required)
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className='bg-white/70'>
              <CardHeader>
                <CardTitle className='text-lg flex items-center gap-2'>
                  <Award className='h-5 w-5 text-purple-600' />
                  Provider Benefits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className='space-y-3 text-sm'>
                  <li className='flex items-start gap-2'>
                    <Award className='h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0' />
                    Access to verified client network
                  </li>
                  <li className='flex items-start gap-2'>
                    <Award className='h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0' />
                    Secure payment processing
                  </li>
                  <li className='flex items-start gap-2'>
                    <Award className='h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0' />
                    Contract management tools
                  </li>
                  <li className='flex items-start gap-2'>
                    <Award className='h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0' />
                    Performance analytics
                  </li>
                  <li className='flex items-start gap-2'>
                    <Award className='h-4 w-4 text-purple-500 mt-0.5 flex-shrink-0' />
                    Business growth support
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* Registration Form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='mb-8'
        >
          <Card className='bg-white/70'>
            <CardHeader>
              <CardTitle className='text-xl'>Register Your Company</CardTitle>
              <CardDescription>
                Complete the form below to register as a service provider
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-6'>
                <div className='grid md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='companyName'>Company Name *</Label>
                    <Input
                      id='companyName'
                      placeholder='Your Company Name'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='contactPerson'>Contact Person *</Label>
                    <Input
                      id='contactPerson'
                      placeholder='Full Name'
                      required
                    />
                  </div>
                </div>

                <div className='grid md:grid-cols-2 gap-4'>
                  <div className='space-y-2'>
                    <Label htmlFor='email'>Business Email *</Label>
                    <Input
                      id='email'
                      type='email'
                      placeholder='company@example.com'
                      required
                    />
                  </div>
                  <div className='space-y-2'>
                    <Label htmlFor='phone'>Phone Number *</Label>
                    <Input
                      id='phone'
                      type='tel'
                      placeholder='+968 XXXX XXXX'
                      required
                    />
                  </div>
                </div>

                <div className='space-y-2'>
                  <Label htmlFor='services'>Services Offered</Label>
                  <textarea
                    id='services'
                    className='w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500'
                    rows={3}
                    placeholder='Describe the services your company offers...'
                  />
                </div>

                <div className='flex gap-4'>
                  <Button type='submit' className='flex-1'>
                    <Building2 className='h-4 w-4 mr-2' />
                    Register as Provider
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Help section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className='mt-8 text-center'
        >
          <Card className='max-w-2xl mx-auto bg-white/70'>
            <CardHeader>
              <CardTitle className='text-lg'>Need Help?</CardTitle>
              <CardDescription>
                Our team is here to assist you with the registration process
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <p className='text-sm text-muted-foreground'>
                  For assistance with registration or any questions about
                  becoming a service provider:
                </p>
                <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                  <Button variant='outline' size='sm'>
                    📧 providers@contractmanagement.om
                  </Button>
                  <Button variant='outline' size='sm'>
                    📞 +968 XX XX XXXX
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
