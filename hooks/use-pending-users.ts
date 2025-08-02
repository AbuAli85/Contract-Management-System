import { useEffect, useState } from 'react';

export function usePendingUsersCount() {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingCount = async () => {
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
          const pendingCount = data.users?.length || 0;
          console.log('✅ Pending users count:', pendingCount);
          setCount(pendingCount);
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
    };

    fetchPendingCount();
    
    // Refresh count every 30 seconds
    const interval = setInterval(fetchPendingCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return { count, loading };
}
