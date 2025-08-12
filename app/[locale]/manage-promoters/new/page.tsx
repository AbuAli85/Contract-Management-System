'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, PlusCircle } from 'lucide-react';
import PromoterFormProfessional from '@/components/promoter-form-professional';
import PromoterFilterSection from '@/components/promoter-filter-section';
import { createClient } from '@/lib/supabase/client';

interface Employer {
  id: string;
  name_en?: string;
  name_ar?: string;
}

export default function AddNewPromoterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCompany, setFilterCompany] = useState('all');
  const [filterDocument, setFilterDocument] = useState('all');
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [employersLoading, setEmployersLoading] = useState(true);

  // Fetch employers for the filter
  useEffect(() => {
    const fetchEmployers = async () => {
      try {
        const supabase = createClient();
        if (!supabase) return;

        const { data, error } = await supabase
          .from('employers')
          .select('id, name_en, name_ar')
          .order('name_en');

        if (error) {
          console.error('Error fetching employers:', error);
          return;
        }

        setEmployers(data || []);
      } catch (error) {
        console.error('Error fetching employers:', error);
      } finally {
        setEmployersLoading(false);
      }
    };

    fetchEmployers();
  }, []);

  const handleFormSubmit = () => {
    setIsSubmitting(true);
    // Redirect back to promoters list after successful submission
    setTimeout(() => {
      router.push(`/${locale}/manage-promoters`);
    }, 1000);
  };

  const handleCancel = () => {
    router.push(`/${locale}/manage-promoters`);
  };

  // Handle case where locale is undefined during build
  if (!locale) {
    return (
      <div className='min-h-screen bg-background px-4 py-8 sm:py-12'>
        <div className='mx-auto max-w-4xl'>
          <div className='text-center'>
            <p>Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const uniqueCompanies = employers.map(emp => ({
    id: emp.id,
    name: emp.name_en || emp.name_ar || emp.id,
  }));

  return (
    <div className='min-h-screen bg-background px-4 py-8 sm:py-12'>
      <div className='mx-auto max-w-4xl'>
        {/* Header */}
        <div className='mb-8'>
          <Button variant='outline' onClick={handleCancel} className='mb-4'>
            <ArrowLeft className='mr-2 h-4 w-4' />
            Back to Promoters
          </Button>

          <div className='flex items-center gap-3'>
            <PlusCircle className='h-8 w-8 text-primary' />
            <div>
              <h1 className='text-3xl font-bold'>Add New Promoter</h1>
              <p className='text-muted-foreground'>
                Enter promoter details to add them to the system
              </p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <PromoterFilterSection
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterCompany={filterCompany}
          setFilterCompany={setFilterCompany}
          filterDocument={filterDocument}
          setFilterDocument={setFilterDocument}
          employers={employers}
          employersLoading={employersLoading}
          uniqueCompanies={uniqueCompanies}
          showBulkActions={false}
        />

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <PlusCircle className='h-5 w-5' />
              Promoter Information
            </CardTitle>
            <CardDescription>
              Fill in the promoter's personal and document information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PromoterFormProfessional
              onFormSubmit={handleFormSubmit}
              onCancel={handleCancel}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';
