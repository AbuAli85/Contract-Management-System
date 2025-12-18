import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

/**
 * Cron job endpoint to generate daily attendance links
 * 
 * This should be called daily (e.g., via Vercel Cron, GitHub Actions, or external cron service)
 * 
 * Usage:
 * - Vercel Cron: Add to vercel.json
 * - External: Call this endpoint daily at a set time
 * - Manual: Can be triggered manually for testing
 */
export async function GET(request: NextRequest) {
  // Verify cron secret (optional but recommended)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Get all active schedules
    const { data: schedules, error: schedulesError } = await (supabaseAdmin
      .from('attendance_link_schedules')
      .select('*')
      .eq('is_active', true) as any);

    if (schedulesError) {
      console.error('Error fetching schedules:', schedulesError);
      return NextResponse.json(
        { error: 'Failed to fetch schedules', details: schedulesError.message },
        { status: 500 }
      );
    }

    if (!schedules || schedules.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active schedules found',
        generated: 0,
      });
    }

    const results: any[] = [];
    let totalGenerated = 0;
    let totalErrors = 0;

    // Process each schedule
    for (const schedule of (schedules as any[])) {
      try {
        const scheduleId: string = String((schedule as any)?.id || '');
        const scheduleName: string = String((schedule as any)?.name || 'Unknown');
        
        if (!scheduleId || scheduleId === '') {
          results.push({
            schedule_id: 'unknown',
            schedule_name: 'Unknown',
            status: 'error',
            error: 'Schedule ID is missing',
          });
          continue;
        }

        // Check if schedule should run today
        const dayOfWeek = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.
        const shouldRun = 
          (dayOfWeek === 0 && (schedule as any).sunday) ||
          (dayOfWeek === 1 && (schedule as any).monday) ||
          (dayOfWeek === 2 && (schedule as any).tuesday) ||
          (dayOfWeek === 3 && (schedule as any).wednesday) ||
          (dayOfWeek === 4 && (schedule as any).thursday) ||
          (dayOfWeek === 5 && (schedule as any).friday) ||
          (dayOfWeek === 6 && (schedule as any).saturday);

        if (!shouldRun) {
          // @ts-ignore - scheduleId is guaranteed to be string after validation
          results.push<{
            schedule_id: string;
            schedule_name: string;
            status: string;
            reason: string;
          }>({
            schedule_id: scheduleId,
            schedule_name: scheduleName,
            status: 'skipped',
            reason: 'Not scheduled for today',
          });
          continue;
        }

        // Check if already generated today
        const scheduledDate = new Date().toISOString().split('T')[0] as string;
        const query = supabaseAdmin
          .from('scheduled_attendance_links')
          .select('id')
          .eq('schedule_id', scheduleId)
          .eq('scheduled_date', scheduledDate)
          .limit(1);
        const { data: existingLinks } = await (query as any);

        if (existingLinks && existingLinks.length > 0) {
          results.push({
            schedule_id: scheduleId,
            schedule_name: scheduleName,
            status: 'skipped',
            reason: 'Already generated today',
          });
          continue;
        }

        // Generate links using the database function
        const rpcCall = supabaseAdmin.rpc as any;
        // @ts-ignore - Supabase RPC type inference issue with admin client parameters
        const { data: generatedLinks, error: generateError } = await rpcCall(
          'generate_schedule_links',
          { p_schedule_id: scheduleId }
        );

        if (generateError) {
          console.error(`Error generating links for schedule ${scheduleId}:`, generateError);
          results.push({
            schedule_id: scheduleId,
            schedule_name: scheduleName,
            status: 'error',
            error: generateError.message,
          });
          totalErrors++;
          continue;
        }

        const linksGenerated = (generatedLinks && Array.isArray(generatedLinks) && generatedLinks.length > 0) 
          ? ((generatedLinks[0] as any)?.check_in_link_id ? 1 : 0) + ((generatedLinks[0] as any)?.check_out_link_id ? 1 : 0)
          : 0;

        totalGenerated += linksGenerated;

        // Send notifications if configured
        if ((schedule as any)?.send_check_in_link || (schedule as any)?.send_check_out_link) {
          await sendScheduleNotifications(scheduleId, supabaseAdmin);
        }

        results.push({
          schedule_id: scheduleId,
          schedule_name: scheduleName,
          status: 'success',
          links_generated: linksGenerated,
        });
      } catch (error: any) {
        const scheduleId = (schedule as any)?.id || 'unknown';
        const scheduleName = (schedule as any)?.name || 'Unknown';
        console.error(`Error processing schedule ${scheduleId}:`, error);
        results.push({
          schedule_id: scheduleId,
          schedule_name: scheduleName,
          status: 'error',
          error: error.message,
        });
        totalErrors++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${schedules.length} schedules`,
      total_generated: totalGenerated,
      total_errors: totalErrors,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in cron job:', error);
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
 * Send notifications for a schedule
 */
async function sendScheduleNotifications(scheduleId: string, supabaseAdmin: any) {
  try {
    // Get schedule details
    const { data: schedule } = await (supabaseAdmin
      .from('attendance_link_schedules')
      .select('*')
      .eq('id', scheduleId)
      .single() as any);

    if (!schedule) return;

    // Get employees (use enhanced function if available, otherwise fallback)
    let employees: any[] | null = null;
    try {
      const { data: enhancedEmployees } = await (supabaseAdmin.rpc(
        'get_schedule_employees_enhanced',
        { p_schedule_id: scheduleId }
      ) as any);
      employees = enhancedEmployees;
    } catch (error) {
      // Fallback to original function
      const { data: fallbackEmployees } = await (supabaseAdmin.rpc(
        'get_schedule_employees',
        { p_schedule_id: scheduleId }
      ) as any);
      employees = fallbackEmployees;
    }

    if (!employees || employees.length === 0) return;

    // Get today's generated links
    const { data: todayLinks } = await (supabaseAdmin
      .from('scheduled_attendance_links')
      .select(`
        *,
        attendance_link:attendance_link_id (
          link_code,
          url
        )
      `)
      .eq('schedule_id', scheduleId)
      .eq('scheduled_date', new Date().toISOString().split('T')[0]) as any);

    if (!todayLinks || todayLinks.length === 0) return;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://portal.thesmartpro.io';
    let notificationsSent = 0;

    // Send notifications to each employee
    for (const employee of employees) {
      const checkInLink = todayLinks.find((l: any) => l.link_type === 'check_in');
      const checkOutLink = todayLinks.find((l: any) => l.link_type === 'check_out');

      if (checkInLink && schedule.send_check_in_link) {
        // Default to 'en' locale for generated links (can be customized per employee)
        const locale = 'en';
        const linkUrl = `${baseUrl}/${locale}/attendance/check-in/${checkInLink.attendance_link.link_code}`;
        
        // Send email if configured
        if (schedule.notification_method?.includes('email') && employee.email) {
          await sendEmailNotification(
            employee.email,
            employee.full_name,
            linkUrl,
            'check_in',
            schedule,
            supabaseAdmin
          );
          notificationsSent++;
        }

        // Send SMS if configured (implement SMS service integration)
        if (schedule.notification_method?.includes('sms') && employee.phone) {
          // TODO: Implement SMS sending
          console.log(`Would send SMS to ${employee.phone} with link: ${linkUrl}`);
        }
      }

      if (checkOutLink && schedule.send_check_out_link) {
        // Default to 'en' locale for generated links (can be customized per employee)
        const locale = 'en';
        const linkUrl = `${baseUrl}/${locale}/attendance/check-in/${checkOutLink.attendance_link.link_code}`;
        
        if (schedule.notification_method?.includes('email') && employee.email) {
          await sendEmailNotification(
            employee.email,
            employee.full_name,
            linkUrl,
            'check_out',
            schedule,
            supabaseAdmin
          );
          notificationsSent++;
        }
      }
    }

    // Update notification count
    await supabaseAdmin
      .from('attendance_link_schedules')
      .update({
        last_sent_at: new Date().toISOString(),
        total_notifications_sent: (schedule.total_notifications_sent || 0) + notificationsSent,
      })
      .eq('id', scheduleId);

    // Update scheduled_attendance_links
    for (const link of todayLinks) {
      await supabaseAdmin
        .from('scheduled_attendance_links')
        .update({
          sent_at: new Date().toISOString(),
          notifications_sent_count: employees.length,
        })
        .eq('id', link.id);
    }
  } catch (error) {
    console.error('Error sending notifications:', error);
  }
}

/**
 * Send email notification (placeholder - implement with your email service)
 */
async function sendEmailNotification(
  email: string,
  name: string,
  linkUrl: string,
  linkType: 'check_in' | 'check_out',
  schedule: any,
  supabaseAdmin: any
) {
  // TODO: Implement email sending using your email service (SendGrid, Resend, etc.)
  // For now, just log it
  console.log(`Email notification to ${email}:`, {
    subject: `${linkType === 'check_in' ? 'Check-In' : 'Check-Out'} Link - ${schedule.name}`,
    link: linkUrl,
    name,
  });

  // Example with Supabase Edge Function or external email service:
  // await fetch('https://your-email-service.com/send', {
  //   method: 'POST',
  //   headers: { 'Content-Type': 'application/json' },
  //   body: JSON.stringify({
  //     to: email,
  //     subject: `${linkType === 'check_in' ? 'Check-In' : 'Check-Out'} Link - ${schedule.name}`,
  //     html: generateEmailTemplate(name, linkUrl, linkType, schedule),
  //   }),
  // });
}

