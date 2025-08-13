import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Test DB API called');
    
    const supabase = await createClient();
    console.log('✅ Supabase client created');
    
    // Test basic connection
    const { data: connectionTest, error: connectionError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    console.log('📋 Connection test result:', {
      success: !connectionError,
      error: connectionError?.message,
      errorCode: connectionError?.code,
    });
    
    if (connectionError) {
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: connectionError.message,
        code: connectionError.code,
      }, { status: 500 });
    }
    
    // Test profiles table
    const { data: profilesTest, error: profilesError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    console.log('📋 Profiles table test:', {
      success: !profilesError,
      error: profilesError?.message,
      errorCode: profilesError?.code,
    });
    
         // Test users table structure
     const { data: usersStructure, error: usersStructureError } = await supabase
       .from('users')
       .select('id, email, role, status, created_at')
       .limit(5);
    
    console.log('📋 Users table structure test:', {
      success: !usersStructureError,
      hasData: !!usersStructure,
      dataLength: usersStructure?.length || 0,
      error: usersStructureError?.message,
      errorCode: usersStructureError?.code,
    });
    
    return NextResponse.json({
      success: true,
      connection: 'OK',
      usersTable: !usersStructureError ? 'OK' : 'ERROR',
      profilesTable: !profilesError ? 'OK' : 'ERROR',
      usersData: usersStructure || [],
      errors: {
        users: usersStructureError?.message,
        profiles: profilesError?.message,
      }
    });
    
  } catch (error) {
    console.error('❌ Test DB API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
