import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  try {
    console.log('🔍 Debug Auth Endpoint Called');
    
    // Check environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const envCheck = {
      hasUrl: !!supabaseUrl,
      hasAnonKey: !!supabaseAnonKey,
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseAnonKey?.length || 0,
      urlStart: supabaseUrl?.substring(0, 20) || 'N/A',
      keyStart: supabaseAnonKey?.substring(0, 20) || 'N/A'
    };
    
    console.log('🔧 Environment Check:', envCheck);
    
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        envCheck
      }, { status: 500 });
    }
    
    // Try to create Supabase client
    let supabase;
    try {
      supabase = await createClient();
      console.log('✅ Supabase client created successfully');
    } catch (clientError) {
      console.error('❌ Failed to create Supabase client:', clientError);
      return NextResponse.json({
        success: false,
        error: 'Failed to create Supabase client',
        details: clientError instanceof Error ? clientError.message : 'Unknown error',
        envCheck
      }, { status: 500 });
    }
    
    // Try to get session
    let sessionResult;
    try {
      sessionResult = await supabase.auth.getSession();
      console.log('🔐 Session check result:', {
        hasSession: !!sessionResult.data.session,
        hasError: !!sessionResult.error,
        errorMessage: sessionResult.error?.message
      });
    } catch (sessionError) {
      console.error('❌ Session check failed:', sessionError);
      return NextResponse.json({
        success: false,
        error: 'Session check failed',
        details: sessionError instanceof Error ? sessionError.message : 'Unknown error',
        envCheck
      }, { status: 500 });
    }
    
    // Try to get user
    let userResult;
    try {
      userResult = await supabase.auth.getUser();
      console.log('👤 User check result:', {
        hasUser: !!userResult.data.user,
        hasError: !!userResult.error,
        errorMessage: userResult.error?.message,
        userId: userResult.data.user?.id
      });
    } catch (userError) {
      console.error('❌ User check failed:', userError);
      return NextResponse.json({
        success: false,
        error: 'User check failed',
        details: userError instanceof Error ? userError.message : 'Unknown error',
        envCheck
      }, { status: 500 });
    }
    
    // Test database connection
    let dbResult;
    try {
      const { data, error } = await supabase
        .from('promoters')
        .select('count', { count: 'exact', head: true });
      
      dbResult = {
        success: !error,
        error: error?.message,
        count: data?.[0]?.count || 0
      };
      
      console.log('🗄️ Database test result:', dbResult);
    } catch (dbError) {
      console.error('❌ Database test failed:', dbError);
      dbResult = {
        success: false,
        error: dbError instanceof Error ? dbError.message : 'Unknown error'
      };
    }
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      envCheck,
      session: {
        hasSession: !!sessionResult.data.session,
        hasError: !!sessionResult.error,
        errorMessage: sessionResult.error?.message
      },
      user: {
        hasUser: !!userResult.data.user,
        hasError: !!userResult.error,
        errorMessage: userResult.error?.message,
        userId: userResult.data.user?.id,
        userEmail: userResult.data.user?.email
      },
      database: dbResult
    });
    
  } catch (error) {
    console.error('❌ Debug endpoint error:', error);
    return NextResponse.json({
      success: false,
      error: 'Debug endpoint failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
