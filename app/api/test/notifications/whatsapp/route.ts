/**
 * Real-Time WhatsApp Notification Test
 *
 * Tests WhatsApp notifications through the actual UnifiedNotificationService
 * This simulates real system notifications (document expiry, alerts, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { UnifiedNotificationService } from '@/lib/services/unified-notification.service';

/**
 * POST /api/test/notifications/whatsapp - Send real notification via system
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      phone,
      message,
      title,
      priority = 'high', // Required for WhatsApp
      category = 'general',
      actionUrl,
    } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Get user profile for recipient info
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, phone_number, full_name')
      .eq('id', user.id)
      .single();

    // Use UnifiedNotificationService (the real system service)
    const notificationService = new UnifiedNotificationService();

    const result = await notificationService.sendNotification({
      recipients: [
        {
          userId: user.id,
          email: profile?.email || user.email || undefined,
          phone, // Will be auto-formatted
          name:
            profile?.full_name || user.user_metadata?.full_name || 'Test User',
        },
      ],
      content: {
        title: title || 'Test WhatsApp Notification',
        message:
          message ||
          'This is a test notification sent via the real system notification service.',
        priority: priority as 'low' | 'medium' | 'high' | 'urgent',
        category,
        actionUrl,
      },
      channels: ['whatsapp', 'in_app'], // Include WhatsApp
    });

    return NextResponse.json({
      success: result.success,
      details: {
        phone,
        method: 'unified_notification_service',
        priority,
        channels: result.sent,
        failed: result.failed,
        errors: result.errors,
      },
      message: result.success
        ? 'WhatsApp notification sent successfully via system!'
        : 'Failed to send notification. Check errors for details.',
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/test/notifications/whatsapp - Get test scenarios
 */
export async function GET() {
  return NextResponse.json({
    scenarios: [
      {
        name: 'Document Expiry Alert',
        description: 'Simulate a document expiry notification',
        body: {
          phone: '+96879665522',
          title: 'Document Expiry Alert',
          message:
            'Your passport will expire in 30 days. Please renew it soon.',
          priority: 'high',
          category: 'document_expiry',
          actionUrl: '/documents',
        },
      },
      {
        name: 'Urgent System Alert',
        description: 'Simulate an urgent system notification',
        body: {
          phone: '+96879665522',
          title: 'Urgent: Action Required',
          message:
            'Your account requires immediate attention. Please contact support.',
          priority: 'urgent',
          category: 'system_alert',
        },
      },
      {
        name: 'Task Assignment',
        description: 'Simulate a task assignment notification',
        body: {
          phone: '+96879665522',
          title: 'New Task Assigned',
          message:
            'You have been assigned a new task. Please review and complete it.',
          priority: 'high',
          category: 'task_assignment',
          actionUrl: '/tasks',
        },
      },
    ],
  });
}
