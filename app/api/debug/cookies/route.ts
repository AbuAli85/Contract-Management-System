import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔧 Debug cookies API called');

    const allCookies = request.cookies.getAll();
    const cookieInfo = allCookies.map(cookie => ({
      name: cookie.name,
      value: cookie.value ? 'present' : 'empty',
    }));

    // Check for specific Supabase auth cookies
    const supabaseCookies = allCookies.filter(
      cookie =>
        cookie.name.includes('supabase') ||
        cookie.name.includes('auth') ||
        cookie.name.includes('sb-')
    );

    const debugInfo = {
      totalCookies: allCookies.length,
      allCookies: cookieInfo,
      supabaseCookies: supabaseCookies.map(c => c.name),
      hasAuthCookies: supabaseCookies.length > 0,
      timestamp: new Date().toISOString(),
    };

    console.log('🔧 Debug cookies result:', debugInfo);

    return NextResponse.json({
      success: true,
      debug: debugInfo,
    });
  } catch (error) {
    console.error('❌ Debug cookies API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
