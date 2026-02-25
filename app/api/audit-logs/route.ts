import { NextRequest, NextResponse } from 'next/server';
import { withRBAC } from '@/lib/rbac/guard';
import { createClient } from '@/lib/supabase/server';

export const GET = withRBAC('audit:read:all', async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const timeframe = searchParams.get('timeframe') || '24h';
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate date range based on timeframe
    const now = new Date();
    let fromDate: Date;
    switch (timeframe) {
      case '7d':
        fromDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        fromDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default: // '24h'
        fromDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    // Fetch webhook logs as audit events
    const { data: webhookLogs, error: webhookError } = await supabase
      .from('webhook_logs')
      .select('*')
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(200);

    if (webhookError) {
      // webhook_logs table may not exist yet — return empty
      return NextResponse.json({
        logs: [],
        total: 0,
        timeframe,
        from: fromDate.toISOString(),
        to: now.toISOString(),
      });
    }

    // Transform webhook logs to audit log format
    const auditLogs = (webhookLogs ?? []).map(log => ({
      id: log.id,
      action: `webhook_${log.type}`,
      description: log.error
        ? `Webhook ${log.type} failed: ${log.error}`
        : `Webhook ${log.type} executed successfully`,
      timestamp: log.created_at,
      user_email: 'System',
      ip: 'Internal',
      user_agent: 'Webhook Service',
      success: !log.error,
      details: {
        type: log.type,
        payload: log.payload,
        attempts: log.attempts,
        error: log.error,
      },
    }));

    return NextResponse.json({
      logs: auditLogs,
      total: auditLogs.length,
      timeframe,
      from: fromDate.toISOString(),
      to: now.toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
});
