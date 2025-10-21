'use client';

import React, { useState, useEffect } from 'react';
import { AlertCircle, RefreshCw, ShieldAlert } from 'lucide-react';

interface PromoterManagementProps {
  params: {
    locale: string;
  };
}

interface ErrorDetails {
  message: string;
  status: number;
  details?: string;
  reason?: string;
  required_permission?: string;
  debug?: any;
}

export default function PromoterManagement({
  params,
}: PromoterManagementProps) {
  const [promoters, setPromoters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorDetails | null>(null);

  console.log('🚀 PromoterManagement component mounted');

  useEffect(() => {
    console.log('🔄 useEffect triggered');

    const fetchPromoters = async () => {
      try {
        console.log('📡 Fetching promoters...');
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/promoters', { 
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        console.log('📡 Response status:', response.status, response.statusText);

        if (!response.ok) {
          // Try to get detailed error from response
          let errorData: any = {};
          try {
            errorData = await response.json();
            console.error('❌ API Error Response:', errorData);
          } catch (e) {
            console.error('❌ Failed to parse error response');
          }

          throw {
            message: errorData.error || errorData.message || 'Unable to load promoters from the server',
            status: response.status,
            details: errorData.details || errorData.reason,
            reason: errorData.reason,
            required_permission: errorData.required_permission,
            debug: errorData.debug,
          };
        }

        const payload = await response.json();
        console.log('📡 API Response:', {
          success: payload.success,
          count: payload.promoters?.length || 0,
        });

        if (!payload.success) {
          throw {
            message: payload.error || 'Failed to load promoters',
            status: response.status,
            details: payload.details,
            reason: payload.reason,
            debug: payload.debug,
          };
        }

        const promotersData = payload.promoters || [];
        console.log('📊 Promoters data:', promotersData.length, 'items');

        setPromoters(promotersData);
      } catch (error: any) {
        console.error('❌ Error in fetchPromoters:', error);
        if (error.status) {
          setError(error);
        } else {
          setError({
            message: error instanceof Error ? error.message : 'Failed to load promoters',
            status: 500,
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromoters();
  }, []);

  if (isLoading) {
    return (
      <div className='min-h-screen bg-background px-4 py-8'>
        <div className='mx-auto max-w-screen-xl'>
          <div className='flex items-center justify-center h-64'>
            <div className='flex items-center gap-2'>
              <div className='animate-spin rounded-full h-6 w-6 border-b-2 border-primary'></div>
              <span>Loading promoters...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const isPermissionError = error.status === 403;
    const isAuthError = error.status === 401;
    const isServerError = error.status >= 500;

    return (
      <div className='min-h-screen bg-background px-4 py-8'>
        <div className='mx-auto max-w-screen-xl'>
          <div className={`border rounded-lg p-6 ${
            isPermissionError || isAuthError 
              ? 'bg-amber-50 border-amber-200' 
              : isServerError
              ? 'bg-red-50 border-red-200'
              : 'bg-red-50 border-red-200'
          }`}>
            <div className='flex items-start gap-3'>
              {isPermissionError || isAuthError ? (
                <ShieldAlert className='h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5' />
              ) : (
                <AlertCircle className='h-6 w-6 text-red-600 flex-shrink-0 mt-0.5' />
              )}
              <div className='flex-1'>
                <h3 className={`text-lg font-semibold mb-2 ${
                  isPermissionError || isAuthError ? 'text-amber-900' : 'text-red-900'
                }`}>
                  {isPermissionError && 'Permission Denied'}
                  {isAuthError && 'Authentication Required'}
                  {!isPermissionError && !isAuthError && 'Error Loading Promoters'}
                </h3>
                <p className={`mb-3 ${
                  isPermissionError || isAuthError ? 'text-amber-800' : 'text-red-800'
                }`}>
                  {error.message}
                </p>
                
                {error.details && (
                  <div className='bg-white/60 rounded p-3 mb-3 text-sm'>
                    <p className='font-medium mb-1'>Details:</p>
                    <p className='text-gray-700'>{error.details}</p>
                  </div>
                )}

                {error.required_permission && (
                  <div className='bg-white/60 rounded p-3 mb-3 text-sm'>
                    <p className='font-medium mb-1'>Required Permission:</p>
                    <code className='bg-gray-100 px-2 py-1 rounded text-xs'>
                      {error.required_permission}
                    </code>
                  </div>
                )}

                {isPermissionError && (
                  <div className='bg-amber-100 border border-amber-300 rounded p-4 mb-4'>
                    <p className='font-medium text-amber-900 mb-2'>
                      💡 How to Fix This:
                    </p>
                    <ol className='list-decimal list-inside space-y-2 text-sm text-amber-800'>
                      <li>
                        Ask your administrator to run the permission grant script in Supabase
                      </li>
                      <li>
                        Script location: <code className='bg-white px-1.5 py-0.5 rounded text-xs'>scripts/grant-promoter-permissions.sql</code>
                      </li>
                      <li>
                        Or contact support if you need help setting up RBAC permissions
                      </li>
                    </ol>
                  </div>
                )}

                {isAuthError && (
                  <div className='bg-amber-100 border border-amber-300 rounded p-4 mb-4'>
                    <p className='font-medium text-amber-900 mb-2'>
                      💡 What to do:
                    </p>
                    <ol className='list-decimal list-inside space-y-2 text-sm text-amber-800'>
                      <li>Try logging out and logging back in</li>
                      <li>Clear your browser cookies and cache</li>
                      <li>Make sure you're logged in with the correct account</li>
                    </ol>
                  </div>
                )}

                {process.env.NODE_ENV === 'development' && error.debug && (
                  <details className='bg-gray-100 rounded p-3 text-xs mt-3'>
                    <summary className='cursor-pointer font-medium text-gray-700 mb-2'>
                      Debug Information (Development Only)
                    </summary>
                    <pre className='text-gray-600 overflow-x-auto'>
                      {JSON.stringify(error.debug, null, 2)}
                    </pre>
                  </details>
                )}

                <button
                  onClick={() => window.location.reload()}
                  className='mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors'
                >
                  <RefreshCw className='h-4 w-4' />
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-background px-4 py-8'>
      <div className='mx-auto max-w-screen-xl'>
        <h1 className='text-3xl font-bold text-card-foreground mb-8'>
          Promoter Management
        </h1>

        <div className='bg-white rounded-lg shadow p-6'>
          <h2 className='text-xl font-semibold mb-4'>
            Promoters ({promoters.length})
          </h2>

          {promoters.length === 0 ? (
            <div className='text-center py-8'>
              <p className='text-muted-foreground'>No promoters found</p>
            </div>
          ) : (
            <div className='space-y-4'>
              {promoters.slice(0, 10).map((promoter, index) => (
                <div
                  key={promoter.id || index}
                  className='border rounded-lg p-4'
                >
                  <div className='flex justify-between items-start'>
                    <div>
                      <h3 className='font-medium'>
                        {promoter.name_en || 'Unknown'}
                      </h3>
                      <p className='text-sm text-muted-foreground'>
                        {promoter.name_ar || 'غير معروف'}
                      </p>
                      <p className='text-sm'>
                        ID: {promoter.id_card_number || 'N/A'}
                      </p>
                      <p className='text-sm'>
                        Status: {promoter.status || 'N/A'}
                      </p>
                      {promoter.parties && (
                        <p className='text-sm'>
                          Employer: {promoter.parties.name_en || 'N/A'}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {promoters.length > 10 && (
                <p className='text-sm text-muted-foreground text-center'>
                  ... and {promoters.length - 10} more promoters
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
