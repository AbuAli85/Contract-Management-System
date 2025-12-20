/**
 * Test WhatsApp Notification Endpoint
 * 
 * This endpoint allows you to test WhatsApp notifications
 * Usage: POST /api/test/whatsapp
 * Body: { phone: "+96879665522", message: "Test message" }
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sendWhatsApp, isWhatsAppConfigured, formatPhoneNumber } from '@/lib/services/whatsapp.service';
import { UnifiedNotificationService } from '@/lib/services/unified-notification.service';

/**
 * POST /api/test/whatsapp - Send a test WhatsApp message
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in first.' },
        { status: 401 }
      );
    }

    // Check if WhatsApp is configured
    if (!isWhatsAppConfigured()) {
      return NextResponse.json(
        {
          error: 'WhatsApp not configured',
          details: 'Please set TWILIO_WHATSAPP_FROM in your .env file',
          required: [
            'TWILIO_ACCOUNT_SID',
            'TWILIO_AUTH_TOKEN',
            'TWILIO_WHATSAPP_FROM',
          ],
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { phone, message, useTemplate, templateVariables } = body;

    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Format phone number
    const formattedPhone = formatPhoneNumber(phone);

    // Option 1: Direct WhatsApp service test
    if (message && !useTemplate) {
      const result = await sendWhatsApp({
        to: formattedPhone,
        message: message || 'This is a test WhatsApp message from the Contract Management System.',
      });

      return NextResponse.json({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        details: {
          phone: formattedPhone,
          method: 'direct',
          message: message || 'Default test message',
        },
      });
    }

    // Option 2: Using template (if configured)
    const templateSid = process.env.TWILIO_WHATSAPP_TEMPLATE_SID;
    if (useTemplate && templateSid) {
      const result = await sendWhatsApp({
        to: formattedPhone,
        templateSid: templateSid,
        templateVariables: templateVariables || {
          '1': 'Test Notification',
          '2': message || 'This is a test message via WhatsApp template.',
        },
      });

      return NextResponse.json({
        success: result.success,
        messageId: result.messageId,
        error: result.error,
        details: {
          phone: formattedPhone,
          method: 'template',
          templateSid: templateSid,
          templateVariables: templateVariables || {
            '1': 'Test Notification',
            '2': message || 'This is a test message via WhatsApp template.',
          },
        },
      });
    }

    // Option 3: Using Unified Notification Service (recommended)
    const notificationService = new UnifiedNotificationService();

    // Get user profile for testing
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, phone_number, full_name')
      .eq('id', user.id)
      .single();

    const result = await notificationService.sendNotification({
      recipients: [
        {
          userId: user.id,
          email: profile?.email || user.email || undefined,
          phone: formattedPhone,
          name: profile?.full_name || user.user_metadata?.full_name || 'Test User',
        },
      ],
      content: {
        title: 'Test WhatsApp Notification',
        message: message || 'This is a test notification sent via WhatsApp. If you receive this, WhatsApp is working correctly!',
        priority: 'high', // Required for WhatsApp
        category: 'general',
      },
      channels: ['whatsapp', 'in_app'], // Include WhatsApp
    });

    return NextResponse.json({
      success: result.success,
      details: {
        phone: formattedPhone,
        method: 'unified_notification_service',
        channels: result.sent,
        failed: result.failed,
        errors: result.errors,
      },
      message: result.success
        ? 'WhatsApp notification sent successfully!'
        : 'Failed to send WhatsApp notification. Check errors for details.',
    });
  } catch (error: any) {
    console.error('Error testing WhatsApp:', error);
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
 * GET /api/test/whatsapp - Check WhatsApp configuration status
 */
export async function GET() {
  const isConfigured = isWhatsAppConfigured();
  const config = {
    accountSid: process.env.TWILIO_ACCOUNT_SID ? '✅ Set' : '❌ Missing',
    authToken: process.env.TWILIO_AUTH_TOKEN ? '✅ Set' : '❌ Missing',
    whatsappFrom: process.env.TWILIO_WHATSAPP_FROM ? '✅ Set' : '❌ Missing',
    templateSid: process.env.TWILIO_WHATSAPP_TEMPLATE_SID ? '✅ Set (Optional)' : '⚠️ Not Set (Optional)',
  };

  return NextResponse.json({
    configured: isConfigured,
    config,
    instructions: isConfigured
      ? 'WhatsApp is configured. Use POST /api/test/whatsapp to send a test message.'
      : 'Please configure WhatsApp in your .env file. See docs/WHATSAPP_SETUP_GUIDE.md for details.',
  });
}

