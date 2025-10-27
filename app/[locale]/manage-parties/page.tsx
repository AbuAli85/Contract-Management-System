'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PartyForm from '@/components/party-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Building2, Users, Briefcase, FileText } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

/**
 * Manage Parties Page - Form Only
 * This page is dedicated to creating and editing parties
 * Viewing parties is done through separate pages (Employers, Clients, Generic)
 */
export default function ManagePartiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  
  // Check if we're editing an existing party
  const partyId = searchParams?.get('id');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFormSuccess = () => {
    toast({
      title: 'Success',
      description: partyId ? 'Party updated successfully' : 'Party created successfully',
    });
    
    // Redirect to the appropriate view based on party type
    // This will be handled by the form component
    router.push('/en/manage-parties/employers');
  };

    return (
    <div className='container mx-auto px-4 py-8 max-w-5xl'>
      {/* Header Section */}
      <div className='mb-8'>
        <div className='flex items-center gap-4 mb-4'>
          <Link href='/en/dashboard'>
            <Button variant='outline' size='icon'>
              <ArrowLeft className='h-4 w-4' />
            </Button>
          </Link>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>
              {partyId ? 'Edit Party' : 'Add New Party'}
            </h1>
            <p className='text-muted-foreground mt-1'>
              {partyId 
                ? 'Update party information and details' 
                : 'Create a new party (Employer, Client, or Generic)'
              }
            </p>
          </div>
        </div>

        {/* Quick Links */}
        <Card className='bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-blue-200 dark:border-blue-800'>
        <CardHeader>
            <CardTitle className='text-lg flex items-center gap-2'>
              <FileText className='h-5 w-5 text-blue-600' />
              Quick Navigation
          </CardTitle>
            <CardDescription>
              View existing parties organized by type
            </CardDescription>
          </CardHeader>
        <CardContent>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              <Link href='/en/manage-parties/employers'>
                <Button 
                  variant='outline' 
                  className='w-full h-auto py-4 flex flex-col items-start gap-2 hover:bg-blue-100 dark:hover:bg-blue-900'
                >
                  <div className='flex items-center gap-2 w-full'>
                    <Building2 className='h-5 w-5 text-blue-600' />
                    <span className='font-semibold'>Employers</span>
                </div>
                  <span className='text-xs text-muted-foreground'>
                    View all employer parties
                  </span>
                </Button>
              </Link>

              <Link href='/en/manage-parties/clients'>
                <Button 
                  variant='outline' 
                  className='w-full h-auto py-4 flex flex-col items-start gap-2 hover:bg-green-100 dark:hover:bg-green-900'
                >
                  <div className='flex items-center gap-2 w-full'>
                    <Users className='h-5 w-5 text-green-600' />
                    <span className='font-semibold'>Clients</span>
            </div>
                  <span className='text-xs text-muted-foreground'>
                    View all client parties
                  </span>
                </Button>
              </Link>

              <Link href='/en/manage-parties/generic'>
                <Button 
                  variant='outline' 
                  className='w-full h-auto py-4 flex flex-col items-start gap-2 hover:bg-purple-100 dark:hover:bg-purple-900'
                >
                  <div className='flex items-center gap-2 w-full'>
                    <Briefcase className='h-5 w-5 text-purple-600' />
                    <span className='font-semibold'>Generic</span>
            </div>
                  <span className='text-xs text-muted-foreground'>
                    View all generic parties
                  </span>
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
                                </div>
                                
      {/* Party Form */}
      <Card className='shadow-lg'>
        <CardHeader className='border-b'>
          <CardTitle className='text-xl'>Party Information</CardTitle>
          <CardDescription>
            Fill in the required information to {partyId ? 'update' : 'create'} a party
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-6'>
          <PartyForm
            partyToEdit={partyId ? { id: partyId } as any : null}
            onFormSubmit={handleFormSuccess}
          />
        </CardContent>
      </Card>
    </div>
  );
}
