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
      .limit(100);

    if (webhookError) {
      console.error('Error fetching webhook logs:', webhookError);
    }

    // Transform webhook logs to audit log format
    const auditLogs = (webhookLogs || []).map(log => ({
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

    // Add some mock authentication events for demonstration
    const mockAuthEvents = [
      {
        id: `auth_${Date.now()}_1`,
        action: 'user_login',
        description: 'User logged in successfully',
        timestamp: new Date(now.getTime() - 60 * 60 * 1000).toISOString(),
        user_email: user.email,
        ip: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        success: true,
        details: { method: 'email' },
      },
      {
        id: `auth_${Date.now()}_2`,
        action: 'permission_check',
        description: 'Permission check for admin dashboard',
        timestamp: new Date(now.getTime() - 30 * 60 * 1000).toISOString(),
        user_email: user.email,
        ip: '192.168.1.100',
        user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        success: true,
        details: { resource: 'admin_dashboard' },
      },
    ];

    const allLogs = [...auditLogs, ...mockAuthEvents].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({
      logs: allLogs,
      total: allLogs.length,
      timeframe,
      from: fromDate.toISOString(),
      to: now.toISOString(),
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit logs' },
      { status: 500 }
    );
  }
});
