import { _NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Company policies are stored in company.settings.policies
// This provides a focused API for managing policies

// Default policies when no company is selected
const DEFAULT_POLICIES = {
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

// GET: Fetch company policies
export async function GET() {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use admin client to bypass RLS
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (e) {
      console.warn('Admin client not available, using regular client');
      adminClient = supabase;
    }

    // Get user's active company
    const { data: profile } = await adminClient
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    // If no active company, return default policies (not an error)
    if (!profile?.active_company_id) {
      return NextResponse.json({
        success: true,
        policies: DEFAULT_POLICIES,
        is_default: true,
        message: 'Using default policies. Set up a company to customize.',
      });
    }

    // Get company settings using admin client
    const { data: company, error } = await adminClient
      .from('companies')
      .select('settings')
      .eq('id', profile.active_company_id)
      .single();

    if (error) {
      console.error('Error fetching policies:', error);
      // Return default policies on error
      return NextResponse.json({
        success: true,
        policies: DEFAULT_POLICIES,
        is_default: true,
        message: 'Using default policies. Unable to load custom policies.',
      });
    }

    const policies = company?.settings?.policies || DEFAULT_POLICIES;

    return NextResponse.json({
      success: true,
      policies,
    });
  } catch (error: any) {
    console.error('Policies API Error:', error);
    // Return default policies even on error
    return NextResponse.json({
      success: true,
      policies: DEFAULT_POLICIES,
      is_default: true,
      message: 'An error occurred. Using default policies.',
    });
  }
}

// PUT: Update company policies
export async function PUT(request: Request) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Use admin client to bypass RLS
    let adminClient;
    try {
      adminClient = createAdminClient();
    } catch (e) {
      console.warn('Admin client not available, using regular client');
      adminClient = supabase;
    }

    // Get user's active company
    const { data: profile } = await adminClient
      .from('profiles')
      .select('active_company_id')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json(
        { error: 'No active company selected' },
        { status: 400 }
      );
    }

    // Verify user has admin access
    let canEdit = false;

    // Check company_members first
    const { data: membership } = await adminClient
      .from('company_members')
      .select('role')
      .eq('company_id', profile.active_company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    if (membership && ['owner', 'admin', 'hr'].includes(membership.role)) {
      canEdit = true;
    } else {
      // Fallback: Check if user owns the company directly
      const { data: ownedCompany } = await adminClient
        .from('companies')
        .select('id, owner_id')
        .eq('id', profile.active_company_id)
        .single();

      if (ownedCompany && ownedCompany.owner_id === user.id) {
        canEdit = true;
      }
    }

    if (!canEdit) {
      return NextResponse.json(
        { error: 'Admin or HR access required' },
        { status: 403 }
      );
    }

    // Get current settings using admin client
    const { data: company } = await adminClient
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

    // Update company using admin client
    const { error } = await adminClient
      .from('companies')
      .update({
        settings: updatedSettings,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.active_company_id);

    if (error) {
      console.error('Error updating policies:', error);
      return NextResponse.json(
        { error: 'Failed to update policies' },
        { status: 500 }
      );
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
