'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  User,
  Mail,
  Calendar,
  RefreshCw,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/lib/auth-service';

interface RegistrationStatus {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: 'pending' | 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export default function CheckRegistrationPage() {
  const { user } = useAuth();
  const [registrationStatus, setRegistrationStatus] = useState<RegistrationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRegistrationStatus = async () => {
    if (!user) {
      setError('Please log in to check your registration status');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      // Fetch user profile from API
      const response = await fetch('/api/users/profile');
      const data = await response.json();
      
      if (response.ok && data.success) {
        setRegistrationStatus(data.user);
      } else {
        setError(data.error || 'Failed to fetch registration status');
      }
    } catch (err) {
      setError('Error fetching registration status');
      console.error('Registration status error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrationStatus();
  }, [user]);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'pending':
        return {
          icon: <Clock className='h-6 w-6 text-yellow-500' />,
          label: 'Pending Approval',
          color: 'yellow',
          description: 'Your registration is being reviewed by our administrators',
          bgClass: 'bg-yellow-50 border-yellow-200',
          textClass: 'text-yellow-800',
        };
      case 'active':
        return {
          icon: <CheckCircle className='h-6 w-6 text-green-500' />,
          label: 'Approved & Active',
          color: 'green',
          description: 'Your registration has been approved and you have full access',
          bgClass: 'bg-green-50 border-green-200',
          textClass: 'text-green-800',
        };
      case 'inactive':
        return {
          icon: <XCircle className='h-6 w-6 text-red-500' />,
          label: 'Inactive',
          color: 'red',
          description: 'Your registration requires attention. Please contact support.',
          bgClass: 'bg-red-50 border-red-200',
          textClass: 'text-red-800',
        };
      default:
        return {
          icon: <AlertTriangle className='h-6 w-6 text-gray-500' />,
          label: 'Unknown Status',
          color: 'gray',
          description: 'Unable to determine registration status',
          bgClass: 'bg-gray-50 border-gray-200',
          textClass: 'text-gray-800',
        };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardContent className='flex items-center justify-center py-12'>
            <div className='text-center'>
              <RefreshCw className='h-8 w-8 animate-spin text-blue-500 mx-auto mb-4' />
              <p className='text-gray-600'>Checking your registration status...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardContent className='py-12'>
            <Alert className='border-red-200 bg-red-50'>
              <AlertTriangle className='h-4 w-4 text-red-500' />
              <AlertDescription className='text-red-700'>
                {error}
              </AlertDescription>
            </Alert>
            <Button 
              onClick={fetchRegistrationStatus}
              className='w-full mt-4'
              variant='outline'
            >
              <RefreshCw className='h-4 w-4 mr-2' />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!registrationStatus) {
    return (
      <div className='min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center'>
        <Card className='w-full max-w-md'>
          <CardContent className='py-12 text-center'>
            <AlertTriangle className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <p className='text-gray-600'>No registration data found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = getStatusInfo(registrationStatus.status);

  return (
    <div className='min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4'>
      <div className='max-w-2xl mx-auto pt-8'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className='shadow-lg'>
            <CardHeader className='text-center bg-gradient-to-r from-blue-50 to-purple-50'>
              <CardTitle className='text-2xl flex items-center justify-center gap-2'>
                <User className='h-6 w-6 text-blue-600' />
                Registration Status
              </CardTitle>
              <CardDescription>
                Check the current status of your registration application
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-6 p-8'>
              
              {/* Status Banner */}
              <div className={`rounded-lg border-2 p-6 ${statusInfo.bgClass}`}>
                <div className='flex items-center justify-center gap-3 mb-3'>
                  {statusInfo.icon}
                  <h3 className={`text-xl font-semibold ${statusInfo.textClass}`}>
                    {statusInfo.label}
                  </h3>
                </div>
                <p className={`text-center ${statusInfo.textClass}`}>
                  {statusInfo.description}
                </p>
              </div>

              {/* User Details */}
              <div className='bg-gray-50 rounded-lg p-4 space-y-3'>
                <h4 className='font-semibold text-gray-800 mb-3'>Your Registration Details</h4>
                
                <div className='flex items-center gap-3'>
                  <Mail className='h-4 w-4 text-gray-500' />
                  <span className='text-sm text-gray-600'>Email:</span>
                  <span className='font-medium'>{registrationStatus.email}</span>
                </div>
                
                {registrationStatus.full_name && (
                  <div className='flex items-center gap-3'>
                    <User className='h-4 w-4 text-gray-500' />
                    <span className='text-sm text-gray-600'>Name:</span>
                    <span className='font-medium'>{registrationStatus.full_name}</span>
                  </div>
                )}
                
                <div className='flex items-center gap-3'>
                  <Badge variant='outline' className='font-normal'>
                    Role: {registrationStatus.role}
                  </Badge>
                </div>
                
                <div className='flex items-center gap-3'>
                  <Calendar className='h-4 w-4 text-gray-500' />
                  <span className='text-sm text-gray-600'>Registered:</span>
                  <span className='font-medium'>{formatDate(registrationStatus.created_at)}</span>
                </div>
              </div>

              {/* Status-specific Actions */}
              {registrationStatus.status === 'pending' && (
                <Alert className='border-blue-200 bg-blue-50'>
                  <Clock className='h-4 w-4 text-blue-500' />
                  <AlertDescription className='text-blue-700'>
                    <strong>What happens next?</strong>
                    <br />
                    • Our administrators will review your registration within 24-48 hours
                    <br />
                    • You'll receive an email notification once your account is approved
                    <br />
                    • Check back here or contact support if you have questions
                  </AlertDescription>
                </Alert>
              )}

              {registrationStatus.status === 'active' && (
                <Alert className='border-green-200 bg-green-50'>
                  <CheckCircle className='h-4 w-4 text-green-500' />
                  <AlertDescription className='text-green-700'>
                    <strong>Congratulations!</strong> Your registration has been approved. 
                    You now have full access to the Contract Management System.
                  </AlertDescription>
                </Alert>
              )}

              {registrationStatus.status === 'inactive' && (
                <Alert className='border-red-200 bg-red-50'>
                  <XCircle className='h-4 w-4 text-red-500' />
                  <AlertDescription className='text-red-700'>
                    <strong>Account Inactive:</strong> Your registration requires attention. 
                    Please contact our support team for assistance.
                  </AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className='flex gap-3 pt-4'>
                <Button 
                  onClick={fetchRegistrationStatus}
                  variant='outline'
                  className='flex-1'
                >
                  <RefreshCw className='h-4 w-4 mr-2' />
                  Refresh Status
                </Button>
                
                {registrationStatus.status === 'active' && (
                  <Button 
                    onClick={() => window.location.href = '/dashboard'}
                    className='flex-1'
                  >
                    Go to Dashboard
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
