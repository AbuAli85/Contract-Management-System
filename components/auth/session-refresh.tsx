'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

/**
 * Session Refresh Component
 * Allows users to manually refresh their session if experiencing auth issues
 */
export function SessionRefresh() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();
  const supabase = createClient();

  const refreshSession = async () => {
    if (!supabase) {
      toast({
        title: 'Error',
        description: 'Supabase client not initialized',
        variant: 'destructive',
      });
      return;
    }

    setIsRefreshing(true);
    try {
      // Try to get current session
      const { data: { session }, error: getError } = await supabase.auth.getSession();
      
      if (getError) {
        throw getError;
      }

      if (!session) {
        toast({
          title: 'No Session',
          description: 'Please log in to create a session',
          variant: 'destructive',
        });
        setIsRefreshing(false);
        return;
      }

      // Refresh the session
      const { error: refreshError } = await supabase.auth.refreshSession();
      
      if (refreshError) {
        throw refreshError;
      }

      // Verify session is now in cookies
      const { data: { session: verifySession } } = await supabase.auth.getSession();
      
      if (verifySession && verifySession.user) {
        toast({
          title: 'Success',
          description: 'Session refreshed successfully',
        });
        
        // Reload the page to ensure all components pick up the new session
        setTimeout(() => {
          window.location.reload();
        }, 500);
      } else {
        throw new Error('Session refresh failed - session not found after refresh');
      }
    } catch (error: any) {
      console.error('Session refresh error:', error);
      toast({
        title: 'Refresh Failed',
        description: error.message || 'Failed to refresh session. Please try logging in again.',
        variant: 'destructive',
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Button
      onClick={refreshSession}
      disabled={isRefreshing}
      variant="outline"
      size="sm"
      className="text-xs"
    >
      {isRefreshing ? 'Refreshing...' : '🔄 Refresh Session'}
    </Button>
  );
}
