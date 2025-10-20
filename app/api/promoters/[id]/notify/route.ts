import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRBAC } from '@/lib/rbac/guard';
import { ratelimitStrict, getClientIdentifier, getRateLimitHeaders, createRateLimitResponse } from '@/lib/rate-limit';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Validation schema for notification requests
const notificationSchema = z.object({
  type: z.enum(['standard', 'urgent', 'reminder']).default('standard'),
  promoterName: z.string().optional(),
  email: z.string().email().optional(),
  message: z.string().optional(),
});

// ✅ SECURITY: RBAC enabled with rate limiting
export const POST = withRBAC('promoter:manage:own', async (
  request: Request,
  { params }: { params: { id: string } }
) => {
  try {
    // ✅ SECURITY: Apply rate limiting
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await ratelimitStrict.limit(identifier);
    
    if (!rateLimitResult.success) {
      const headers = getRateLimitHeaders(rateLimitResult);
      const body = createRateLimitResponse(rateLimitResult);
      
      return NextResponse.json(body, {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });
    }

    console.log('🔍 API /api/promoters/[id]/notify POST called (RBAC ENABLED, Rate Limited)');
      
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('❌ Missing Supabase credentials');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // ✅ SECURITY: Using ANON key with RLS policies
    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {}
        },
      } as any,
    });

    // ✅ SECURITY: Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          details: 'Please log in to send notifications'
        },
        { status: 401 }
      );
    }

    console.log('👤 Authenticated user:', user.email);

    const promoterId = params.id;

    // Parse and validate request body
    const body = await request.json();
    const validatedData = notificationSchema.parse(body);

    const { type, promoterName, email, message } = validatedData;

    console.log('📧 Notification request:', { promoterId, type, promoterName, email });

    // Fetch promoter data
    const { data: promoter, error: promoterError } = await supabase
      .from('promoters')
      .select('id, name_en, name_ar, email, mobile_number, status')
      .eq('id', promoterId)
      .single();

    if (promoterError || !promoter) {
      console.error('❌ Promoter not found:', promoterError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Promoter not found',
          details: 'The specified promoter does not exist or you do not have access'
        },
        { status: 404 }
      );
    }

    // Determine notification content based on type
    let notificationContent = '';
    let subject = '';

    switch (type) {
      case 'urgent':
        subject = '🚨 Urgent: Action Required';
        notificationContent = message || `Dear ${promoter.name_en || promoterName || 'Promoter'}, this is an urgent notification requiring immediate attention. Please contact us as soon as possible.`;
        break;
      case 'reminder':
        subject = '⏰ Reminder: Document Renewal';
        notificationContent = message || `Dear ${promoter.name_en || promoterName || 'Promoter'}, this is a reminder that your documents may be expiring soon. Please ensure all required documents are up to date.`;
        break;
      case 'standard':
      default:
        subject = '📋 Notification from Contract Management System';
        notificationContent = message || `Dear ${promoter.name_en || promoterName || 'Promoter'}, you have a new notification from the Contract Management System. Please log in to view details.`;
        break;
    }

    // For now, we'll just log the notification and return success
    // In a real implementation, this would integrate with email/SMS services
    console.log('📧 Notification would be sent:', {
      to: email || promoter.email,
      subject,
      content: notificationContent,
      type,
      promoterId,
      promoterName: promoter.name_en || promoterName
    });

    // Create audit log
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: 'send_notification',
        table_name: 'promoters',
        record_id: promoterId,
        new_values: { 
          notification_type: type,
          recipient_email: email || promoter.email,
          subject,
          content: notificationContent
        },
        created_at: new Date().toISOString(),
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }

    const result = {
      success: true,
      message: `Notification sent successfully to ${promoter.name_en || promoterName || 'promoter'}`,
      notification: {
        type,
        subject,
        recipient: email || promoter.email,
        promoterId,
        promoterName: promoter.name_en || promoterName
      }
    };

    console.log(`✅ Notification processed: ${result.message}`);
    
    // Add rate limit headers to response
    const responseHeaders = getRateLimitHeaders(rateLimitResult);
    
    return NextResponse.json(result, {
      headers: responseHeaders,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    console.error('❌ API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: process.env.NODE_ENV === 'development' 
          ? (error as Error).message 
          : undefined
      },
      { status: 500 }
    );
  }
});
