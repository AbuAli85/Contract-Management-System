'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Building2,
  Plus,
  Search,
  Users,
  FileText,
  Mail,
  Phone,
  MapPin,
  Filter,
  Globe,
  Calendar,
  ExternalLink,
  Edit,
  Eye,
} from 'lucide-react';
import { safeRender } from '@/lib/utils/safe-render';
import { cn } from '@/lib/utils';
import { useRouter, useParams } from 'next/navigation';

interface Company {
  id: string;
  name?: string;
  company_name?: string;
  company_number?: string;
  email?: string;
  phone?: string;
  address?: string | Record<string, any>;
  logo_url?: string | null;
  website?: string | null;
  industry?: string | null;
  business_type?: string | null;
  cr_number?: number | null;
  promoter_id?: string;
  created_at: string;
}

// Helper function to get initials
function getInitials(name: string): string {
  if (!name) return '?';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) {
    return words[0].substring(0, 2).toUpperCase();
  }
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

export function CompaniesView() {
  const router = useRouter();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    withContracts: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/companies');
      const data = await response.json();

      if (data.success) {
        const companiesData = data.companies || [];
        setCompanies(companiesData);

        // Calculate stats
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        // Fetch contract counts for companies
        const contractCounts: Record<string, number> = {};
        try {
          const contractResponse = await fetch('/api/contracts?limit=1000');
          const contractData = await contractResponse.json();
          if (contractData.success && contractData.contracts) {
            contractData.contracts.forEach((contract: any) => {
              // Count contracts by employer_id (which links to companies via parties)
              if (contract.employer_id) {
                contractCounts[contract.employer_id] =
                  (contractCounts[contract.employer_id] || 0) + 1;
              }
            });
          }
        } catch (err) {
        }

        setStats({
          total: companiesData.length,
          active: companiesData.filter((c: Company) => c.id).length,
          withContracts: companiesData.filter((c: Company) => {
            // Check if company has contracts (via party_id or direct link)
            return contractCounts[c.id] > 0 || false;
          }).length,
          thisMonth: companiesData.filter((c: Company) => {
            const created = new Date(c.created_at);
            return created >= startOfMonth;
          }).length,
        });

        setError(null);
      } else {
        setError(data.error || 'Failed to fetch companies');
      }
    } catch (error) {
      setError('Failed to fetch companies');
    } finally {
      setLoading(false);
    }
  };

  const filteredCompanies = companies.filter(company => {
    const name = company.company_name || company.name || '';
    const searchLower = searchTerm.toLowerCase();
    return (
      name.toLowerCase().includes(searchLower) ||
      company.company_number?.toLowerCase().includes(searchLower) ||
      company.email?.toLowerCase().includes(searchLower) ||
      company.phone?.toLowerCase().includes(searchLower) ||
      safeRender(company.address).toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Companies</h1>
            <p className='text-muted-foreground'>
              Manage your company database
            </p>
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {[...Array(6)].map((_, i) => (
            <Card key={i} className='animate-pulse'>
              <CardHeader>
                <div className='h-4 bg-gray-200 rounded w-3/4'></div>
                <div className='h-3 bg-gray-200 rounded w-1/2'></div>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  <div className='h-3 bg-gray-200 rounded'></div>
                  <div className='h-3 bg-gray-200 rounded w-2/3'></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='p-6'>
      {/* Header */}
      <div className='flex items-center justify-between mb-6'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Companies</h1>
          <p className='text-muted-foreground'>
            Manage your company database ({companies.length} companies)
          </p>
        </div>
        <Button onClick={() => router.push(`/${locale}/settings/company`)}>
          <Plus className='h-4 w-4 mr-2' />
          Add Company
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <Card className='border-l-4 border-l-blue-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600'>
              Total Companies
            </CardTitle>
            <Building2 className='h-5 w-5 text-blue-500' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-gray-900'>
              {stats.total}
            </div>
            <p className='text-xs text-gray-500 mt-1'>All companies</p>
          </CardContent>
        </Card>
        <Card className='border-l-4 border-l-green-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600'>
              Active
            </CardTitle>
            <Users className='h-5 w-5 text-green-500' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-gray-900'>
              {stats.active}
            </div>
            <p className='text-xs text-gray-500 mt-1'>Active companies</p>
          </CardContent>
        </Card>
        <Card className='border-l-4 border-l-purple-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600'>
              With Contracts
            </CardTitle>
            <FileText className='h-5 w-5 text-purple-500' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-gray-900'>
              {stats.withContracts}
            </div>
            <p className='text-xs text-gray-500 mt-1'>Has contracts</p>
          </CardContent>
        </Card>
        <Card className='border-l-4 border-l-orange-500'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium text-gray-600'>
              This Month
            </CardTitle>
            <Calendar className='h-5 w-5 text-orange-500' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-gray-900'>
              {stats.thisMonth}
            </div>
            <p className='text-xs text-gray-500 mt-1'>New this month</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-col sm:flex-row gap-4 mb-6'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
          <Input
            placeholder='Search companies...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className='pl-10'
          />
        </div>
        <Button variant='outline'>
          <Filter className='h-4 w-4 mr-2' />
          Filter
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className='mb-6'>
          <CardContent className='p-6'>
            <div className='text-center'>
              <p className='text-red-600'>{error}</p>
              <Button onClick={fetchCompanies} className='mt-2'>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Companies Grid */}
      {filteredCompanies.length === 0 && !loading && !error ? (
        <Card>
          <CardContent className='p-6'>
            <div className='text-center'>
              <Building2 className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium mb-2'>No companies found</h3>
              <p className='text-gray-600 mb-4'>
                {searchTerm
                  ? 'No companies match your search criteria.'
                  : 'Get started by adding your first company.'}
              </p>
              <Button
                onClick={() => router.push(`/${locale}/settings/company`)}
              >
                <Plus className='h-4 w-4 mr-2' />
                Add Company
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
          {filteredCompanies.map(company => {
            const companyName =
              company.company_name || company.name || 'Unnamed Company';
            const addressText = safeRender(company.address);
            const hasAddress = addressText && addressText.trim().length > 0;

            return (
              <Card
                key={company.id}
                className='group hover:shadow-lg transition-all duration-300 border-2 hover:border-blue-200'
              >
                <CardHeader className='pb-3'>
                  <div className='flex items-start gap-4'>
                    <Avatar className='h-14 w-14 shadow-md ring-2 ring-gray-100 group-hover:ring-blue-200 transition-all'>
                      {company.logo_url ? (
                        <AvatarImage src={company.logo_url} alt={companyName} />
                      ) : null}
                      <AvatarFallback className='text-lg font-bold bg-gradient-to-br from-blue-500 to-indigo-600 text-white'>
                        {getInitials(companyName)}
                      </AvatarFallback>
                    </Avatar>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-start justify-between gap-2'>
                        <div className='flex-1 min-w-0'>
                          <CardTitle className='text-lg leading-tight mb-1 truncate'>
                            {companyName}
                          </CardTitle>
                          {company.cr_number && (
                            <CardDescription className='text-xs'>
                              CR: {company.cr_number}
                            </CardDescription>
                          )}
                        </div>
                        <Badge variant='secondary' className='shrink-0'>
                          Active
                        </Badge>
                      </div>
                      {company.industry && (
                        <Badge variant='outline' className='mt-2 text-xs'>
                          {company.industry}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className='space-y-3'>
                  <div className='space-y-2'>
                    {company.email && (
                      <div className='flex items-center gap-2 text-sm text-gray-700'>
                        <Mail className='h-4 w-4 text-gray-400 shrink-0' />
                        <span className='truncate'>{company.email}</span>
                      </div>
                    )}
                    {company.phone && (
                      <div className='flex items-center gap-2 text-sm text-gray-700'>
                        <Phone className='h-4 w-4 text-gray-400 shrink-0' />
                        <span>{company.phone}</span>
                      </div>
                    )}
                    {hasAddress && (
                      <div className='flex items-start gap-2 text-sm text-gray-700'>
                        <MapPin className='h-4 w-4 text-gray-400 shrink-0 mt-0.5' />
                        <span className='line-clamp-2'>{addressText}</span>
                      </div>
                    )}
                    {company.website && (
                      <div className='flex items-center gap-2 text-sm text-gray-700'>
                        <Globe className='h-4 w-4 text-gray-400 shrink-0' />
                        <a
                          href={
                            company.website.startsWith('http')
                              ? company.website
                              : `https://${company.website}`
                          }
                          target='_blank'
                          rel='noopener noreferrer'
                          className='text-blue-600 hover:text-blue-800 hover:underline truncate flex items-center gap-1'
                        >
                          {company.website}
                          <ExternalLink className='h-3 w-3' />
                        </a>
                      </div>
                    )}
                  </div>

                  <div className='flex items-center justify-between pt-3 border-t border-gray-100'>
                    <div className='flex items-center gap-1 text-xs text-gray-500'>
                      <Calendar className='h-3 w-3' />
                      <span>
                        {new Date(company.created_at).toLocaleDateString(
                          'en-US',
                          {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          }
                        )}
                      </span>
                    </div>
                    <div className='flex gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        className='h-8 px-3'
                        onClick={() => {
                          router.push(
                            `/${locale}/settings/company?id=${company.id}`
                          );
                        }}
                      >
                        <Edit className='h-3 w-3 mr-1' />
                        Edit
                      </Button>
                      <Button
                        size='sm'
                        className='h-8 px-3'
                        onClick={() => {
                          router.push(
                            `/${locale}/dashboard/companies?view=${company.id}`
                          );
                        }}
                      >
                        <Eye className='h-3 w-3 mr-1' />
                        View
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
