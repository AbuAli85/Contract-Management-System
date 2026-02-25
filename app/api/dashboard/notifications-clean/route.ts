import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { differenceInDays } from 'date-fns';

// Force dynamic rendering to prevent static generation issues
export const dynamic = 'force-dynamic';

export interface NotificationData {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  category: 'contract' | 'promoter' | 'document' | 'system' | 'reminder';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  action?: {
    label: string;
    url: string;
  };
  entity?: string;
  metadata?: {
    contractId?: string;
    promoterId?: string;
    partyId?: string;
    daysUntilExpiry?: number;
    expiryDate?: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread_only') === 'true';
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = await createClient();

    // Get current user but don't fail if not authenticated
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
    }
    if (!user) {
    }

    const notifications: NotificationData[] = [];
    const now = new Date();

    // 1. CONTRACT NOTIFICATIONS

    // Pending contract approvals
    const { data: pendingContracts } = await supabase
      .from('contracts')
      .select(
        `
        id,
        contract_number,
        created_at,
        status,
        start_date,
        end_date,
        promoter_id,
        employer_id,
        client_id,
        parties!inner(name_en, name_ar),
        promoters!inner(name_en, name_ar)
      `
      )
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    pendingContracts?.forEach((contract: any) => {
      const daysPending = Math.floor(
        (now.getTime() - new Date(contract.created_at).getTime()) /
          (1000 * 60 * 60 * 24)
      );
      notifications.push({
        id: `pending-contract-${contract.id}`,
        type: 'warning',
        category: 'contract',
        priority: daysPending > 7 ? 'high' : daysPending > 3 ? 'medium' : 'low',
        title: 'Contract Approval Pending',
        message: `Contract ${contract.contract_number || contract.id.slice(0, 8)} has been pending approval for ${daysPending} ${daysPending === 1 ? 'day' : 'days'}`,
        timestamp: contract.created_at,
        read: false,
        action: {
          label: 'Review Contract',
          url: `/contracts/${contract.id}`,
        },
        entity:
          contract.parties?.[0]?.name_en ||
          contract.parties?.[0]?.name_ar ||
          'Unknown Party',
        metadata: {
          contractId: contract.id,
          promoterId: contract.promoter_id,
        },
      });
    });

    // Contracts ending soon
    const { data: expiringContracts } = await supabase
      .from('contracts')
      .select(
        `
        id,
        contract_number,
        end_date,
        status,
        parties!inner(name_en, name_ar),
        promoters!inner(name_en, name_ar)
      `
      )
      .eq('status', 'active')
      .not('end_date', 'is', null)
      .gte('end_date', now.toISOString())
      .lte(
        'end_date',
        new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString()
      ); // Next 60 days

    expiringContracts?.forEach((contract: any) => {
      const daysUntilEnd = differenceInDays(new Date(contract.end_date), now);
      notifications.push({
        id: `contract-expiring-${contract.id}`,
        type:
          daysUntilEnd <= 7 ? 'error' : daysUntilEnd <= 30 ? 'warning' : 'info',
        category: 'contract',
        priority:
          daysUntilEnd <= 7 ? 'high' : daysUntilEnd <= 30 ? 'medium' : 'low',
        title: 'Contract Ending Soon',
        message: `Contract ${contract.contract_number || contract.id.slice(0, 8)} expires in ${daysUntilEnd} ${daysUntilEnd === 1 ? 'day' : 'days'} (${new Date(contract.end_date).toLocaleDateString()})`,
        timestamp: contract.end_date,
        read: false,
        action: {
          label: 'Renew Contract',
          url: `/contracts/${contract.id}/renew`,
        },
        entity:
          contract.parties?.[0]?.name_en ||
          contract.parties?.[0]?.name_ar ||
          'Unknown Party',
        metadata: {
          contractId: contract.id,
          daysUntilExpiry: daysUntilEnd,
          expiryDate: contract.end_date,
        },
      });
    });

    // 2. PROMOTER DOCUMENT NOTIFICATIONS

