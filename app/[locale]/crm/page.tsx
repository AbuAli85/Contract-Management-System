'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/app/providers';
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider';
import { createClient } from '@/lib/supabase/client';
import AdminDashboard from '@/components/dashboard/AdminDashboard';
import PromoterDashboard from '@/components/dashboard/PromoterDashboard';

export default function CRMPage() {
  const { loading } = useAuth();
  const { userRole, hasPermission, isLoading } = useEnhancedRBAC();
  const isAdmin = userRole === 'admin' || hasPermission('dashboard.view');
  const [promoters, setPromoters] = useState<{ id: string }[]>([]);
  const [promotersLoading, setPromotersLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPromoters = async () => {
      try {
        setPromotersLoading(true);
        setError(null);

        const supabase = createClient();
        if (!supabase) {
          throw new Error('Supabase client not available');
        }
        const { data, error } = await supabase
          .from('promoters')
          .select('id')
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching promoters:', error);
          setError(error.message);
          return;
        }

        if (data) {
          setPromoters(data);
        }
      } catch (err) {
        console.error('Exception fetching promoters:', err);
        setError(err instanceof Error ? err.message : 'Unknown error occurred');
      } finally {
        setPromotersLoading(false);
      }
    };

    fetchPromoters();
  }, []);

  if (loading || isLoading)
    return <div className='p-8 text-center'>Loading authentication...</div>;
  if (promotersLoading)
    return <div className='p-8 text-center'>Loading promoters...</div>;

  if (error) {
    return (
      <div className='p-8 text-center'>
        <div className='mb-4 text-red-600'>Error: {error}</div>
        <button
          onClick={() => window.location.reload()}
          className='rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
        >
          Retry
        </button>
      </div>
    );
  }

  if (!isAdmin)
    return (
      <div className='p-8 text-center'>
        CRM features are restricted to administrators.
      </div>
    );
  if (!promoters.length)
    return <div className='p-8 text-center'>No promoters found.</div>;

  // Show different dashboards based on user role
  return (
    <div className='min-h-screen bg-gray-50'>
      {isAdmin ? <AdminDashboard /> : <PromoterDashboard />}
    </div>
  );
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic';
