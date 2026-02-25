import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface PendingUsersResult {
  count: number;
  loading: boolean;
  users: any[];
  refresh: () => Promise<void>;
}

export function usePendingUsersCount(): PendingUsersResult {
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const supabase = createClient();
      const { data, error: supabaseError } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'pending');

      if (supabaseError) {
        console.error('❌ Failed to fetch pending users:', supabaseError);
        setError(supabaseError.message);
        setCount(0);
        setUsers([]);
        return;
      }

      const pendingUsers = data || [];
      setCount(pendingUsers.length);
      setUsers(pendingUsers);
    } catch (error) {
      console.error('❌ Error fetching pending users:', error);
      setError('Failed to fetch pending users');
      setCount(0);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchPendingUsers();
  };

  useEffect(() => {
    // Only fetch once on mount, not repeatedly
    fetchPendingUsers();
  }, []); // Empty dependency array to prevent infinite loops

  return {
    count,
    loading,
    users,
    refresh,
  };
}
