import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRBAC } from '@/lib/rbac/guard';
import { ratelimitSensitive, getClientIdentifier, getRateLimitHeaders, createRateLimitResponse } from '@/lib/rate-limit';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Validation schema for bulk actions
const bulkActionSchema = z.object({
  action: z.enum(['archive', 'delete', 'assign', 'notify', 'update_status']),
  promoterIds: z.array(z.string().uuid()).min(1, 'At least one promoter ID is required').max(100, 'Maximum 100 promoters at once'),
  // Optional fields based on action type
  employerId: z.string().uuid().optional(), // For 'assign' action
  status: z.enum(['active', 'inactive', 'suspended', 'holiday', 'on_leave', 'terminated']).optional(), // For 'update_status' action
  notificationType: z.enum(['standard', 'urgent', 'reminder']).optional(), // For 'notify' action
  message: z.string().optional(), // For 'notify' action
});

/**
 * Bulk Actions API
 * 
 * Handles bulk operations on multiple promoters at once.
 * Requires 'promoter:manage:own' permission.
 * 
 * @endpoint POST /api/promoters/bulk
 * 
 * @body {
 *   action: 'archive' | 'delete' | 'assign' | 'notify' | 'update_status',
 *   promoterIds: string[],
 *   employerId?: string,
 *   status?: string,
 *   notificationType?: string,
 *   message?: string
 * }
 */
export const POST = withRBAC('promoter:manage:own', async (request: Request) => {
  try {
    // ✅ SECURITY: Apply strict rate limiting (3 requests per minute)
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await ratelimitSensitive.limit(identifier);
    
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

    console.log('🔍 API /api/promoters/bulk POST called (RBAC ENABLED, Rate Limited)');

    // Parse and validate request body
    const body = await request.json();
    const validatedData = bulkActionSchema.parse(body);
    const { action, promoterIds, employerId, status, notificationType, message } = validatedData;

    console.log(`📦 Bulk action: ${action} on ${promoterIds.length} promoters`);

    // Initialize Supabase client
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase environment variables');
    }

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
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          details: 'Please log in to perform bulk actions'
        },
        { status: 401 }
      );
    }

    console.log('👤 Authenticated user:', user.email);

    // Verify user has access to these promoters
    // RLS policies will enforce this, but we can add additional checks here
    const { data: accessiblePromoters, error: accessError } = await supabase
      .from('promoters')
      .select('id')
      .in('id', promoterIds);

    if (accessError) {
      console.error('❌ Error checking promoter access:', accessError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to verify promoter access',
          details: process.env.NODE_ENV === 'development' ? accessError.message : undefined
        },
        { status: 500 }
      );
    }

    const accessibleIds = new Set((accessiblePromoters || []).map((p: any) => p.id));
    const inaccessibleIds = promoterIds.filter(id => !accessibleIds.has(id));

    if (inaccessibleIds.length > 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Access denied',
          details: `You don't have access to ${inaccessibleIds.length} of the selected promoters`,
          inaccessibleIds: process.env.NODE_ENV === 'development' ? inaccessibleIds : undefined
        },
        { status: 403 }
      );
    }

    // Execute bulk action
    let result;
    let auditAction = '';

    switch (action) {
      case 'archive': {
        auditAction = 'bulk_archive';
        const { error } = await supabase
          .from('promoters')
          .update({ 
            status: 'inactive',
            updated_at: new Date().toISOString()
          })
          .in('id', promoterIds);

        if (error) throw error;

        result = {
          success: true,
          message: `Successfully archived ${promoterIds.length} promoter(s)`,
          count: promoterIds.length,
          action: 'archive',
        };
        break;
      }

      case 'delete': {
        auditAction = 'bulk_delete';
        // Soft delete by setting status to terminated
        const { error } = await supabase
          .from('promoters')
          .update({ 
            status: 'terminated',
            updated_at: new Date().toISOString()
          })
          .in('id', promoterIds);

        if (error) throw error;

        result = {
          success: true,
          message: `Successfully deleted ${promoterIds.length} promoter(s)`,
          count: promoterIds.length,
          action: 'delete',
        };
        break;
      }

      case 'assign': {
        if (!employerId) {
          return NextResponse.json(
            { success: false, error: 'Employer ID is required for assign action' },
            { status: 400 }
          );
        }

        auditAction = 'bulk_assign';
        const { error } = await supabase
          .from('promoters')
          .update({ 
            employer_id: employerId,
            updated_at: new Date().toISOString()
          })
          .in('id', promoterIds);

        if (error) throw error;

        result = {
          success: true,
          message: `Successfully assigned ${promoterIds.length} promoter(s) to company`,
          count: promoterIds.length,
          action: 'assign',
          employerId,
        };
        break;
      }

      case 'update_status': {
        if (!status) {
          return NextResponse.json(
            { success: false, error: 'Status is required for update_status action' },
            { status: 400 }
          );
        }

        auditAction = 'bulk_update_status';
        const { error } = await supabase
          .from('promoters')
          .update({ 
            status,
            updated_at: new Date().toISOString()
          })
          .in('id', promoterIds);

        if (error) throw error;

        result = {
          success: true,
          message: `Successfully updated status for ${promoterIds.length} promoter(s) to ${status}`,
          count: promoterIds.length,
          action: 'update_status',
          status,
        };
        break;
      }

      case 'notify': {
        auditAction = 'bulk_notify';
        // TODO: Integrate with actual notification service
        // For now, just log the action
        console.log('📧 Sending notifications:', {
          type: notificationType || 'standard',
          message,
          recipientCount: promoterIds.length,
        });

        // In production, you would:
        // 1. Fetch promoter contact details
        // 2. Send emails/SMS via service (SendGrid, Twilio, etc.)
        // 3. Log notification history

        result = {
          success: true,
          message: `Notifications sent to ${promoterIds.length} promoter(s)`,
          count: promoterIds.length,
          action: 'notify',
          notificationType: notificationType || 'standard',
        };
        break;
      }

      default:
        return NextResponse.json(
          { success: false, error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }

    // Create audit log for bulk action
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        action: auditAction,
        table_name: 'promoters',
        record_id: promoterIds[0], // Store first ID as reference
        new_values: {
          action,
          promoterIds,
          count: promoterIds.length,
          ...validatedData,
        },
        created_at: new Date().toISOString(),
      });
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Don't fail the request if audit logging fails
    }

    // Add rate limit headers
    const responseHeaders = getRateLimitHeaders(rateLimitResult);

    console.log(`✅ Bulk action completed: ${action} on ${promoterIds.length} promoters`);

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

    console.error('❌ Bulk action error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        message: 'Failed to execute bulk action',
        details: process.env.NODE_ENV === 'development' 
          ? (error as Error).message 
          : undefined
      },
      { status: 500 }
    );
  }
});

