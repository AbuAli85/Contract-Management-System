'use client';

import { useState } from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useSchemaCacheRefresh } from '@/hooks/use-schema-cache-refresh';
import { RefreshCw, CheckCircle, AlertTriangle, X } from 'lucide-react';

interface SchemaCacheRefreshBannerProps {
  onRefresh?: () => void;
  showSuccess?: boolean;
  autoHide?: boolean;
  className?: string;
}

export function SchemaCacheRefreshBanner({
  onRefresh,
  showSuccess = true,
  autoHide = true,
  className = '',
}: SchemaCacheRefreshBannerProps) {
  const {
    status,
    error,
    isRefreshing,
    needsRefresh,
    isWorking,
    refreshCache,
    checkStatus,
  } = useSchemaCacheRefresh();

  const [isVisible, setIsVisible] = useState(true);

  const handleRefresh = async () => {
    const result = await refreshCache();
    if (result.success && onRefresh) {
      onRefresh();
    }
  };

  const handleCheck = async () => {
    await checkStatus();
  };

  const handleDismiss = () => {
    setIsVisible(false);
  };

  // Auto-hide success messages
  if (autoHide && isWorking && showSuccess) {
    setTimeout(() => setIsVisible(false), 5000);
  }

  if (!isVisible) return null;

  // Show error banner
  if (needsRefresh) {
    return (
      <Alert className={`border-red-200 bg-red-50 ${className}`}>
        <AlertTriangle className='h-4 w-4 text-red-600' />
        <AlertTitle className='text-red-800'>Schema Cache Issue</AlertTitle>
        <AlertDescription className='text-red-700'>
          <div className='flex items-center justify-between'>
            <span>
              {error ||
                "Could not find the 'employer_id' column of 'promoters' in the schema cache"}
            </span>
            <div className='flex items-center gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleCheck}
                disabled={isRefreshing}
                className='text-red-700 border-red-300 hover:bg-red-100'
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                Check
              </Button>
              <Button
                variant='outline'
                size='sm'
                onClick={handleRefresh}
                disabled={isRefreshing}
                className='text-red-700 border-red-300 hover:bg-red-100'
              >
                <RefreshCw
                  className={`h-3 w-3 mr-1 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                {isRefreshing ? 'Refreshing...' : 'Fix Now'}
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleDismiss}
                className='text-red-600 hover:text-red-800'
              >
                <X className='h-3 w-3' />
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show success banner
  if (isWorking && showSuccess) {
    return (
      <Alert className={`border-green-200 bg-green-50 ${className}`}>
        <CheckCircle className='h-4 w-4 text-green-600' />
        <AlertTitle className='text-green-800'>Schema Cache Fixed</AlertTitle>
        <AlertDescription className='text-green-700'>
          <div className='flex items-center justify-between'>
            <span>
              The schema cache has been refreshed successfully. All features
              should now work correctly.
            </span>
            <Button
              variant='ghost'
              size='sm'
              onClick={handleDismiss}
              className='text-green-600 hover:text-green-800'
            >
              <X className='h-3 w-3' />
            </Button>
          </div>
        </AlertDescription>
      </Alert>
    );
  }

  // Show loading banner
  if (status === 'refreshing') {
    return (
      <Alert className={`border-blue-200 bg-blue-50 ${className}`}>
        <RefreshCw className='h-4 w-4 text-blue-600 animate-spin' />
        <AlertTitle className='text-blue-800'>
          Refreshing Schema Cache
        </AlertTitle>
        <AlertDescription className='text-blue-700'>
          Please wait while we refresh the database schema cache...
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}
