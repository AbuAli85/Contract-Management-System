import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET /api/dashboard/layout/default - Get default layout for role
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') || 'user';

    const supabase = await createClient();

    const { data: defaultLayout, error } = await supabase
      .from('default_layouts_by_role')
      .select('*')
      .eq('role', role)
      .single();

    if (error) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch default layout' },
        { status: 500 }
      );
    }

    if (!defaultLayout) {
      return NextResponse.json(
        {
          success: false,
          error: 'No default layout found for this role',
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      layout: {
        id: null,
        name: `Default ${role.charAt(0).toUpperCase() + role.slice(1)} Dashboard`,
        isDefault: false,
        isShared: false,
        widgets: parseLayoutData(defaultLayout.layout_data),
        breakpoint: 'lg',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function parseLayoutData(layoutData: any): any[] {
  if (!layoutData) return [];

  return layoutData.map((position: any) => ({
    id: position.i,
    type: position.i.split('_')[0],
    position,
    config: {},
    isVisible: true,
  }));
}
