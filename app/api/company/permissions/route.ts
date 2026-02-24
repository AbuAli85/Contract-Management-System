import { NextRequest, NextResponse } from 'next/server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// GET: Get permissions for a user in a company
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const userId = searchParams.get('user_id') || user.id;

    if (!companyId) {
      return NextResponse.json(
        { error: 'Company ID is required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify requester has permission to view permissions
    const { data: requesterMembership } = await adminClient
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    const { data: ownedCompany } = await adminClient
      .from('companies')
      .select('owner_id')
      .eq('id', companyId)
      .single();

    const canView =
      ownedCompany?.owner_id === user.id ||
      requesterMembership?.role === 'owner' ||
      requesterMembership?.role === 'admin' ||
      userId === user.id; // Users can view their own permissions

    if (!canView) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      );
    }

    // Get permissions
    const { data: permissions, error } = await adminClient
      .from('company_permissions')
      .select('*')
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('is_active', true);

    if (error) {
      console.error('Error fetching permissions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch permissions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      permissions: permissions || [],
    });
  } catch (error: any) {
    console.error('Error in GET /api/company/permissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Grant permission to a user
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { company_id, user_id, permission, expires_at } = body;

    if (!company_id || !user_id || !permission) {
      return NextResponse.json(
        { error: 'company_id, user_id, and permission are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify requester has permission to grant permissions
    const { data: requesterMembership } = await adminClient
      .from('company_members')
      .select('role')
      .eq('company_id', company_id)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    const { data: ownedCompany } = await adminClient
      .from('companies')
      .select('owner_id')
      .eq('id', company_id)
      .single();

    const canGrant =
      ownedCompany?.owner_id === user.id ||
      requesterMembership?.role === 'owner' ||
      requesterMembership?.role === 'admin';

    if (!canGrant) {
      return NextResponse.json(
        { error: 'Insufficient permissions to grant permissions' },
        { status: 403 }
      );
    }

    // Grant permission (upsert)
    const { data: permissionData, error } = await adminClient
      .from('company_permissions')
      .upsert(
        {
          user_id,
          company_id,
          permission,
          granted: true,
          granted_by: user.id,
          expires_at: expires_at || null,
          is_active: true,
        },
        {
          onConflict: 'user_id,company_id,permission',
        }
      )
      .select()
      .single();

    if (error) {
      console.error('Error granting permission:', error);
      return NextResponse.json(
        { error: 'Failed to grant permission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      permission: permissionData,
      message: 'Permission granted successfully',
    });
  } catch (error: any) {
    console.error('Error in POST /api/company/permissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Revoke permission from a user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');
    const userId = searchParams.get('user_id');
    const permission = searchParams.get('permission');

    if (!companyId || !userId || !permission) {
      return NextResponse.json(
        { error: 'company_id, user_id, and permission are required' },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();

    // Verify requester has permission to revoke permissions
    const { data: requesterMembership } = await adminClient
      .from('company_members')
      .select('role')
      .eq('company_id', companyId)
      .eq('user_id', user.id)
      .eq('status', 'active')
      .maybeSingle();

    const { data: ownedCompany } = await adminClient
      .from('companies')
      .select('owner_id')
      .eq('id', companyId)
      .single();

    const canRevoke =
      ownedCompany?.owner_id === user.id ||
      requesterMembership?.role === 'owner' ||
      requesterMembership?.role === 'admin';

    if (!canRevoke) {
      return NextResponse.json(
        { error: 'Insufficient permissions to revoke permissions' },
        { status: 403 }
      );
    }

    // Revoke permission (soft delete)
    const { error } = await adminClient
      .from('company_permissions')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('company_id', companyId)
      .eq('permission', permission);

    if (error) {
      console.error('Error revoking permission:', error);
      return NextResponse.json(
        { error: 'Failed to revoke permission' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Permission revoked successfully',
    });
  } catch (error: any) {
    console.error('Error in DELETE /api/company/permissions:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