    // Expiring ID documents
    const { data: expiringIds } = await supabase
      .from('promoters')
      .select('id, name_en, name_ar, visa_expiry_date, status')
      .not('visa_expiry_date', 'is', null)
      .gte('visa_expiry_date', now.toISOString())
      .lte(
        'visa_expiry_date',
        new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000).toISOString()
      ); // Next 120 days

    expiringIds?.forEach((promoter: any) => {
      const daysUntilExpiry = differenceInDays(
        new Date(promoter.visa_expiry_date),
        now
      );
      notifications.push({
        id: `visa-expiry-${promoter.id}`,
        type:
          daysUntilExpiry <= 7
            ? 'error'
            : daysUntilExpiry <= 30
              ? 'warning'
              : 'info',
        category: 'document',
        priority:
          daysUntilExpiry <= 7
            ? 'high'
            : daysUntilExpiry <= 30
              ? 'medium'
              : 'low',
        title: 'Visa Document Expiring',
        message: `${promoter.name_en || promoter.name_ar}'s visa expires in ${daysUntilExpiry} ${daysUntilExpiry === 1 ? 'day' : 'days'} (${new Date(promoter.visa_expiry_date).toLocaleDateString()})`,
        timestamp: promoter.visa_expiry_date,
        read: false,
        action: {
          label: 'Update Document',
          url: `/manage-promoters/${promoter.id}/documents`,
        },
        entity: promoter.name_en || promoter.name_ar || 'Unknown Promoter',
        metadata: {
          promoterId: promoter.id,
          daysUntilExpiry,
          expiryDate: promoter.visa_expiry_date,
        },
      });
    });

    // 3. SYSTEM NOTIFICATIONS

    // Add system status notifications
    const { data: recentContracts } = await supabase
      .from('contracts')
      .select('id, created_at')
      .gte(
        'created_at',
        new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString()
      ); // Last 24 hours

    if (recentContracts && recentContracts.length > 10) {
      notifications.push({
        id: `high-activity-${now.getTime()}`,
        type: 'success',
        category: 'system',
        priority: 'low',
        title: 'High System Activity',
        message: `${recentContracts.length} new contracts created in the last 24 hours`,
        timestamp: now.toISOString(),
        read: false,
        action: {
          label: 'View Analytics',
          url: '/dashboard/analytics',
        },
        entity: 'System',
        metadata: {},
      });
    }

    // Filter notifications based on query parameters
    let filteredNotifications = notifications;

    if (category) {
      filteredNotifications = filteredNotifications.filter(
        n => n.category === category
      );
    }

    if (priority) {
      filteredNotifications = filteredNotifications.filter(
        n => n.priority === priority
      );
    }

    if (unreadOnly) {
      filteredNotifications = filteredNotifications.filter(n => !n.read);
    }

    // Sort by priority and timestamp
    filteredNotifications.sort((a: NotificationData, b: NotificationData) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const priorityDiff =
        priorityOrder[b.priority as keyof typeof priorityOrder] -
        priorityOrder[a.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Limit results
    const limitedNotifications = filteredNotifications.slice(0, limit);

    // Add summary statistics
    const summary = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      high: notifications.filter(n => n.priority === 'high').length,
      medium: notifications.filter(n => n.priority === 'medium').length,
      low: notifications.filter(n => n.priority === 'low').length,
      categories: {
        contract: notifications.filter(n => n.category === 'contract').length,
        promoter: notifications.filter(n => n.category === 'promoter').length,
        document: notifications.filter(n => n.category === 'document').length,
        system: notifications.filter(n => n.category === 'system').length,
        reminder: notifications.filter(n => n.category === 'reminder').length,
      },
    };

    return NextResponse.json({
      notifications: limitedNotifications,
      summary,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Failed to fetch notifications',
        notifications: [],
        summary: {
          total: 0,
          unread: 0,
          high: 0,
          medium: 0,
          low: 0,
          categories: {},
        },
      },
      { status: 500 }
    );
  }
}

// POST endpoint for marking notifications as read/unread
export async function POST(request: NextRequest) {
  try {
    const { action, notificationIds, _markAll } = await request.json();

    // For now, we'll simulate marking as read
    // In a real implementation, you'd save this to a user_notifications table

    if (action === 'mark_read' || action === 'mark_unread') {
      // Simulate successful operation
      return NextResponse.json({
        success: true,
        message: `${notificationIds?.length || 'All'} notifications marked as ${action === 'mark_read' ? 'read' : 'unread'}`,
        updatedIds: notificationIds || [],
      });
    }

    if (action === 'delete') {
      return NextResponse.json({
        success: true,
        message: `${notificationIds?.length || 'All'} notifications deleted`,
        deletedIds: notificationIds || [],
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}
