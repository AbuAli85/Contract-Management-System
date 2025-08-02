import { useEffect, useState, useCallback } from 'react';

export function usePendingUsersCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<any[]>([]);

  const fetchPendingCount = useCallback(async () => {
    try {
      console.log('🔍 Fetching pending users count...');
      const response = await fetch('/api/users?status=pending', {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      });
      
      console.log('📊 Pending users response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        const pendingUsers = data.users || [];
        const pendingCount = pendingUsers.length;
        console.log('✅ Pending users count:', pendingCount);
        console.log('📋 Pending users details:', pendingUsers.map((u: any) => ({ email: u.email, status: u.status, id: u.id })));
        setCount(pendingCount);
        setUsers(pendingUsers);
      } else {
        console.log('⚠️ Failed to fetch pending users:', response.status);
        // Don't throw error, just keep count at 0
      }
    } catch (error) {
      console.error('❌ Error fetching pending users count:', error);
      // Don't throw error, just keep count at 0
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPendingCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    
    // Listen for user approval events and refresh immediately
    const handleUserApprovalChanged = () => {
      console.log('🔔 User approval changed event received, refreshing pending users...');
      fetchPendingCount();
    };
    
    window.addEventListener('userApprovalChanged', handleUserApprovalChanged);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('userApprovalChanged', handleUserApprovalChanged);
    };
  }, [fetchPendingCount]);

  return { count, loading, users, refresh: fetchPendingCount };
}
