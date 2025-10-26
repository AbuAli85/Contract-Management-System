'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Loader2, Users, Building2, FileText, Calendar, Phone, Mail, CreditCard, BookOpen } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import type { Party, Promoter } from '@/lib/types';

interface EmployerWithPromoters extends Party {
  promoters: Promoter[];
  promoterCount: number;
}

export default function EmployerPromotersAnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [isClient, setIsClient] = useState(false);
  const [employersData, setEmployersData] = useState<EmployerWithPromoters[]>([]);
  const [totalPromoters, setTotalPromoters] = useState(0);
  const [totalEmployers, setTotalEmployers] = useState(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;

    async function fetchEmployerPromotersData() {
      setLoading(true);

      try {
        // Fetch data from API route for better performance
        const response = await fetch('/api/analytics/employer-promoters');
        
        if (!response.ok) {
          throw new Error('Failed to fetch employer-promoter analytics');
        }

        const result = await response.json();

        if (result.success && result.data) {
          setEmployersData(result.data.employers);
          setTotalEmployers(result.data.summary.totalEmployers);
          setTotalPromoters(result.data.summary.totalPromoters);
        } else {
          console.error('Invalid response format:', result);
        }
      } catch (error) {
        console.error('Error in fetchEmployerPromotersData:', error);
        
        // Fallback to direct Supabase query if API fails
        const supabase = createClient();
        if (!supabase) {
          setLoading(false);
          return;
        }

        try {
          // Fetch all employers (parties with type='Employer')
          const { data: employers, error: employersError } = await supabase
            .from('parties')
            .select('*')
            .eq('type', 'Employer')
            .order('name_en');

          if (employersError) {
            console.error('Error fetching employers:', employersError);
            setLoading(false);
            return;
          }

          // Fetch all promoters
          const { data: allPromoters, error: promotersError } = await supabase
            .from('promoters')
            .select('*')
            .order('name_en');

          if (promotersError) {
            console.error('Error fetching promoters:', promotersError);
            setLoading(false);
            return;
          }

          // Fetch all contracts
          const { data: contracts, error: contractsError } = await supabase
            .from('contracts')
            .select('promoter_id, employer_id, first_party_id');

          if (contractsError) {
            console.error('Error fetching contracts:', contractsError);
          }

          // Build employer-promoter mapping
          const employersWithPromoters: EmployerWithPromoters[] = (employers || []).map(employer => {
            const employerContracts = contracts?.filter(
              c => c.employer_id === employer.id || c.first_party_id === employer.id
            ) || [];

            const promoterIdsFromContracts = [
              ...new Set(
                employerContracts
                  .map(c => c.promoter_id)
                  .filter((id): id is string => id !== null && id !== undefined)
              ),
            ];

            const employerPromoters = allPromoters?.filter(
              p => p.employer_id === employer.id || promoterIdsFromContracts.includes(p.id)
            ) || [];

            return {
              ...employer,
              promoters: employerPromoters,
              promoterCount: employerPromoters.length,
            };
          });

          setEmployersData(employersWithPromoters);
          setTotalEmployers(employers?.length || 0);
          setTotalPromoters(allPromoters?.length || 0);
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchEmployerPromotersData();
  }, [isClient]);

  if (!isClient || loading) {
    return (
      <div className='flex h-[calc(100vh-150px)] items-center justify-center'>
        <Loader2 className='h-12 w-12 animate-spin text-primary' />
        <p className='ml-4 text-lg'>Loading employer analytics...</p>
      </div>
    );
  }

  return (
    <div className='container mx-auto space-y-8 p-6'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold tracking-tight'>Employer-Promoter Analytics</h1>
        <p className='text-muted-foreground mt-2'>
          View promoter assignments and details for each employer
        </p>
      </div>

      {/* Summary Stats */}
      <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-6'>
            <Building2 className='h-8 w-8 text-blue-500 mb-2' />
            <span className='text-3xl font-bold'>{totalEmployers}</span>
            <span className='mt-2 text-sm text-muted-foreground'>Total Employers</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-6'>
            <Users className='h-8 w-8 text-green-500 mb-2' />
            <span className='text-3xl font-bold'>{totalPromoters}</span>
            <span className='mt-2 text-sm text-muted-foreground'>Total Promoters</span>
          </CardContent>
        </Card>
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-6'>
            <FileText className='h-8 w-8 text-purple-500 mb-2' />
            <span className='text-3xl font-bold'>
              {(totalPromoters / (totalEmployers || 1)).toFixed(1)}
            </span>
            <span className='mt-2 text-sm text-muted-foreground'>Avg Promoters/Employer</span>
          </CardContent>
        </Card>
      </div>

      {/* Employers List with Promoters */}
      <Card>
        <CardHeader>
          <CardTitle>Employers & Their Promoters</CardTitle>
          <CardDescription>
            Expand each employer to view assigned promoters with their details and documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          {employersData.length === 0 ? (
            <p className='text-center text-muted-foreground py-8'>No employers found</p>
          ) : (
            <Accordion type='single' collapsible className='w-full'>
              {employersData.map((employer, index) => (
                <AccordionItem key={employer.id} value={`employer-${index}`}>
                  <AccordionTrigger className='hover:no-underline'>
                    <div className='flex items-center justify-between w-full pr-4'>
                      <div className='flex items-center gap-4'>
                        <Avatar className='h-10 w-10'>
                          <AvatarFallback className='bg-blue-100 text-blue-600'>
                            {employer.name_en.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className='text-left'>
                          <p className='font-semibold'>{employer.name_en}</p>
                          <p className='text-sm text-muted-foreground'>{employer.name_ar}</p>
                        </div>
                      </div>
                      <div className='flex items-center gap-4'>
                        <Badge variant='secondary' className='text-sm'>
                          <Users className='h-3 w-3 mr-1' />
                          {employer.promoterCount} Promoters
                        </Badge>
                        <span className='text-xs text-muted-foreground'>CRN: {employer.crn}</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className='pt-4 space-y-4'>
                      {/* Employer Details */}
                      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg'>
                        <div className='flex items-center gap-2'>
                          <Mail className='h-4 w-4 text-muted-foreground' />
                          <span className='text-sm'>{employer.contact_email || 'N/A'}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Phone className='h-4 w-4 text-muted-foreground' />
                          <span className='text-sm'>{employer.contact_phone || 'N/A'}</span>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Building2 className='h-4 w-4 text-muted-foreground' />
                          <span className='text-sm'>Status: {employer.status || 'N/A'}</span>
                        </div>
                      </div>

                      {/* Promoters List */}
                      {employer.promoters.length === 0 ? (
                        <p className='text-center text-muted-foreground py-4'>
                          No promoters assigned to this employer
                        </p>
                      ) : (
                        <div className='space-y-4'>
                          <h4 className='font-semibold text-sm text-muted-foreground uppercase tracking-wide'>
                            Assigned Promoters ({employer.promoters.length})
                          </h4>
                          <div className='grid grid-cols-1 gap-4'>
                            {employer.promoters.map((promoter) => (
                              <Card key={promoter.id} className='border-l-4 border-l-blue-500'>
                                <CardContent className='p-4'>
                                  <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
                                    {/* Promoter Details */}
                                    <div className='lg:col-span-2 space-y-3'>
                                      <div className='flex items-start gap-3'>
                                        <Avatar className='h-12 w-12'>
                                          <AvatarImage src={promoter.profile_picture_url || undefined} />
                                          <AvatarFallback className='bg-green-100 text-green-600'>
                                            {promoter.name_en.substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className='flex-1'>
                                          <h5 className='font-semibold text-lg'>{promoter.name_en}</h5>
                                          <p className='text-sm text-muted-foreground'>{promoter.name_ar}</p>
                                          {promoter.status && (
                                            <Badge variant='outline' className='mt-1'>
                                              {promoter.status}
                                            </Badge>
                                          )}
                                        </div>
                                      </div>

                                      <div className='grid grid-cols-1 md:grid-cols-2 gap-3 text-sm'>
                                        <div className='flex items-center gap-2'>
                                          <Mail className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                                          <span className='truncate'>{promoter.email || 'N/A'}</span>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                          <Phone className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                                          <span>{promoter.phone || promoter.mobile_number || 'N/A'}</span>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                          <CreditCard className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                                          <span className='truncate'>ID: {promoter.id_card_number || 'N/A'}</span>
                                        </div>
                                        <div className='flex items-center gap-2'>
                                          <BookOpen className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                                          <span className='truncate'>Passport: {promoter.passport_number || 'N/A'}</span>
                                        </div>
                                        {promoter.job_title && (
                                          <div className='flex items-center gap-2'>
                                            <FileText className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                                            <span className='truncate'>{promoter.job_title}</span>
                                          </div>
                                        )}
                                        {promoter.nationality && (
                                          <div className='flex items-center gap-2'>
                                            <span className='text-muted-foreground'>🌍</span>
                                            <span>{promoter.nationality}</span>
                                          </div>
                                        )}
                                        {promoter.id_card_expiry_date && (
                                          <div className='flex items-center gap-2'>
                                            <Calendar className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                                            <span className='text-xs'>
                                              ID Exp: {new Date(promoter.id_card_expiry_date).toLocaleDateString()}
                                            </span>
                                          </div>
                                        )}
                                        {promoter.passport_expiry_date && (
                                          <div className='flex items-center gap-2'>
                                            <Calendar className='h-4 w-4 text-muted-foreground flex-shrink-0' />
                                            <span className='text-xs'>
                                              Passport Exp: {new Date(promoter.passport_expiry_date).toLocaleDateString()}
                                            </span>
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Document Images */}
                                    <div className='space-y-3'>
                                      <h6 className='font-semibold text-sm text-muted-foreground'>Documents</h6>
                                      <div className='space-y-3'>
                                        {/* ID Card Image */}
                                        {promoter.id_card_url ? (
                                          <div className='space-y-1'>
                                            <label className='text-xs font-medium text-muted-foreground flex items-center gap-1'>
                                              <CreditCard className='h-3 w-3' />
                                              ID Card
                                            </label>
                                            <a
                                              href={promoter.id_card_url}
                                              target='_blank'
                                              rel='noopener noreferrer'
                                              className='block relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors group'
                                            >
                                              <Image
                                                src={promoter.id_card_url}
                                                alt={`${promoter.name_en} ID Card`}
                                                fill
                                                className='object-cover group-hover:scale-105 transition-transform'
                                                sizes='(max-width: 768px) 100vw, 300px'
                                              />
                                              <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center'>
                                                <span className='text-white opacity-0 group-hover:opacity-100 text-xs bg-black/50 px-2 py-1 rounded'>
                                                  View Full Size
                                                </span>
                                              </div>
                                            </a>
                                          </div>
                                        ) : (
                                          <div className='space-y-1'>
                                            <label className='text-xs font-medium text-muted-foreground flex items-center gap-1'>
                                              <CreditCard className='h-3 w-3' />
                                              ID Card
                                            </label>
                                            <div className='w-full h-32 rounded-lg border border-dashed border-gray-300 flex items-center justify-center bg-gray-50'>
                                              <span className='text-xs text-muted-foreground'>No ID image</span>
                                            </div>
                                          </div>
                                        )}

                                        {/* Passport Image */}
                                        {promoter.passport_url ? (
                                          <div className='space-y-1'>
                                            <label className='text-xs font-medium text-muted-foreground flex items-center gap-1'>
                                              <BookOpen className='h-3 w-3' />
                                              Passport
                                            </label>
                                            <a
                                              href={promoter.passport_url}
                                              target='_blank'
                                              rel='noopener noreferrer'
                                              className='block relative w-full h-32 rounded-lg overflow-hidden border border-gray-200 hover:border-blue-400 transition-colors group'
                                            >
                                              <Image
                                                src={promoter.passport_url}
                                                alt={`${promoter.name_en} Passport`}
                                                fill
                                                className='object-cover group-hover:scale-105 transition-transform'
                                                sizes='(max-width: 768px) 100vw, 300px'
                                              />
                                              <div className='absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center'>
                                                <span className='text-white opacity-0 group-hover:opacity-100 text-xs bg-black/50 px-2 py-1 rounded'>
                                                  View Full Size
                                                </span>
                                              </div>
                                            </a>
                                          </div>
                                        ) : (
                                          <div className='space-y-1'>
                                            <label className='text-xs font-medium text-muted-foreground flex items-center gap-1'>
                                              <BookOpen className='h-3 w-3' />
                                              Passport
                                            </label>
                                            <div className='w-full h-32 rounded-lg border border-dashed border-gray-300 flex items-center justify-center bg-gray-50'>
                                              <span className='text-xs text-muted-foreground'>No passport image</span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

