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
import {
  Users,
  Plus,
  Search,
  UserCheck,
  FileText,
  Mail,
  Phone,
  MapPin,
  Filter,
  Building2,
} from 'lucide-react';

interface Promoter {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  company_id?: string;
  position?: string;
  created_at: string;
}

export function PromotersView() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPromoters();
  }, []);

  const fetchPromoters = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/promoters');
      const data = await response.json();

      if (data.success) {
        setPromoters(data.promoters || []);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch promoters');
      }
    } catch (error) {
      console.error('Error fetching promoters:', error);
      setError('Failed to fetch promoters');
    } finally {
      setLoading(false);
    }
  };

  const filteredPromoters = promoters.filter(
    promoter =>
      `${promoter.first_name} ${promoter.last_name}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      promoter.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promoter.position?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className='p-6'>
        <div className='flex items-center justify-between mb-6'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight'>Promoters</h1>
            <p className='text-muted-foreground'>
              Manage your promoter database
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
          <h1 className='text-3xl font-bold tracking-tight'>Promoters</h1>
          <p className='text-muted-foreground'>
            Manage your promoter database ({promoters.length} promoters)
          </p>
        </div>
        <Button>
          <Plus className='h-4 w-4 mr-2' />
          Add Promoter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid grid-cols-1 md:grid-cols-4 gap-4 mb-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Promoters
            </CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{promoters.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active</CardTitle>
            <UserCheck className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{promoters.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              With Contracts
            </CardTitle>
            <FileText className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>This Month</CardTitle>
            <Plus className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>0</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className='flex flex-col sm:flex-row gap-4 mb-6'>
        <div className='relative flex-1'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4' />
          <Input
            placeholder='Search promoters...'
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
              <Button onClick={fetchPromoters} className='mt-2'>
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Promoters Grid */}
      {filteredPromoters.length === 0 && !loading && !error ? (
        <Card>
          <CardContent className='p-6'>
            <div className='text-center'>
              <Users className='h-12 w-12 text-gray-400 mx-auto mb-4' />
              <h3 className='text-lg font-medium mb-2'>No promoters found</h3>
              <p className='text-gray-600 mb-4'>
                {searchTerm
                  ? 'No promoters match your search criteria.'
                  : 'Get started by adding your first promoter.'}
              </p>
              <Button>
                <Plus className='h-4 w-4 mr-2' />
                Add Promoter
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredPromoters.map(promoter => (
            <Card
              key={promoter.id}
              className='hover:shadow-md transition-shadow'
            >
              <CardHeader>
                <div className='flex items-start justify-between'>
                  <div className='flex-1'>
                    <CardTitle className='text-lg'>
                      {promoter.first_name} {promoter.last_name}
                    </CardTitle>
                    {promoter.position && (
                      <CardDescription>{promoter.position}</CardDescription>
                    )}
                  </div>
                  <Badge variant='secondary'>Active</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className='space-y-2'>
                  {promoter.email && (
                    <div className='flex items-center text-sm text-gray-600'>
                      <Mail className='h-4 w-4 mr-2' />
                      {promoter.email}
                    </div>
                  )}
                  {promoter.phone && (
                    <div className='flex items-center text-sm text-gray-600'>
                      <Phone className='h-4 w-4 mr-2' />
                      {promoter.phone}
                    </div>
                  )}
                  {promoter.company_id && (
                    <div className='flex items-center text-sm text-gray-600'>
                      <Building2 className='h-4 w-4 mr-2' />
                      Company ID: {promoter.company_id}
                    </div>
                  )}
                  {promoter.address && (
                    <div className='flex items-center text-sm text-gray-600'>
                      <MapPin className='h-4 w-4 mr-2' />
                      {promoter.address}
                    </div>
                  )}
                  <div className='flex justify-between items-center pt-2'>
                    <span className='text-sm text-gray-500'>
                      {new Date(promoter.created_at).toLocaleDateString()}
                    </span>
                    <div className='flex gap-2'>
                      <Button size='sm' variant='outline'>
                        Edit
                      </Button>
                      <Button size='sm'>View</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
