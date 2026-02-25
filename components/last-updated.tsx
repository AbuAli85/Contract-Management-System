'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, RefreshCw } from 'lucide-react';

interface BuildTimestamp {
  timestamp: string;
  buildId: string;
  version: string;
}

export function LastUpdated() {
  const [buildInfo, setBuildInfo] = useState<BuildTimestamp | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuildInfo = async () => {
      try {
        const response = await fetch('/build-timestamp.json', {
          cache: 'no-store', // Force fresh fetch
        });
        if (response.ok) {
          const data = await response.json();
          setBuildInfo(data);
        }
      } catch (error) {
      } finally {
        setLoading(false);
      }
    };

    fetchBuildInfo();
  }, []);

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZoneName: 'short',
    });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  if (loading) {
    return (
      <Card className='w-full max-w-sm'>
        <CardContent className='p-4'>
          <div className='flex items-center gap-2'>
            <RefreshCw className='h-4 w-4 animate-spin' />
            <span className='text-sm text-gray-500'>Loading build info...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!buildInfo) {
    return (
      <Card className='w-full max-w-sm'>
        <CardContent className='p-4'>
          <div className='flex items-center justify-between'>
            <div className='flex items-center gap-2'>
              <Clock className='h-4 w-4 text-gray-500' />
              <span className='text-sm text-gray-500'>
                Build info not available
              </span>
            </div>
            <button
              onClick={handleRefresh}
              className='text-xs text-blue-600 underline hover:text-blue-800'
            >
              Refresh
            </button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className='w-full max-w-sm'>
      <CardContent className='p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            <Clock className='h-4 w-4 text-gray-500' />
            <div>
              <div className='text-sm font-medium'>Last Updated</div>
              <div className='text-xs text-gray-500'>
                {formatDate(buildInfo.timestamp)}
              </div>
            </div>
          </div>
          <div className='flex flex-col items-end gap-1'>
            <Badge variant='outline' className='text-xs'>
              {buildInfo.buildId}
            </Badge>
            <button
              onClick={handleRefresh}
              className='flex items-center gap-1 text-xs text-blue-600 underline hover:text-blue-800'
            >
              <RefreshCw className='h-3 w-3' />
              Refresh
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
