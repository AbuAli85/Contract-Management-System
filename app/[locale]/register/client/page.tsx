'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { UserPlus, ArrowLeft, Building2, CheckCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CompanyProfileForm } from '@/components/registration/company-profile-form';
import { useAuth } from '@/lib/auth-service';
import type { CompanyProfile } from '@/types/company';

export default function ClientRegistrationPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Don't redirect unauthenticated users - they need to register first!
    // If user is already authenticated, they might want to complete their profile
    setIsLoading(false);
  }, [user, router]);

  const handleRegistrationSuccess = (data: CompanyProfile) => {
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

  if (isLoading) {
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
              <CardTitle className='text-2xl text-green-700'>
                Registration Successful!
              </CardTitle>
              <CardDescription>
                Your client company profile has been created successfully.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className='border-green-200 bg-green-50'>
                <CheckCircle className='h-4 w-4 text-green-600' />
                <AlertDescription className='text-green-700'>
                  Your profile is pending verification. You'll receive an email
                  notification once approved. You will be redirected to the
                  dashboard shortly.
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
                    Access to full platform features
                  </li>
                  <li className='flex items-center gap-2'>
                    <div className='h-4 w-4 rounded-full border-2 border-gray-300' />
                    Start requesting services and managing contracts
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
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8'>
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
                <UserPlus className='h-8 w-8 text-blue-600' />
                Client Registration
              </h1>
              <p className='text-muted-foreground'>
                Register your company to request services and manage contracts
              </p>
            </div>
          </div>

          {/* Feature highlights */}
          <div className='grid md:grid-cols-3 gap-4 mb-8'>
            <Card className='bg-white/50 border-blue-200'>
              <CardHeader className='text-center pb-4'>
                <Building2 className='h-8 w-8 text-blue-600 mx-auto mb-2' />
                <CardTitle className='text-lg'>Company Profile</CardTitle>
                <CardDescription className='text-sm'>
                  Create a comprehensive company profile with all necessary
                  business details
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='bg-white/50 border-green-200'>
              <CardHeader className='text-center pb-4'>
                <UserPlus className='h-8 w-8 text-green-600 mx-auto mb-2' />
                <CardTitle className='text-lg'>Service Requests</CardTitle>
                <CardDescription className='text-sm'>
                  Request services from verified providers and manage your
                  requirements
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className='bg-white/50 border-purple-200'>
              <CardHeader className='text-center pb-4'>
                <CheckCircle className='h-8 w-8 text-purple-600 mx-auto mb-2' />
                <CardTitle className='text-lg'>Contract Management</CardTitle>
                <CardDescription className='text-sm'>
                  Manage contracts, track progress, and maintain vendor
                  relationships
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </motion.div>

        {/* Registration Form */}
        {user && (
          <CompanyProfileForm
            userId={user.id}
            role='client'
            onSuccess={handleRegistrationSuccess}
            onError={handleRegistrationError}
          />
        )}

        {/* Help section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className='mt-12 text-center'
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
                  For assistance with registration or any questions about using
                  the platform:
                </p>
                <div className='flex flex-col sm:flex-row gap-4 justify-center'>
                  <Button variant='outline' size='sm'>
                    📧 support@contractmanagement.om
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
