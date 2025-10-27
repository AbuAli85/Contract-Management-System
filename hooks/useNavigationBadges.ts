/**
 * Hook to fetch and manage navigation badge counts
 * Returns meaningful, contextual badge data for navigation items
 */

import { useQuery } from '@tanstack/react-query';
import { NavigationBadge } from '@/components/navigation/NavigationItem';

interface BadgeCounts {
  promoters: NavigationBadge | null;
  contracts: NavigationBadge | null;
  parties: NavigationBadge | null;
  notifications: NavigationBadge | null;
}

interface MetricsResponse {
  promoters: {
    critical: number;
    expiring: number;
  };
  contracts: {
    pendingApprovals: number;
    expiringSoon: number;
  };
  parties: {
    pendingVerification: number;
  };
  notifications: {
    unread: number;
  };
}

/**
 * Fetch badge counts from metrics API
 */
async function fetchBadgeCounts(): Promise<BadgeCounts> {
  try {
    const response = await fetch('/api/navigation/badge-counts');
    if (!response.ok) {
      throw new Error('Failed to fetch badge counts');
    }

    const data: MetricsResponse = await response.json();

    return {
      promoters:
        data.promoters.critical > 0
          ? {
              value: data.promoters.critical,
              type: 'error',
              tooltip: `${data.promoters.critical} promoters with expired documents`,
              ariaLabel: `${data.promoters.critical} critical promoter issues`,
            }
          : data.promoters.expiring > 0
            ? {
                value: data.promoters.expiring,
                type: 'warning',
                tooltip: `${data.promoters.expiring} promoters with expiring documents`,
                ariaLabel: `${data.promoters.expiring} promoters need attention`,
              }
            : null,

      contracts:
        data.contracts.pendingApprovals > 0
          ? {
              value: data.contracts.pendingApprovals,
              type: 'warning',
              tooltip: `${data.contracts.pendingApprovals} contracts pending approval`,
              ariaLabel: `${data.contracts.pendingApprovals} contracts awaiting approval`,
            }
          : data.contracts.expiringSoon > 0
            ? {
                value: data.contracts.expiringSoon,
                type: 'info',
                tooltip: `${data.contracts.expiringSoon} contracts expiring within 30 days`,
                ariaLabel: `${data.contracts.expiringSoon} contracts expiring soon`,
              }
            : null,

      parties:
        data.parties.pendingVerification > 0
          ? {
              value: data.parties.pendingVerification,
              type: 'warning',
              tooltip: `${data.parties.pendingVerification} parties pending verification`,
              ariaLabel: `${data.parties.pendingVerification} parties need verification`,
            }
          : null,

      notifications:
        data.notifications.unread > 0
          ? {
              value: data.notifications.unread,
              type: 'info',
              tooltip: `${data.notifications.unread} unread notifications`,
              ariaLabel: `${data.notifications.unread} unread notifications`,
            }
          : null,
    };
  } catch (error) {
    console.error('Error fetching badge counts:', error);
    // Return null badges on error
    return {
      promoters: null,
      contracts: null,
      parties: null,
      notifications: null,
    };
  }
}

/**
 * Hook to use navigation badges
 * Automatically refetches every 60 seconds to keep badges up to date
 */
export function useNavigationBadges() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['navigation-badges'],
    queryFn: fetchBadgeCounts,
    refetchInterval: 60000, // Refetch every 60 seconds
    staleTime: 30000, // Consider fresh for 30 seconds
    retry: 2,
  });

  return {
    badges: data || {
      promoters: null,
      contracts: null,
      parties: null,
      notifications: null,
    },
    isLoading,
    error,
    refetch,
  };
}

