import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-service';

export interface UserActivity {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  resource_name?: string;
  details: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ActivitySummary {
  total_activities: number;
  today_activities: number;
  this_week_activities: number;
  this_month_activities: number;
  recent_activities: UserActivity[];
}

export function useUserActivity() {
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [summary, setSummary] = useState<ActivitySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchUserActivities = async (userId?: string) => {
    try {
      setLoading(true);
      setError(null);

      const targetUserId = userId || user?.id;
      if (!targetUserId) {
        throw new Error('No user ID provided');
      }

      const response = await fetch(
        '/api/users/activity?userId=' + targetUserId,
        {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            Pragma: 'no-cache',
          },
        }
      );

      if (!response.ok) {
        // If 403, permissions are being auto-fixed, retry after a short delay
        if (response.status === 403) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          const retryResponse = await fetch(
            '/api/users/activity?userId=' + targetUserId,
            {
              method: 'GET',
              headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
              },
            }
          );
          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            setActivities(retryData.activities || []);
            setSummary(retryData.summary || null);
            return;
          }
        }

        const errorData = await response.json().catch(() => ({}));
        const errorMessage =
          errorData.error ||
          errorData.message ||
          'Failed to fetch user activities';
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setActivities(data.activities || []);
      setSummary(data.summary || null);
    } catch (err) {
      console.error('Error fetching user activities:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setActivities([]);
      setSummary(null);
    } finally {
      setLoading(false);
    }
  };

  const logActivity = async (activity: {
    action: string;
    resource_type: string;
    resource_id?: string;
    resource_name?: string;
    details?: any;
  }) => {
    try {
      if (!user?.id) {
        console.warn('No user ID available for activity logging');
        return;
      }

      const response = await fetch('/api/users/activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          user_name: user.user_metadata?.full_name || user.email,
          user_email: user.email,
          ...activity,
        }),
      });

      if (!response.ok) {
        console.error('Failed to log activity');
      }
    } catch (err) {
      console.error('Error logging activity:', err);
    }
  };

  useEffect(() => {
    if (user?.id) {
      fetchUserActivities();
    }
  }, [user?.id]);

  return {
    activities,
    summary,
    loading,
    error,
    fetchUserActivities,
    logActivity,
  };
}
