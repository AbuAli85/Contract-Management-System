'use client';

import { useState, useEffect } from 'react';
import type { CurrencyCode } from '@/types/currency';
import { createClient } from '@/lib/supabase/client';

/**
 * Hook to manage user's preferred currency
 * Fetches from user profile and provides setter to update
 */
export function useCurrencyPreference() {
  const [preferredCurrency, setPreferredCurrency] =
    useState<CurrencyCode>('USD');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's preferred currency from profile
  useEffect(() => {
    async function fetchPreference() {
      try {
        const supabase = createClient();
        if (!supabase) {
          setLoading(false);
          return;
        }

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          setLoading(false);
          return;
        }

        // Fetch user profile
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('preferred_currency')
          .eq('id', user.id)
          .single();

        if (fetchError) {
          console.error('Error fetching currency preference:', fetchError);
          setError(fetchError.message);
        } else if (data?.preferred_currency) {
          setPreferredCurrency(data.preferred_currency as CurrencyCode);
        }
      } catch (err) {
        console.error('Error in fetchPreference:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchPreference();
  }, []);

  // Update user's preferred currency
  const updatePreference = async (currency: CurrencyCode): Promise<boolean> => {
    try {
      const supabase = createClient();
      if (!supabase) {
        setError('Supabase client not available');
        return false;
      }

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError('User not authenticated');
        return false;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ preferred_currency: currency })
        .eq('id', user.id);

      if (updateError) {
        console.error('Error updating currency preference:', updateError);
        setError(updateError.message);
        return false;
      }

      setPreferredCurrency(currency);
      setError(null);
      return true;
    } catch (err) {
      console.error('Error in updatePreference:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      return false;
    }
  };

  return {
    preferredCurrency,
    setPreferredCurrency: updatePreference,
    loading,
    error,
  };
}
