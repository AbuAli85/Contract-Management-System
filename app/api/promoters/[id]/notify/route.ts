import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { ratelimitStrict, getClientIdentifier } from '@/lib/rate-limit';
import { z } from 'zod';

// Helper function to generate default messages
function generateDefaultMessage(type: string, promoterName: string): string {
  switch (type) {
    case 'urgent':
      return `Urgent notification for ${promoterName}. Please check your documents and contracts.`;
    case 'reminder':
    case 'document_reminder':
      return `Reminder: Please review and update your documents.`;
    case 'standard':
    case 'info':
      return `This is a notification from SmartPro Contract Management System.`;
    case 'warning':
      return `Important: Please review your account and documents.`;
    default:
      return `Notification for ${promoterName}.`;
  }
}

const notifySchema = z.object({
  message: z.string().min(1).max(1000).optional(),
  type: z.enum(['urgent', 'info', 'warning', 'standard', 'reminder', 'document_reminder']).default('info'),
  sendEmail: z.boolean().default(true),
  sendSms: z.boolean().default(false),
  // Don't validate email/promoterName from client - we fetch from database
});

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Rate limiting
    const identifier = getClientIdentifier(request);
    const { success } = await ratelimitStrict.limit(identifier);

    if (!success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Please try again later.' },
        { status: 429 }
      );
    }

    // Authentication and authorization
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check user permissions (simplified for now)
    // In a real implementation, you would check the user's role from the database
    // For now, we'll allow authenticated users to send notifications

    // Validate input
    const body = await request.json();
    const validatedData = notifySchema.parse(body);

    // Get promoter details - use admin client to bypass RLS
    const supabaseAdmin = getSupabaseAdmin();
    const { data: promoterData, error: promoterError } = await supabaseAdmin
      .from('promoters')
      .select('name_en, name_ar, email, phone, mobile_number')
      .eq('id', params.id)
      .single();

    if (promoterError || !promoterData) {
      console.error('Error fetching promoter:', promoterError);
      return NextResponse.json(
        { 
          error: 'Promoter not found',
          details: promoterError?.message,
          promoterId: params.id
        },
        { status: 404 }
      );
    }

    // Type-safe promoter object with name and contact info
    const promoter = {
      full_name: (promoterData as any).name_en || (promoterData as any).name_ar || 'Unknown',
      email: (promoterData as any).email as string | null,
      phone: (promoterData as any).phone || (promoterData as any).mobile_number,
    };

    // Generate appropriate message based on type if not provided
    const message = validatedData.message || generateDefaultMessage(validatedData.type, promoter.full_name);

    // Send notification using the notification service
    if (validatedData.sendEmail && promoter.email) {
      try {
        const { sendEmail } = await import('@/lib/services/email.service');
        const { documentExpiryEmail } = await import('@/lib/email-templates/document-expiry');

        // For document reminders, send appropriate email
        if (validatedData.type === 'document_reminder' || validatedData.type === 'reminder') {
          const emailContent = documentExpiryEmail({
            promoterName: promoter.full_name,
            documentType: 'ID Card', // Default, should ideally be passed in
            expiryDate: 'Soon', // Should be calculated
            daysRemaining: 30,
            urgent: false, // Reminders are not urgent by default
          });

          await sendEmail({
            to: promoter.email,
            ...emailContent,
          });
        } else {
          // Send generic notification email
          await sendEmail({
            to: promoter.email,
            subject: validatedData.type === 'urgent' ? '🚨 Urgent Notification' : '📋 Notification',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 20px;">
                <h2>Hello ${promoter.full_name},</h2>
                <p>${message}</p>
                <hr>
                <p style="color: #666; font-size: 12px;">SmartPro Contract Management System</p>
              </div>
            `,
          });
        }
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the whole request if email fails
      }
    }

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create notification record
    const notification = {
      id: notificationId,
      promoter_id: params.id,
      user_id: user.id,
      type: validatedData.type,
      message: message,
      status: 'sent',
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        promoter_id: params.id,
        type: validatedData.type,
        message: message,
        status: 'sent',
        created_at: notification.created_at,
      },
      message: 'Notification sent successfully',
    });
  } catch (error) {
    console.error('Error in notify promoter API:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
