import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Force dynamic rendering for this API route
export const dynamic = 'force-dynamic';

// 🔧 DEBUG ENDPOINT - Check user RBAC permissions
export async function GET() {
  try {
    console.log('🔧 DEBUG: API /api/debug/user-permissions called');
    
    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { success: false, error: 'Missing Supabase credentials' },
        { status: 500 }
      );
    }

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: any) {
          try {
            cookiesToSet.forEach(({ name, value, options }: any) =>
              cookieStore.set(name, value, options as CookieOptions)
            );
          } catch {}
        },
      } as any,
    });

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Not authenticated',
        debug: { authError: authError?.message }
      });
    }

    console.log('🔧 DEBUG: Checking permissions for user:', user.email);

    // Get user's role
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, id')
      .eq('id', user.id)
      .single();

    // Get user's permissions
    const { data: userPermissions, error: permissionsError } = await supabase
      .from('user_permissions')
      .select('permission')
      .eq('user_id', user.id);

    // Get user's roles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    // Get role permissions
    const { data: rolePermissions, error: rolePermissionsError } = await supabase
      .from('role_permissions')
      .select(`
        permission,
        roles!inner (name)
      `)
      .in('role_id', userRoles?.map(r => r.role) || []);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        profile: userProfile,
        profileError: profileError?.message,
      },
      permissions: {
        direct: userPermissions?.map(p => p.permission) || [],
        permissionsError: permissionsError?.message,
      },
      roles: {
        assigned: userRoles?.map(r => r.role) || [],
        rolesError: rolesError?.message,
      },
      rolePermissions: {
        viaRoles: rolePermissions?.map(rp => ({
          permission: rp.permission,
          role: (rp.roles as any)?.name
        })) || [],
        rolePermissionsError: rolePermissionsError?.message,
      },
      debug: {
        rbacEnforcement: process.env.RBAC_ENFORCEMENT || 'not set',
        hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        nodeEnv: process.env.NODE_ENV,
      }
    });
  } catch (error) {
    console.error('❌ DEBUG: Error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
