import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Company policies are stored in company.settings.policies
// This provides a focused API for managing policies

// GET: Fetch company policies
export async function GET() {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's active company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json({ error: 'No active company selected' }, { status: 400 });
    }

    // Get company settings
    const { data: company, error } = await supabase
      .from('companies')
      .select('settings')
      .eq('id', profile.active_company_id)
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch policies' }, { status: 500 });
    }

    const policies = company?.settings?.policies || {
      leave: {
        annual_leave_days: 21,
        sick_leave_days: 10,
        carry_over_days: 5,
        notice_days_required: 3,
        approval_required: true,
      },
      attendance: {
        work_start_time: '09:00',
        work_end_time: '18:00',
        grace_period_minutes: 15,
        overtime_multiplier: 1.5,
        weekend_days: ['friday', 'saturday'],
      },
      expenses: {
        daily_limit: 100,
        monthly_limit: 1000,
        currency: 'OMR',
        requires_receipt_above: 10,
        auto_approve_below: 25,
      },
      performance: {
        review_frequency: 'annual',
        rating_scale: 5,
        self_assessment: true,
        goal_tracking: true,
      },
    };

    return NextResponse.json({
      success: true,
      policies,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update company policies
export async function PUT(request: Request) {
  const supabase = await createClient();

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Get user's active company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json({ error: 'No active company selected' }, { status: 400 });
    }

    // Verify user has admin access
    const { data: membership } = await supabase
      .from('company_members')
      .select('role')
      .eq('company_id', profile.active_company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .single();

    if (!membership || !['owner', 'admin', 'hr'].includes(membership.role)) {
      return NextResponse.json({ error: 'Admin or HR access required' }, { status: 403 });
    }

    // Get current settings
    const { data: company } = await supabase
      .from('companies')
      .select('settings')
      .eq('id', profile.active_company_id)
      .single();

    // Merge policies
    const currentSettings = company?.settings || {};
    const updatedSettings = {
      ...currentSettings,
      policies: {
        ...currentSettings.policies,
        ...body,
      },
    };

    // Update company
    const { error } = await supabase
      .from('companies')
      .update({
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.active_company_id);

    if (error) {
      console.error('Error updating policies:', error);
      return NextResponse.json({ error: 'Failed to update policies' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      policies: updatedSettings.policies,
      message: 'Policies updated successfully',
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

