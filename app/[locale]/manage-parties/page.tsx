'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import PartyForm from '@/components/party-form';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ArrowLeft,
  Building2,
  Users,
  Briefcase,
  FileText,
  Loader2,
} from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import type { Party } from '@/lib/types';

/**
 * Manage Parties Page - Form Only
 * This page is dedicated to creating and editing parties
 * Viewing parties is done through separate pages (Employers, Clients, Generic)
 */
export default function ManagePartiesPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  // Check if we're editing an existing party
  const partyId = searchParams?.get('id');
  const [_isSubmitting, _setIsSubmitting] = useState(false);
  const [isLoadingParty, setIsLoadingParty] = useState(false);
  const [partyData, setPartyData] = useState<Party | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  // Fetch party data when editing
  useEffect(() => {
    const fetchPartyData = async () => {
      if (!partyId) {
        setPartyData(null);
        return;
      }

      setIsLoadingParty(true);
      setLoadError(null);

      try {
        const supabase = createClient();
        if (!supabase) {
          setLoadError('Failed to initialize database connection');
          toast({
            title: 'Error',
            description: 'Failed to initialize database connection',
            variant: 'destructive',
          });
          return;
        }

        const { data, error } = await supabase
          .from('parties')
          .select('*')
          .eq('id', partyId)
          .single();

        if (error) {
          console.error('Error fetching party:', error);
          setLoadError('Failed to load party data');
          toast({
            title: 'Error',
            description: 'Failed to load party data',
            variant: 'destructive',
          });
          return;
        }

        if (data) {
          setPartyData(data as Party);
        } else {
          setLoadError('Party not found');
          toast({
            title: 'Error',
            description: 'Party not found',
            variant: 'destructive',
          });
        }
      } catch (error) {
        console.error('Error in fetchPartyData:', error);
        setLoadError('An unexpected error occurred');
      } finally {
        setIsLoadingParty(false);
      }
    };

    fetchPartyData();
  }, [partyId, toast]);

  const handleFormSuccess = () => {
    toast({
      title: 'Success',
      description: partyId
        ? 'Party updated successfully'
        : 'Party created successfully',
    });

    // Redirect to the appropriate view based on party type
    // This will be handled by the form component
    router.push(`/${locale}/manage-parties/employers`);
  };

  // Show loading state while fetching party data
  if (partyId && isLoadingParty) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-5xl'>
        <Card className='shadow-lg'>
          <CardContent className='pt-6 flex flex-col items-center justify-center min-h-[400px]'>
            <Loader2 className='h-8 w-8 animate-spin text-blue-600 mb-4' />
            <p className='text-muted-foreground'>Loading party data...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show error state if party failed to load
  if (partyId && loadError) {
    return (
      <div className='container mx-auto px-4 py-8 max-w-5xl'>
        <Card className='shadow-lg border-red-200'>
          <CardContent className='pt-6 flex flex-col items-center justify-center min-h-[400px]'>
            <div className='text-center'>
              <p className='text-red-600 font-semibold mb-4'>{loadError}</p>
              <Button
                onClick={() =>
                  router.push(`/${locale}/manage-parties/employers`)
                }
              >
                <ArrowLeft className='mr-2 h-4 w-4' />
                Back to Parties
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto px-4 py-8 max-w-5xl'>
      {/* Header Section */}
      <div className='mb-8'>
        <div className='flex items-center gap-4 mb-4'>
          <Link href={`/${locale}/dashboard`}>
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
                : 'Create a new party (Employer, Client, or Generic)'}
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
              <Link href={`/${locale}/manage-parties/employers`}>
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

              <Link href={`/${locale}/manage-parties/clients`}>
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

              <Link href={`/${locale}/manage-parties/generic`}>
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
            Fill in the required information to {partyId ? 'update' : 'create'}{' '}
            a party
          </CardDescription>
        </CardHeader>
        <CardContent className='pt-6'>
          <PartyForm partyToEdit={partyData} onFormSubmit={handleFormSuccess} />
        </CardContent>
      </Card>
    </div>
  );
}
