'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CheckCircle, XCircle, Clock, Filter } from 'lucide-react';

interface WebhookLog {
  id: string;
  type: string;
  payload: any;
  error?: string;
  attempts: number;
  created_at: string;
}

export default function IntegrationsPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [showErrorsOnly, setShowErrorsOnly] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = createClient();

  useEffect(() => {
    fetchLogs();
  }, [filterType, showErrorsOnly]);

  async function fetchLogs() {
    try {
      setLoading(true);

      // TODO: Implement webhook logs when table is available
      // For now, using mock data
      const mockLogs: WebhookLog[] = [
        {
          id: '1',
          type: 'serviceCreation',
          payload: { service: 'test' },
          attempts: 1,
          created_at: new Date().toISOString(),
        },
      ];

      setLogs(mockLogs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.type.toLowerCase().includes(searchLower) ||
        JSON.stringify(log.payload).toLowerCase().includes(searchLower) ||
        (log.error && log.error.toLowerCase().includes(searchLower))
      );
    }
    return true;
  });

  const getStatusIcon = (log: WebhookLog) => {
    if (log.error) {
      return <XCircle className='h-4 w-4 text-red-500' />;
    }
    return <CheckCircle className='h-4 w-4 text-green-500' />;
  };

  const getStatusBadge = (log: WebhookLog) => {
    if (log.error) {
      return <Badge variant='destructive'>Failed</Badge>;
    }
    return <Badge variant='default'>Success</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getWebhookTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      serviceCreation: 'bg-blue-100 text-blue-800',
      bookingCreated: 'bg-green-100 text-green-800',
      trackingUpdated: 'bg-yellow-100 text-yellow-800',
      paymentSucceeded: 'bg-purple-100 text-purple-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className='container mx-auto p-6'>
        <div className='flex items-center justify-center h-64'>
          <div className='flex items-center space-x-2'>
            <Clock className='h-6 w-6 animate-spin' />
            <span>Loading webhook logs...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto p-6 space-y-6'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold'>Webhook Integrations</h1>
          <p className='text-muted-foreground'>
            Monitor and manage Make.com webhook dispatches
          </p>
        </div>
        <Button onClick={fetchLogs} variant='outline'>
          Refresh
        </Button>
      </div>

      {error && (
        <Alert variant='destructive'>
          <AlertCircle className='h-4 w-4' />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className='flex items-center space-x-2'>
            <Filter className='h-5 w-5' />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-4'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='type-filter'>Webhook Type</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue placeholder='All types' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All types</SelectItem>
                  <SelectItem value='serviceCreation'>
                    Service Creation
                  </SelectItem>
                  <SelectItem value='bookingCreated'>
                    Booking Created
                  </SelectItem>
                  <SelectItem value='trackingUpdated'>
                    Tracking Updated
                  </SelectItem>
                  <SelectItem value='paymentSucceeded'>
                    Payment Succeeded
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='status-filter'>Status</Label>
              <Select
                value={showErrorsOnly ? 'errors' : 'all'}
                onValueChange={value => setShowErrorsOnly(value === 'errors')}
              >
                <SelectTrigger>
                  <SelectValue placeholder='All statuses' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>All statuses</SelectItem>
                  <SelectItem value='errors'>Errors only</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='search'>Search</Label>
              <Input
                id='search'
                placeholder='Search logs...'
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recent Webhook Logs</CardTitle>
          <CardDescription>
            Showing {filteredLogs.length} of {logs.length} logs
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredLogs.length === 0 ? (
            <div className='text-center py-8 text-muted-foreground'>
              No webhook logs found
            </div>
          ) : (
            <div className='space-y-4'>
              {filteredLogs.map(log => (
                <div key={log.id} className='border rounded-lg p-4 space-y-3'>
                  <div className='flex items-center justify-between'>
                    <div className='flex items-center space-x-3'>
                      {getStatusIcon(log)}
                      <Badge className={getWebhookTypeColor(log.type)}>
                        {log.type}
                      </Badge>
                      {getStatusBadge(log)}
                      <span className='text-sm text-muted-foreground'>
                        {log.attempts} attempt{log.attempts > 1 ? 's' : ''}
                      </span>
                    </div>
                    <span className='text-sm text-muted-foreground'>
                      {formatDate(log.created_at)}
                    </span>
                  </div>

                  <div className='space-y-2'>
                    <div>
                      <Label className='text-sm font-medium'>Payload</Label>
                      <pre className='text-xs bg-muted p-2 rounded mt-1 overflow-x-auto'>
                        {JSON.stringify(log.payload, null, 2)}
                      </pre>
                    </div>

                    {log.error && (
                      <div>
                        <Label className='text-sm font-medium text-red-600'>
                          Error
                        </Label>
                        <div className='text-sm text-red-600 bg-red-50 p-2 rounded mt-1'>
                          {log.error}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
