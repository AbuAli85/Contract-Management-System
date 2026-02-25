import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { withRBAC } from '@/lib/rbac/guard';
import {
  ratelimitStrict,
  getClientIdentifier,
  getRateLimitHeaders,
  createRateLimitResponse,
} from '@/lib/rate-limit';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// Validation schema for bulk actions
const bulkActionSchema = z.object({
  action: z.enum(['archive', 'delete', 'notify', 'assign', 'update_status', 'remind', 'request_documents']),
  promoterIds: z
    .array(z.string().uuid())
    .min(1, 'At least one promoter ID is required'),
  status: z.string().optional(),
  notificationType: z.enum(['standard', 'urgent', 'reminder']).optional(),
  companyId: z.string().uuid().optional(),
});

// ✅ SECURITY: RBAC enabled with rate limiting
export const POST = withRBAC(
  'promoter:manage:own',
  async (request: Request) => {
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

      const cookieStore = await cookies();
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
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
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return NextResponse.json(
          {
            success: false,
            error: 'Authentication required',
            details: 'Please log in to perform bulk actions',
          },
          { status: 401 }
        );
      }

      // Parse and validate request body
      const body = await request.json();
      const validatedData = bulkActionSchema.parse(body);

      const { action, promoterIds, status, notificationType, companyId } =
        validatedData;


      const result: any = {
        success: true,
        processed: 0,
        failed: 0,
        errors: [],
      };

      switch (action) {
        case 'archive': {
          // Archive promoters (soft delete by setting status to 'archived')
          const { data: archivedPromoters, error: archiveError } =
            await supabase
              .from('promoters')
              .update({
                status: 'archived',
                updated_at: new Date().toISOString(),
              })
              .in('id', promoterIds)
              .select('id, name_en, name_ar');

          if (archiveError) {
            return NextResponse.json(
              {
                success: false,
                error: 'Failed to archive promoters',
                details: archiveError.message,
              },
              { status: 500 }
            );
          }

          result.processed = archivedPromoters?.length || 0;
          result.message = `Successfully archived ${result.processed} promoters`;

          // Create audit log
          try {
            await supabase.from('audit_logs').insert({
              user_id: user.id,
              action: 'bulk_archive',
              table_name: 'promoters',
              record_id: null,
              new_values: {
                promoter_ids: promoterIds,
                count: result.processed,
              },
              created_at: new Date().toISOString(),
            });
          } catch (auditError) {
          }
          break;
        }

        case 'delete': {
          // Soft delete promoters (set status to 'terminated')
          const { data: deletedPromoters, error: deleteError } = await supabase
            .from('promoters')
            .update({
              status: 'terminated',
              updated_at: new Date().toISOString(),
            })
            .in('id', promoterIds)
            .select('id, name_en, name_ar');

          if (deleteError) {
            return NextResponse.json(
              {
                success: false,
                error: 'Failed to delete promoters',
                details: deleteError.message,
              },
              { status: 500 }
            );
          }

          result.processed = deletedPromoters?.length || 0;
          result.message = `Successfully deleted ${result.processed} promoters`;

          // Create audit log
          try {
            await supabase.from('audit_logs').insert({
              user_id: user.id,
              action: 'bulk_delete',
              table_name: 'promoters',
              record_id: null,
              new_values: {
                promoter_ids: promoterIds,
                count: result.processed,
              },
              created_at: new Date().toISOString(),
            });
          } catch (auditError) {
          }
          break;
        }

        case 'update_status': {
          if (!status) {
            return NextResponse.json(
              {
                success: false,
                error: 'Status is required for update_status action',
              },
              { status: 400 }
            );
          }

          const { data: updatedPromoters, error: updateError } = await supabase
            .from('promoters')
            .update({
              status,
              updated_at: new Date().toISOString(),
            })
            .in('id', promoterIds)
            .select('id, name_en, name_ar');

          if (updateError) {
            return NextResponse.json(
              {
                success: false,
                error: 'Failed to update promoter status',
                details: updateError.message,
              },
              { status: 500 }
            );
          }

          result.processed = updatedPromoters?.length || 0;
          result.message = `Successfully updated status for ${result.processed} promoters`;

          // Create audit log
          try {
            await supabase.from('audit_logs').insert({
              user_id: user.id,
              action: 'bulk_update_status',
              table_name: 'promoters',
              record_id: null,
              new_values: {
                promoter_ids: promoterIds,
                status,
                count: result.processed,
              },
              created_at: new Date().toISOString(),
            });
          } catch (auditError) {
          }
          break;
        }

        case 'assign': {
          if (!companyId) {
            return NextResponse.json(
              {
                success: false,
                error: 'Company ID is required for assign action',
              },
              { status: 400 }
            );
          }

          const { data: assignedPromoters, error: assignError } = await supabase
            .from('promoters')
            .update({
              employer_id: companyId,
              updated_at: new Date().toISOString(),
            })
            .in('id', promoterIds)
            .select('id, name_en, name_ar');

          if (assignError) {
            return NextResponse.json(
              {
                success: false,
                error: 'Failed to assign promoters',
                details: assignError.message,
              },
              { status: 500 }
            );
          }

          result.processed = assignedPromoters?.length || 0;
          result.message = `Successfully assigned ${result.processed} promoters to company`;

          // Create audit log
          try {
            await supabase.from('audit_logs').insert({
              user_id: user.id,
              action: 'bulk_assign',
              table_name: 'promoters',
              record_id: null,
              new_values: {
                promoter_ids: promoterIds,
                company_id: companyId,
                count: result.processed,
              },
              created_at: new Date().toISOString(),
            });
          } catch (auditError) {
          }
          break;
        }

        case 'notify': {
          // Send notifications to selected promoters via individual notify endpoint
          let notified = 0;
          const { data: promotersToNotify } = await supabase
            .from('promoters')
            .select('id, name_en, name_ar, email')
            .in('id', promoterIds);

          for (const promoter of promotersToNotify || []) {
            try {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
              await fetch(`${baseUrl}/api/promoters/${promoter.id}/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: notificationType || 'standard',
                  promoterName: promoter.name_en || promoter.name_ar || 'Promoter',
                  email: promoter.email,
                }),
              });
              notified++;
            } catch {
              result.failed++;
            }
          }
          result.processed = notified;
          result.message = `Notifications sent to ${notified} promoters`;

          try {
            await supabase.from('audit_logs').insert({
              user_id: user.id,
              action: 'bulk_notify',
              table_name: 'promoters',
              record_id: null,
              new_values: {
                promoter_ids: promoterIds,
                notification_type: notificationType || 'standard',
                count: notified,
              },
              created_at: new Date().toISOString(),
            });
          } catch {}
          break;
        }

        case 'remind': {
          // Send document renewal reminders to selected promoters
          let reminded = 0;
          const { data: promotersToRemind } = await supabase
            .from('promoters')
            .select('id, name_en, name_ar, email, id_card_expiry_date, passport_expiry_date')
            .in('id', promoterIds);

          for (const promoter of promotersToRemind || []) {
            try {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
              await fetch(`${baseUrl}/api/promoters/${promoter.id}/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'reminder',
                  promoterName: promoter.name_en || promoter.name_ar || 'Promoter',
                  email: promoter.email,
                }),
              });
              reminded++;
            } catch {
              result.failed++;
            }
          }
          result.processed = reminded;
          result.message = `Document renewal reminders sent to ${reminded} promoters`;

          try {
            await supabase.from('audit_logs').insert({
              user_id: user.id,
              action: 'bulk_remind',
              table_name: 'promoters',
              record_id: null,
              new_values: { promoter_ids: promoterIds, count: reminded },
              created_at: new Date().toISOString(),
            });
          } catch {}
          break;
        }

        case 'request_documents': {
          // Send document request notifications to selected promoters
          let requested = 0;
          const { data: promotersToRequest } = await supabase
            .from('promoters')
            .select('id, name_en, name_ar, email')
            .in('id', promoterIds);

          for (const promoter of promotersToRequest || []) {
            try {
              const baseUrl = process.env.NEXT_PUBLIC_APP_URL || '';
              await fetch(`${baseUrl}/api/promoters/${promoter.id}/notify`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: 'document_reminder',
                  promoterName: promoter.name_en || promoter.name_ar || 'Promoter',
                  email: promoter.email,
                }),
              });
              requested++;
            } catch {
              result.failed++;
            }
          }
          result.processed = requested;
          result.message = `Document requests sent to ${requested} promoters`;

          try {
            await supabase.from('audit_logs').insert({
              user_id: user.id,
              action: 'bulk_request_documents',
              table_name: 'promoters',
              record_id: null,
              new_values: { promoter_ids: promoterIds, count: requested },
              created_at: new Date().toISOString(),
            });
          } catch {}
          break;
        }

        default:
          return NextResponse.json(
            {
              success: false,
              error: `Unknown action: ${action}`,
            },
            { status: 400 }
          );
      }

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

      return NextResponse.json(
        {
          success: false,
          error: 'Internal server error',
          details:
            process.env.NODE_ENV === 'development'
              ? (error as Error).message
              : undefined,
        },
        { status: 500 }
      );
    }
  }
);
