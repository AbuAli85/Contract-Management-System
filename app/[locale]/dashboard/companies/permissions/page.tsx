'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams , useParams} from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Shield, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CompanyPermissionsManager } from '@/components/company-permissions-manager';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export default function CompanyPermissionsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || \'en\';
  const router = useRouter();
  const searchParams = useSearchParams();
  const companyId = searchParams?.get('company_id') ?? null;
  const [companies, setCompanies] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(
    companyId
  );
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (selectedCompanyId && companies.length > 0) {
      const company = companies.find(c => c.id === selectedCompanyId);
      if (company) {
        setSelectedCompanyName(company.name);
      }
    }
  }, [selectedCompanyId, companies]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/user/companies', {
        cache: 'no-store',
      });
      const data = await response.json();

      if (response.ok && data.success) {
        setCompanies(data.companies || []);

        // If company_id in URL, verify it exists and set it
        if (companyId) {
          const company = data.companies?.find(
            (c: any) => c.company_id === companyId
          );
          if (company) {
            setSelectedCompanyId(companyId);
            setSelectedCompanyName(company.company_name);
          } else {
            // If company not found, use first available
            if (data.companies && data.companies.length > 0) {
              setSelectedCompanyId(data.companies[0].company_id);
              setSelectedCompanyName(data.companies[0].company_name);
            }
          }
        } else if (data.companies && data.companies.length > 0) {
          // No company_id in URL, use first available
          setSelectedCompanyId(data.companies[0].company_id);
          setSelectedCompanyName(data.companies[0].company_name);
        }
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to load companies',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: 'Error',
        description: 'Failed to load companies',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-[60vh]'>
        <Loader2 className='h-8 w-8 animate-spin text-primary' />
      </div>
    );
  }

  if (companies.length === 0) {
    return (
      <div className='container mx-auto py-6'>
        <Card>
          <CardContent className='py-12 text-center'>
            <Shield className='h-12 w-12 mx-auto text-gray-400 mb-4' />
            <h3 className='text-xl font-semibold mb-2'>No Companies Found</h3>
            <p className='text-gray-500 mb-4'>
              You need to have access to at least one company to manage
              permissions.
            </p>
            <Button onClick={() => router.push(`/${locale}/dashboard/companies`)}>
              <ArrowLeft className='h-4 w-4 mr-2' />
              Back to Companies
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-6 space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => router.push(`/${locale}/dashboard/companies`)}
          >
            <ArrowLeft className='h-4 w-4' />
          </Button>
          <div>
            <h1 className='text-3xl font-bold flex items-center gap-3'>
              <Shield className='h-8 w-8 text-indigo-600' />
              Company Permissions
            </h1>
            <p className='text-gray-500 mt-1'>
              Manage user permissions for companies
            </p>
          </div>
        </div>
      </div>

      {/* Company Selector */}
      {companies.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Select Company</CardTitle>
            <CardDescription>
              Choose a company to manage permissions for
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <Label htmlFor='company-select'>Company</Label>
              <Select
                value={selectedCompanyId || ''}
                onValueChange={value => {
                  setSelectedCompanyId(value);
                  const company = companies.find(c => c.company_id === value);
                  if (company) {
                    setSelectedCompanyName(company.company_name);
                    // Update URL without navigation
                    router.replace(
                      `/en/dashboard/companies/permissions?company_id=${value}`,
                      { scroll: false }
                    );
                  }
                }}
              >
                <SelectTrigger id='company-select'>
                  <SelectValue placeholder='Select a company' />
                </SelectTrigger>
                <SelectContent>
                  {companies.map(company => (
                    <SelectItem
                      key={company.company_id}
                      value={company.company_id}
                    >
                      <div className='flex items-center gap-2'>
                        <Building2 className='h-4 w-4' />
                        <span>{company.company_name}</span>
                        <Badge variant='outline' className='ml-2'>
                          {company.user_role}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Permissions Manager */}
      {selectedCompanyId && selectedCompanyName && (
        <Card>
          <CardContent className='pt-6'>
            <CompanyPermissionsManager
              companyId={selectedCompanyId}
              companyName={selectedCompanyName}
            />
          </CardContent>
        </Card>
      )}

      {!selectedCompanyId && (
        <Card>
          <CardContent className='py-12 text-center'>
            <Shield className='h-12 w-12 mx-auto text-gray-400 mb-4' />
            <h3 className='text-xl font-semibold mb-2'>No Company Selected</h3>
            <p className='text-gray-500'>
              Please select a company to manage permissions.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
