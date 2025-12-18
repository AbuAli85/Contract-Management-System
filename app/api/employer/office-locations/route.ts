import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { withRBAC } from '@/lib/rbac/guard';

export const dynamic = 'force-dynamic';

// GET - Get office locations for the company
export const GET = withRBAC('attendance:read:all', async (
  request: NextRequest
) => {
  try {
    const supabase = await createClient();
    const supabaseAdmin = getSupabaseAdmin();
    
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json(
        { error: 'No active company found' },
        { status: 400 }
      );
    }

    // Get office locations for the company
    const { data: locations, error } = await (supabaseAdmin.from('office_locations') as any)
      .select('*')
      .eq('company_id', profile.active_company_id)
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      console.error('Error fetching office locations:', error);
      return NextResponse.json(
        { error: 'Failed to fetch office locations' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      locations: locations || [],
      count: locations?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/employer/office-locations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

