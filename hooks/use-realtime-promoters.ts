import { useState, useCallback, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRealtimeTable } from './use-realtime-table';
import type { Promoter } from '@/lib/types';

/**
 * Hook to fetch and subscribe to real-time promoter updates.
 * Includes auth check, selective column fetching, and proper error handling.
 */
export function useRealtimePromoters() {
  const [promoters, setPromoters] = useState<Promoter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPromoters = useCallback(async () => {
    setError(null);
    try {
      const supabaseClient = createClient();

      // Verify user is authenticated before fetching
      const {
        data: { user },
        error: authError,
      } = await supabaseClient.auth.getUser();
      if (authError || !user) {
        setError('Authentication required');
        setIsLoading(false);
        return;
      }

      // Select only the columns needed for list views (avoid fetching large blobs)
      const { data, error: fetchError } = await supabaseClient
        .from('promoters')
        .select(
          'id, name_en, name_ar, email, phone, status, profile_picture_url, employer_id, nationality, created_at, updated_at'
        )
        .order('created_at', { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
        return;
      }

      // Normalize name fields for components that expect name_en
      const normalized = (data || []).map((p: any) => ({
        ...p,
        name_en:
          p.name_en ||
          [p.first_name, p.last_name].filter(Boolean).join(' ') ||
          'Unknown',
      }));

      setPromoters(normalized as Promoter[]);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch promoters'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Subscribe to real-time changes (re-fetches on any table change)
  useRealtimeTable('promoters', fetchPromoters);

  // Initial fetch
  useEffect(() => {
    fetchPromoters();
  }, [fetchPromoters]);

  return { promoters, isLoading, error, refetch: fetchPromoters };
}
