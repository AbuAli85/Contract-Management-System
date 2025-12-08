import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/layout - Get user's default dashboard layout
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Try to get user's default layout
    const { data: layout, error } = await supabase
      .from('dashboard_layouts')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_default', true)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching dashboard layout:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch layout' },
        { status: 500 }
      );
    }

    // If no custom layout, return role-based default
    if (!layout) {
      const { data: userProfile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

      const userRole = (userProfile as any)?.role || 'user';

      const { data: defaultLayout } = await supabase
        .from('default_layouts_by_role')
        .select('*')
        .eq('role', userRole)
        .single();

      if (defaultLayout) {
        return NextResponse.json({
          success: true,
          layout: {
            id: null,
            userId: user.id,
            name: `Default ${userRole.charAt(0).toUpperCase() + userRole.slice(1)} Dashboard`,
            isDefault: false,
            isShared: false,
            widgets: parseLayoutData(defaultLayout.layout_data),
            breakpoint: 'lg',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        });
      }
    }

    return NextResponse.json({
      success: true,
      layout: layout ? formatLayout(layout) : null,
    });
  } catch (error) {
    console.error('Dashboard layout GET error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/layout - Save dashboard layout
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, isDefault, isShared, widgets, breakpoint } = body;

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('dashboard_layouts')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true);
    }

    // Prepare layout data
    const layoutData = widgets.map((w: any) => w.position);

    // Create new layout
    const { data: layout, error } = await supabase
      .from('dashboard_layouts')
      .insert({
        user_id: user.id,
        name: name || 'My Dashboard',
        is_default: isDefault !== false, // Default to true
        is_shared: isShared || false,
        layout_data: layoutData,
        breakpoint: breakpoint || 'lg',
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving dashboard layout:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to save layout' },
        { status: 500 }
      );
    }

    // Save widget configurations
    if (widgets && widgets.length > 0) {
      const widgetConfigs = widgets.map((w: any) => ({
        layout_id: layout.id,
        widget_type: w.type,
        widget_config: w.config || {},
        position_data: w.position,
        is_visible: w.isVisible !== false,
        refresh_interval: w.config?.refreshInterval || 60,
      }));

      const { error: widgetError } = await supabase
        .from('widget_configurations')
        .insert(widgetConfigs);

      if (widgetError) {
        console.error('Error saving widget configurations:', widgetError);
        // Continue anyway, layout is saved
      }
    }

    return NextResponse.json({
      success: true,
      layout: formatLayout(layout),
      message: 'Layout saved successfully',
    });
  } catch (error) {
    console.error('Dashboard layout POST error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard/layout - Update dashboard layout
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, isDefault, isShared, widgets, breakpoint } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Layout ID required' },
        { status: 400 }
      );
    }

    // If setting as default, unset other defaults
    if (isDefault) {
      await supabase
        .from('dashboard_layouts')
        .update({ is_default: false })
        .eq('user_id', user.id)
        .eq('is_default', true)
        .neq('id', id);
    }

    // Prepare layout data
    const layoutData = widgets.map((w: any) => w.position);

    // Update layout
    const { data: layout, error } = await supabase
      .from('dashboard_layouts')
      .update({
        name: name || 'My Dashboard',
        is_default: isDefault !== false,
        is_shared: isShared || false,
        layout_data: layoutData,
        breakpoint: breakpoint || 'lg',
      })
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating dashboard layout:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to update layout' },
        { status: 500 }
      );
    }

    // Delete old widget configurations
    await supabase.from('widget_configurations').delete().eq('layout_id', id);

    // Save new widget configurations
    if (widgets && widgets.length > 0) {
      const widgetConfigs = widgets.map((w: any) => ({
        layout_id: id,
        widget_type: w.type,
        widget_config: w.config || {},
        position_data: w.position,
        is_visible: w.isVisible !== false,
        refresh_interval: w.config?.refreshInterval || 60,
      }));

      await supabase.from('widget_configurations').insert(widgetConfigs);
    }

    return NextResponse.json({
      success: true,
      layout: formatLayout(layout),
      message: 'Layout updated successfully',
    });
  } catch (error) {
    console.error('Dashboard layout PUT error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper functions
function parseLayoutData(layoutData: any): any[] {
  if (!layoutData) return [];

  // layoutData is an array of widget positions
  return layoutData.map((position: any) => ({
    id: position.i,
    type: position.i.split('_')[0], // Extract widget type from id
    position,
    config: {},
    isVisible: true,
  }));
}

function formatLayout(layout: any): any {
  return {
    id: layout.id,
    userId: layout.user_id,
    name: layout.name,
    isDefault: layout.is_default,
    isShared: layout.is_shared,
    widgets: parseLayoutData(layout.layout_data),
    breakpoint: layout.breakpoint,
    createdAt: layout.created_at,
    updatedAt: layout.updated_at,
  };
}
