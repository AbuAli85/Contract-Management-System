/**
 * Dashboard Fix Utilities
 * These utilities help fix common dashboard data handling issues
 */

export interface DashboardData {
  totalContracts: number;
  activeContracts: number;
  pendingContracts: number;
  completedContracts: number;
  totalPromoters: number;
  activePromoters: number;
  totalParties: number;
  pendingApprovals: number;
  recentActivity: number;
  expiringDocuments: number;
  expiringIds: number;
  expiringPassports: number;
  contractsByStatus: Record<string, number>;
  monthlyData: any[];
  systemHealth: number;
  contractGrowth: number;
  promoterGrowth: number;
  completionRate: number;
  avgProcessingTime: string;
}

/**
 * Validate and fix dashboard data
 */
export function validateDashboardData(data: any): DashboardData {
  // Ensure all required fields exist with fallback values
  const validatedData: DashboardData = {
    totalContracts: Number(data?.totalContracts) || 0,
    activeContracts: Number(data?.activeContracts) || 0,
    pendingContracts: Number(data?.pendingContracts) || 0,
    completedContracts: Number(data?.completedContracts) || 0,
    totalPromoters: Number(data?.totalPromoters) || 0,
    activePromoters: Number(data?.activePromoters) || 0,
    totalParties: Number(data?.totalParties) || 0,
    pendingApprovals: Number(data?.pendingApprovals) || 0,
    recentActivity: Number(data?.recentActivity) || 0,
    expiringDocuments: Number(data?.expiringDocuments) || 0,
    expiringIds: Number(data?.expiringIds) || 0,
    expiringPassports: Number(data?.expiringPassports) || 0,
    contractsByStatus: data?.contractsByStatus || {},
    monthlyData: Array.isArray(data?.monthlyData) ? data.monthlyData : [],
    systemHealth: Number(data?.systemHealth) || 98,
    contractGrowth: Number(data?.contractGrowth) || 0,
    promoterGrowth: Number(data?.promoterGrowth) || 0,
    completionRate: Number(data?.completionRate) || 0,
    avgProcessingTime: String(data?.avgProcessingTime) || '0',
  };

  return validatedData;
}

/**
 * Test dashboard API endpoints
 */
export async function testDashboardEndpoints(): Promise<{
  stats: any;
  notifications: any;
  activities: any;
  errors: string[];
}> {
  const errors: string[] = [];
  let stats = null;
  let notifications = null;
  let activities = null;

  try {
    // Test stats endpoint
    const statsResponse = await fetch('/api/dashboard/stats', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (statsResponse.ok) {
      stats = await statsResponse.json();
      console.log('✅ Stats API working:', stats);
    } else {
      errors.push(
        `Stats API failed: ${statsResponse.status} ${statsResponse.statusText}`
      );
    }
  } catch (error) {
    errors.push(`Stats API error: ${error}`);
  }

  try {
    // Test notifications endpoint
    const notificationsResponse = await fetch('/api/dashboard/notifications', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (notificationsResponse.ok) {
      notifications = await notificationsResponse.json();
      console.log('✅ Notifications API working:', notifications);
    } else {
      errors.push(
        `Notifications API failed: ${notificationsResponse.status} ${notificationsResponse.statusText}`
      );
    }
  } catch (error) {
    errors.push(`Notifications API error: ${error}`);
  }

  try {
    // Test activities endpoint
    const activitiesResponse = await fetch('/api/dashboard/activities', {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        Pragma: 'no-cache',
      },
    });

    if (activitiesResponse.ok) {
      activities = await activitiesResponse.json();
      console.log('✅ Activities API working:', activities);
    } else {
      errors.push(
        `Activities API failed: ${activitiesResponse.status} ${activitiesResponse.statusText}`
      );
    }
  } catch (error) {
    errors.push(`Activities API error: ${error}`);
  }

  return { stats, notifications, activities, errors };
}

/**
 * Calculate summary metrics for dashboard display
 */
export function calculateSummaryMetrics(data: DashboardData) {
  return {
    totalEntities:
      data.totalContracts + data.totalPromoters + data.totalParties,
    pendingActions: data.pendingApprovals,
    recentActivities: data.recentActivity,
    systemHealth: data.systemHealth,
  };
}

/**
 * Debug dashboard data issues
 */
export function debugDashboardData(data: any) {
  console.log('🔍 Dashboard Data Debug:');
  console.log('- Raw data:', data);
  console.log('- Data type:', typeof data);
  console.log('- Is object:', typeof data === 'object');
  console.log('- Has totalPromoters:', 'totalPromoters' in data);
  console.log('- totalPromoters value:', data?.totalPromoters);
  console.log('- totalPromoters type:', typeof data?.totalPromoters);
}
