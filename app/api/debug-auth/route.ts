import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkPermission } from '@/lib/rbac/guard';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Auth: Starting debug request...');
    
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Debug Auth: Auth error:', authError);
      return NextResponse.json({
        success: false,
        error: 'Authentication error',
        details: authError.message
      }, { status: 401 });
    }
    
    if (!user) {
      console.log('❌ Debug Auth: No user found');
      return NextResponse.json({
        success: false,
        error: 'No authenticated user',
        user: null
      }, { status: 401 });
    }
    
    console.log('✅ Debug Auth: User authenticated:', user.id);
    
    // Check RBAC permission
    const rbacResult = await checkPermission('contract:read:own');
    
    console.log('🔐 Debug Auth: RBAC result:', rbacResult);
    
    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      console.warn('⚠️ Debug Auth: Profile fetch error:', profileError);
    }
    
    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile: profile || null,
      rbac: rbacResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Debug Auth: Unexpected error:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: (error as Error).message
    }, { status: 500 });
  }
}
