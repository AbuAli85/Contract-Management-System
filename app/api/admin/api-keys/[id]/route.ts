import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { withRBAC } from '@/lib/rbac/guard';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * PUT /api/admin/api-keys/[id]
 * Update an API key
 */
export const PUT = withRBAC('system:admin:all', async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const updates: any = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.permissions !== undefined) updates.permissions = body.permissions;
    if (body.allowedOrigins !== undefined) updates.allowed_origins = body.allowedOrigins;
    if (body.rateLimitPerMinute !== undefined) updates.rate_limit_per_minute = body.rateLimitPerMinute;
    if (body.isActive !== undefined) updates.is_active = body.isActive;
    if (body.expiresAt !== undefined) updates.expires_at = body.expiresAt || null;

    // Use admin client to bypass RLS for admin operations
    const adminClient = getSupabaseAdmin();

    // Update API key using admin client (bypasses RLS)
    const { data: updatedKey, error } = await adminClient
      .from('api_keys')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating API key:', error);
      return NextResponse.json(
        { error: 'Failed to update API key', details: error.message },
        { status: 500 }
      );
    }

    if (!updatedKey) {
      return NextResponse.json(
        { error: 'API key not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key updated successfully',
      apiKey: {
        id: updatedKey.id,
        name: updatedKey.name,
        keyPrefix: updatedKey.key_prefix,
        permissions: updatedKey.permissions,
        allowedOrigins: updatedKey.allowed_origins,
        rateLimitPerMinute: updatedKey.rate_limit_per_minute,
        isActive: updatedKey.is_active,
        expiresAt: updatedKey.expires_at,
        lastUsedAt: updatedKey.last_used_at,
      },
    });
  } catch (error) {
    console.error('Error in PUT /api/admin/api-keys/[id]:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

/**
 * DELETE /api/admin/api-keys/[id]
 * Delete (deactivate) an API key
 */
export const DELETE = withRBAC('system:admin:all', async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) => {
  try {
    const supabase = await createClient();
    const { id } = await params;
    
    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Use admin client to bypass RLS for admin operations
    const adminClient = getSupabaseAdmin();

    // Soft delete by deactivating using admin client (bypasses RLS)
    const { error } = await adminClient
      .from('api_keys')
      .update({ is_active: false })
      .eq('id', id);

    if (error) {
      console.error('Error deleting API key:', error);
      return NextResponse.json(
        { error: 'Failed to delete API key', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'API key deactivated successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/admin/api-keys/[id]:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
});

