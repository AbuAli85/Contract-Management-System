import { createClient } from './supabase/client';
import type { DashboardAnalytics } from './dashboard-types';

// Explicit export for deployment - getDashboardAnalytics
export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  try {
    // Fetch analytics from the API endpoint
    const response = await fetch('/api/dashboard/analytics', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch analytics');
    }

    return data.analytics;
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);

    // Return fallback data if API fails
    return {
      total_contracts: 0,
      pending_contracts: 0,
      completed_contracts: 0,
      failed_contracts: 0,
      contracts_this_month: 0,
      contracts_last_month: 0,
      average_processing_time: 0,
      success_rate: 0,
      active_contracts: 0,
      generated_contracts: 0,
      draft_contracts: 0,
      expired_contracts: 0,
      total_parties: 0,
      total_promoters: 0,
      active_promoters: 0,
      active_parties: 0,
      revenue_this_month: 0,
      revenue_last_month: 0,
      total_revenue: 0,
      growth_percentage: 0,
      upcoming_expirations: 0,
      monthly_trends: [],
      status_distribution: [],
      recent_activity: [],
    };
  }
}

export async function getPendingReviews(): Promise<any[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('contracts')
      .select('id, contract_name, status, updated_at, created_at')
      .eq('status', 'pending')
      .order('updated_at', { ascending: false })
      .limit(10);

    if (error) throw error;
    if (!data) return [];

    return data.map((contract: any) => ({
      id: contract.id,
      title: contract.contract_name || 'Untitled Contract',
      type: 'contract',
      description: `Contract pending since ${new Date(contract.created_at || Date.now()).toLocaleDateString()}`,
      priority: 'medium',
      created_at: contract.created_at || new Date().toISOString(),
      updated_at: contract.updated_at || null,
    }));
  } catch (error) {
    console.error('Error fetching pending reviews:', error);
    return [];
  }
}

export async function getAdminActions(): Promise<any[]> {
  try {
    const response = await fetch('/api/admin/actions');

    if (!response.ok) {
      throw new Error('Failed to fetch admin actions');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch admin actions');
    }

    return data.data || [];
  } catch (error) {
    console.error('Error fetching admin actions:', error);
    return [];
  }
}

export async function getAuditLogs(): Promise<any[]> {
  try {
    const response = await fetch('/api/audit-logs');

    if (!response.ok) {
      throw new Error('Failed to fetch audit logs');
    }

    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Failed to fetch audit logs');
    }

    return data.data || [];
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }
}

export async function getNotifications(): Promise<any[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    if (!data) return [];

    return data.map((notification: any) => ({
      id: notification.id,
      message: notification.message || '',
      created_at: notification.created_at,
      isRead: notification.is_read || false,
      type:
        (notification.type as 'info' | 'warning' | 'error' | 'success') ||
        'info',
      user_id: notification.user_id || '',
      timestamp: notification.created_at,
    }));
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
}

export async function getUsers(): Promise<any[]> {
  try {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .limit(20);

    if (error) throw error;
    if (!data) return [];

    return data.map((user: any) => ({
      id: user.id,
      email: user.email || '',
      role: user.role || 'User',
      created_at: user.created_at,
      full_name: undefined, // Not available in users table
      last_sign_in_at: undefined, // Not available in users table
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    return [];
  }
}
