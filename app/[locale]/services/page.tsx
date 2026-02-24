'use client';

import { useEffect, useState, Suspense } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Loader2,
  Plus,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { useRouter , useParams} from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { ErrorBoundary } from '@/components/error-boundary';
import { ServiceCardSkeletonList } from '@/components/services/service-card-skeleton';
import { ServiceSearchFilters } from '@/components/services/service-search-filters';
import { ApproveRejectButtons } from '@/components/services/approve-reject-buttons';

interface Service {
  id: string;
  service_name: string;
  status: 'pending' | 'approved' | 'rejected' | 'active' | 'inactive';
  provider_id: string;
  provider_name?: string;
  created_at: string;
  updated_at: string;
}

export default function ServicesListPage() {
  const params = useParams();
  const locale = (params?.locale as string) || \'en\';
  return (
    <ErrorBoundary>
      <Suspense fallback={<ServiceCardSkeletonList />}>
        <ServicesListContent />
      </Suspense>
    </ErrorBoundary>
  );
}

function ServicesListContent() {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const router = useRouter();
  const { toast } = useToast();

  const fetchServices = async () => {
    try {
      setError(null);
      const supabase = createClient();
      if (!supabase) {
        setError('Failed to initialize database connection');
        return;
      }

      // Fetch services with provider information
      const { data, error } = await supabase
        .from('services')
        .select(
          `
          id,
          service_name,
          status,
          provider_id,
          created_at,
          updated_at,
          profiles!inner(full_name)
        `
        )
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching services:', error);
        setError('Failed to load services');
        return;
      }

      if (data) {
        // Transform the data to include provider name
        const transformedServices: Service[] = data.map((service: any) => ({
          id: service.id,
          service_name: service.service_name,
          status:
            service.status === 'pending' ||
            service.status === 'approved' ||
            service.status === 'rejected' ||
            service.status === 'active' ||
            service.status === 'inactive'
              ? service.status
              : ('pending' as Service['status']),
          provider_id: service.provider_id,
          provider_name: service.profiles?.full_name || 'Unknown Provider',
          created_at: service.created_at,
          updated_at: service.updated_at,
        }));

        setServices(transformedServices);
        setFilteredServices(transformedServices);
      }
    } catch (err) {
      console.error('Error fetching services:', err);
      setError('Failed to load services');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Filter services based on search query and status filter
  useEffect(() => {
    let filtered = services;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        service =>
          service.service_name
            .toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          service.provider_name
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(service => service.status === statusFilter);
    }

    setFilteredServices(filtered);
  }, [services, searchQuery, statusFilter]);

  const handleStatusUpdate = (serviceId: string, newStatus: string) => {
    setServices(prev =>
      prev.map(service =>
        service.id === serviceId
          ? {
              ...service,
              status:
                newStatus === 'pending' ||
                newStatus === 'approved' ||
                newStatus === 'rejected' ||
                newStatus === 'active' ||
                newStatus === 'inactive'
                  ? (newStatus as Service['status'])
                  : service.status,
            }
          : service
      )
    );
  };

  useEffect(() => {
    fetchServices();

    // Set up real-time subscription
    const supabase = createClient();
    if (!supabase) {
      return;
    }
    const subscription = supabase
      .channel('services_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'services',
        },
        payload => {
          console.log('🔔 Real-time service update:', payload);

          if (payload.eventType === 'INSERT') {
            // Add new service to the list
            setServices(prev => [payload.new as Service, ...prev]);
            toast({
              title: 'New Service Added',
              description:
                'A new service has been created and is pending approval.',
              variant: 'default',
            });
          } else if (payload.eventType === 'UPDATE') {
            // Update existing service
            setServices(prev =>
              prev.map(service =>
                service.id === payload.new.id
                  ? (payload.new as Service)
                  : service
              )
            );

            const newStatus = payload.new.status;
            if (newStatus === 'approved') {
              toast({
                title: 'Service Approved',
                description: 'A service has been approved and is now active.',
                variant: 'default',
              });
            } else if (newStatus === 'rejected') {
              toast({
                title: 'Service Rejected',
                description: 'A service has been rejected.',
                variant: 'destructive',
              });
            }
          } else if (payload.eventType === 'DELETE') {
            // Remove deleted service
            setServices(prev =>
              prev.filter(service => service.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      if (supabase) {
        supabase.removeChannel(subscription);
      }
    };
  }, [toast]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchServices();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className='h-4 w-4' />;
      case 'approved':
      case 'active':
        return <CheckCircle className='h-4 w-4' />;
      case 'rejected':
        return <XCircle className='h-4 w-4' />;
      default:
        return <AlertCircle className='h-4 w-4' />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className='container mx-auto p-8 max-w-6xl'>
        <div className='flex items-center justify-center min-h-[400px]'>
          <div className='text-center'>
            <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4' />
            <p className='text-muted-foreground'>Loading services...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-8 max-w-6xl'>
      {/* Header */}
      <div className='flex justify-between items-center mb-8'>
        <div>
          <h1 className='text-3xl font-bold mb-2'>Services</h1>
          <p className='text-muted-foreground'>
            Manage and monitor all services in the system
          </p>
        </div>
        <div className='flex gap-3'>
          <Button
            variant='outline'
            onClick={handleRefresh}
            disabled={refreshing}
            className='flex items-center gap-2'
          >
            <RefreshCw
              className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
          <Button
            onClick={() => router.push(`/${locale}/services/new`)}
            className='flex items-center gap-2'
          >
            <Plus className='h-4 w-4' />
            New Service
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className='mb-6 border-red-200 bg-red-50'>
          <CardContent className='p-6'>
            <div className='flex items-center gap-3'>
              <AlertCircle className='h-5 w-5 text-red-600' />
              <div>
                <h3 className='font-semibold text-red-800'>
                  Error Loading Services
                </h3>
                <p className='text-red-700'>{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <ServiceSearchFilters
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onClearFilters={() => {
          setSearchQuery('');
          setStatusFilter('');
        }}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
      />

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <Card>
          <CardContent className='p-8 text-center'>
            <div className='text-muted-foreground'>
              <h3 className='text-lg font-semibold mb-2'>No Services Found</h3>
              <p className='mb-4'>
                Get started by creating your first service.
              </p>
              <Button onClick={() => router.push(`/${locale}/services/new`)}>
                <Plus className='h-4 w-4 mr-2' />
                Create Service
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className='grid gap-4'>
          {filteredServices.map(service => (
            <Card
              key={service.id}
              className='hover:shadow-md transition-shadow'
            >
              <CardContent className='p-6'>
                <div className='flex justify-between items-start'>
                  <div className='flex-1'>
                    <div className='flex items-center gap-3 mb-2'>
                      <h3 className='text-lg font-semibold'>
                        {service.service_name}
                      </h3>
                      <Badge
                        variant='outline'
                        className={`flex items-center gap-1 ${getStatusColor(service.status)}`}
                      >
                        {getStatusIcon(service.status)}
                        {service.status.charAt(0).toUpperCase() +
                          service.status.slice(1)}
                      </Badge>
                    </div>
                    <p className='text-muted-foreground mb-2'>
                      Provider:{' '}
                      <span className='font-medium'>
                        {service.provider_name}
                      </span>
                    </p>
                    <div className='text-sm text-muted-foreground'>
                      <p>Created: {formatDate(service.created_at)}</p>
                      <p>Updated: {formatDate(service.updated_at)}</p>
                    </div>
                  </div>
                  <div className='flex gap-2'>
                    <ApproveRejectButtons
                      serviceId={service.id}
                      currentStatus={service.status}
                      onStatusUpdate={newStatus =>
                        handleStatusUpdate(service.id, newStatus)
                      }
                    />
                    <Button variant='outline' size='sm'>
                      View Details
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stats */}
      {filteredServices.length > 0 && (
        <Card className='mt-8'>
          <CardHeader>
            <CardTitle>Service Statistics</CardTitle>
            <CardDescription>Overview of service statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
              <div className='text-center'>
                <div className='text-2xl font-bold text-blue-600'>
                  {filteredServices.filter(s => s.status === 'pending').length}
                </div>
                <div className='text-sm text-muted-foreground'>Pending</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-green-600'>
                  {
                    filteredServices.filter(
                      s => s.status === 'approved' || s.status === 'active'
                    ).length
                  }
                </div>
                <div className='text-sm text-muted-foreground'>Approved</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-red-600'>
                  {filteredServices.filter(s => s.status === 'rejected').length}
                </div>
                <div className='text-sm text-muted-foreground'>Rejected</div>
              </div>
              <div className='text-center'>
                <div className='text-2xl font-bold text-gray-600'>
                  {filteredServices.length}
                </div>
                <div className='text-sm text-muted-foreground'>Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
