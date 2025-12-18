import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { withRBAC } from '@/lib/rbac/guard';

export const dynamic = 'force-dynamic';

// Fallback code generator if RPC function fails
function generateFallbackCode(): string {
  return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// POST - Create a new attendance link
export const POST = withRBAC('attendance:create:all', async (
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

    const body = await request.json();
    const {
      title,
      target_latitude,
      target_longitude,
      allowed_radius_meters = 50,
      valid_from,
      valid_until,
      max_uses,
      auto_generate_daily = false,
      office_location_id,
    } = body;

    if (!target_latitude || !target_longitude) {
      return NextResponse.json(
        { error: 'Target latitude and longitude are required' },
        { status: 400 }
      );
    }

    if (!valid_until) {
      return NextResponse.json(
        { error: 'Valid until date is required' },
        { status: 400 }
      );
    }

    // Get user's company
    const { data: profile } = await supabase
      .from('profiles')
      .select('active_company_id, role')
      .eq('id', user.id)
      .single();

    if (!profile?.active_company_id) {
      return NextResponse.json(
        { error: 'No active company found', details: 'Please select an active company in your profile settings' },
        { status: 400 }
      );
    }

    // Verify user has correct role
    if (!['admin', 'employer', 'manager'].includes(profile.role || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions', details: `Your role (${profile.role}) does not have permission to create attendance links. Required: admin, employer, or manager` },
        { status: 403 }
      );
    }

    // Generate unique link code
    const { data: codeData, error: codeError } = await supabaseAdmin.rpc('generate_attendance_link_code');
    
    if (codeError) {
      console.error('Error generating link code:', codeError);
      return NextResponse.json(
        { error: 'Failed to generate link code', details: codeError.message },
        { status: 500 }
      );
    }

    // Function returns the code directly
    const linkCode = codeData || generateFallbackCode();

    // Create the attendance link using admin client (bypasses RLS)
    const { data: link, error: createError } = await (supabaseAdmin.from('attendance_links') as any)
      .insert({
        company_id: profile.active_company_id,
        created_by: user.id,
        link_code: linkCode,
        title: title || `Check-In Link - ${new Date().toLocaleDateString()}`,
        target_latitude,
        target_longitude,
        allowed_radius_meters,
        valid_from: valid_from || new Date().toISOString(),
        valid_until,
        max_uses: max_uses || null,
        auto_generate_daily,
        office_location_id: office_location_id || null,
      })
      .select()
      .single();

    if (createError) {
      console.error('Error creating attendance link:', createError);
      console.error('User profile:', { 
        id: user.id, 
        role: profile.role, 
        active_company_id: profile.active_company_id 
      });
      console.error('Service role key configured:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      
      // Provide more detailed error information
      return NextResponse.json(
        { 
          error: 'Failed to create attendance link', 
          details: createError.message,
          code: createError.code,
          hint: createError.hint,
          // Include diagnostic info in development
          ...(process.env.NODE_ENV === 'development' && {
            diagnostic: {
              user_id: user.id,
              user_role: profile.role,
              active_company_id: profile.active_company_id,
              has_service_role_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            }
          })
        },
        { status: 500 }
      );
    }

    // Generate the full URL
    const baseUrl = request.nextUrl.origin;
    const linkUrl = `${baseUrl}/attendance/check-in/${linkCode}`;

    return NextResponse.json({
      success: true,
      link: {
        ...link,
        url: linkUrl,
        qr_code_data: linkUrl, // For QR code generation
      },
    });
  } catch (error) {
    console.error('Error in POST /api/employer/attendance-links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

// GET - List all attendance links for the company
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

    // Get query params
    const { searchParams } = new URL(request.url);
    const includeExpired = searchParams.get('include_expired') === 'true';

    // Build query
    let query = (supabaseAdmin.from('attendance_links') as any)
      .select(`
        *,
        created_by_user:created_by (
          id,
          full_name,
          email
        ),
        office_location:office_location_id (
          id,
          name,
          address
        )
      `)
      .eq('company_id', profile.active_company_id)
      .order('created_at', { ascending: false });

    if (!includeExpired) {
      query = query.gte('valid_until', new Date().toISOString());
    }

    const { data: links, error } = await query;

    if (error) {
      console.error('Error fetching attendance links:', error);
      return NextResponse.json(
        { error: 'Failed to fetch attendance links' },
        { status: 500 }
      );
    }

    // Generate URLs for each link
    const baseUrl = request.nextUrl.origin;
    const linksWithUrls = (links || []).map((link: any) => ({
      ...link,
      url: `${baseUrl}/attendance/check-in/${link.link_code}`,
      qr_code_data: `${baseUrl}/attendance/check-in/${link.link_code}`,
    }));

    return NextResponse.json({
      success: true,
      links: linksWithUrls,
      count: linksWithUrls.length,
    });
  } catch (error) {
    console.error('Error in GET /api/employer/attendance-links:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

