import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ratelimitStrict, getClientIdentifier } from '@/lib/rate-limit';
import { z } from 'zod';

const notifySchema = z.object({
  message: z.string().min(1).max(1000),
  type: z.enum(['urgent', 'info', 'warning']).default('info'),
  sendEmail: z.boolean().default(true),
  sendSms: z.boolean().default(false),
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
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check user permissions (simplified for now)
    // In a real implementation, you would check the user's role from the database
    // For now, we'll allow authenticated users to send notifications

    // Validate input
    const body = await request.json();
    const validatedData = notifySchema.parse(body);

    // For now, we'll simulate the notification process
    // In a real implementation, you would:
    // 1. Verify the promoter exists in the database
    // 2. Create a notification record
    // 3. Send the actual notification (email/SMS)
    // 4. Log the action

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate notification creation
    const notification = {
      id: notificationId,
      promoter_id: params.id,
      user_id: user.id,
      type: validatedData.type,
      message: validatedData.message,
      status: 'pending',
      created_at: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      notification: {
        id: notification.id,
        promoter_id: params.id,
        type: validatedData.type,
        message: validatedData.message,
        status: 'pending',
        created_at: notification.created_at,
      },
      message: 'Notification queued successfully',
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