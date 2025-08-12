import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { devLog } from '@/lib/dev-log';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-service';
import { useFormContext } from '@/hooks/use-form-context';
import type { Promoter } from '@/lib/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

const fetchPromoters = async (): Promise<Promoter[]> => {
  const supabaseClient = createClient();
  if (!supabaseClient) {
    throw new Error('Failed to create Supabase client');
  }

  const { data, error } = await supabaseClient
    .from('promoters')
    .select('*')
    .order('name_en', { ascending: true });

  if (error) {
    devLog('Error fetching promoters:', error);
    // Log the complete error object for easier debugging
    devLog(error);
    throw new Error(error.message);
  }
  return data || [];
};

// Helper function to create realtime channel
const createRealtimeChannel = (supabaseClient: any, tableName: string) => {
  return supabaseClient.channel(`public:${tableName}`);
};

// Helper function to subscribe to channel
const subscribeToChannel = (channel: RealtimeChannel, onUpdate: () => void) => {
  return channel
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'promoters' },
      () => {
        onUpdate();
      }
    )
    .subscribe();
};

// Helper function to handle realtime errors
const handleRealtimeError = (error: any, toast: any) => {
  console.error('Realtime error:', error);
  toast({
    title: 'Connection Error',
    description: 'Lost connection to real-time updates. Trying to reconnect...',
    variant: 'destructive',
  });
};

export const usePromoters = (enableRealtime: boolean = true) => {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => ['promoters'], []);
  const { toast } = useToast();

  // Safe auth hook usage with fallback
  let user = null;
  let isFormActive = false;

  try {
    const authResult = useAuth();
    user = authResult?.user || null;

    const formContext = useFormContext();
    isFormActive = formContext?.isFormActive || false;
  } catch (error) {
    console.warn('Auth or form context not available:', error);
    // Continue without auth - hooks will work in limited mode
  }

  const channelRef = useRef<RealtimeChannel | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const queryResult = useQuery<Promoter[], Error>({
    queryKey,
    queryFn: fetchPromoters,
    staleTime: 1000 * 60 * 5,
    retry: 3, // Retry 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
    enabled: user !== null, // Only run query when we know auth status
  });

  // Handle query errors
  useEffect(() => {
    if (queryResult.error) {
      console.error('Error fetching promoters:', queryResult.error);
      toast({
        title: 'Error loading promoters',
        description:
          queryResult.error.message ||
          'Failed to load promoters. Please try again.',
        variant: 'destructive',
      });
    }
  }, [queryResult.error, toast]);

  // --- Realtime subscription ---
  useEffect(() => {
    if (!enableRealtime || user === null) {
      return;
    }

    // Don't set up realtime if user is not authenticated
    if (!user) {
      devLog(
        'User not authenticated, skipping realtime subscription for promoters'
      );
      return;
    }

    // Don't set up realtime if forms are active (prevents interruptions)
    if (isFormActive) {
      devLog('Forms are active, skipping realtime subscription for promoters');
      return;
    }

    let retryCount = 0;
    const maxRetries = 3;
    let isSubscribed = false;

    const setupSubscription = () => {
      if (isSubscribed) return;

      try {
        // Clean up any existing channel first
        if (channelRef.current) {
          const supabaseClient = createClient();
          if (supabaseClient) {
            supabaseClient.removeChannel(channelRef.current);
          }
          channelRef.current = null;
        }

        // Create channel using utility function
        const supabaseClient = createClient();
        if (!supabaseClient) {
          throw new Error('Failed to create Supabase client');
        }

        channelRef.current = createRealtimeChannel(supabaseClient, 'promoters');

        if (!channelRef.current) {
          throw new Error('Failed to create realtime channel');
        }

        // Subscribe using utility function
        subscribeToChannel(channelRef.current, () => {
          queryClient.invalidateQueries({ queryKey: queryKey });
        });

        isSubscribed = true;
        devLog('Successfully subscribed to promoters realtime channel');
      } catch (error) {
        devLog('Error setting up promoters subscription:', error);

        // Retry if we haven't exceeded max retries
        if (retryCount < maxRetries) {
          retryCount++;
          devLog(
            `Retrying promoters subscription (${retryCount}/${maxRetries})...`
          );
          retryTimeoutRef.current = setTimeout(() => {
            isSubscribed = false;
            setupSubscription();
          }, 2000 * retryCount); // Exponential backoff
        } else {
          devLog('Max retries exceeded for promoters subscription');
          handleRealtimeError(error, toast);
        }
      }
    };

    setupSubscription();

    // Cleanup function
    return () => {
      isSubscribed = false;
      if (channelRef.current) {
        const supabaseClient = createClient();
        if (supabaseClient) {
          supabaseClient.removeChannel(channelRef.current);
        }
        channelRef.current = null;
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = null;
      }
    };
  }, [enableRealtime, user, isFormActive, queryClient, queryKey, toast]);

  return queryResult;
};
