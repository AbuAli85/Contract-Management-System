'use client';

import React, { useState, useEffect } from 'react';

interface PromoterManagementProps {
  params: {
    locale: string;
  };
}

export default function PromoterManagement({
  params,
}: PromoterManagementProps) {
  const [promoters, setPromoters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  console.log('🚀 PromoterManagement component mounted');

  useEffect(() => {
    console.log('🔄 useEffect triggered');

    const fetchPromoters = async () => {
      try {
        console.log('📡 Fetching promoters...');
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/promoters', { cache: 'no-store' });
        console.log('📡 Response status:', response.status);

        if (!response.ok) {
          throw new Error('Unable to load promoters from the server.');
        }

        const payload = await response.json();
        console.log('📡 API Response:', {
          success: payload.success,
          count: payload.promoters?.length || 0,
        });

        if (!payload.success) {
          throw new Error(payload.error || 'Failed to load promoters.');
        }

        const promotersData = payload.promoters || [];
        console.log('📊 Promoters data:', promotersData.length, 'items');

        setPromoters(promotersData);
      } catch (error) {
        console.error('❌ Error in fetchPromoters:', error);
        setError(
          error instanceof Error ? error.message : 'Failed to load promoters'
        );
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
    return (
      <div className='min-h-screen bg-background px-4 py-8'>
        <div className='mx-auto max-w-screen-xl'>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-center gap-2 text-red-800'>
              <span className='font-medium'>Error: {error}</span>
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
