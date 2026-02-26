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

    // Also fetch from the new dedicated audit_logs table
    const { data: nativeAuditLogs } = await supabase
      .from('audit_logs')
      .select('id, action, entity_type, entity_id, user_id, created_at, ip_address')
      .gte('created_at', fromDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(200);

    // Transform native audit logs
    const nativeLogs = (nativeAuditLogs ?? []).map((log: {
      id: string; action: string; entity_type: string; entity_id: string;
      user_id: string; created_at: string; ip_address: string;
    }) => ({
      id: log.id,
      action: log.action,
      description: log.action + ' on ' + log.entity_type + (log.entity_id ? ' (' + log.entity_id + ')' : ''),
      timestamp: log.created_at,
      user_email: log.user_id ?? 'System',
      ip: log.ip_address ?? 'Unknown',
      user_agent: 'Platform',
      success: true,
      details: { entity_type: log.entity_type, entity_id: log.entity_id },
    }));

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

    const allLogs = [...nativeLogs, ...auditLogs].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      logs: allLogs,
      total: allLogs.length,
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
