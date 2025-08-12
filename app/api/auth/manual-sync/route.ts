import { createClient } from '@/lib/supabase/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient();
    const body = await request.json();

    const { userId, email, fullName, role, phone } = body;

    console.log('🔧 Manual Sync API - Starting for:', email, role);

    // Validate required fields
    if (!userId || !email || !fullName || !role) {
      return NextResponse.json(
        { error: 'Missing required fields for sync' },
        { status: 400 }
      );
    }

    // Try to create/update public user record
    const { error: upsertError } = await supabase.from('users').upsert(
      {
        id: userId,
        email,
        full_name: fullName,
        role,
        status: 'active',
        phone: phone || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      }
    );

    if (upsertError) {
      console.error('❌ Manual sync error:', upsertError);
      return NextResponse.json(
        { error: `Sync failed: ${upsertError.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Manual sync successful');

    return NextResponse.json({
      success: true,
      message: 'User profile synced successfully',
      user: {
        id: userId,
        email,
        full_name: fullName,
        role,
      },
    });
  } catch (error) {
    console.error('❌ Manual sync API error:', error);
    return NextResponse.json(
      { error: 'Internal server error during sync' },
      { status: 500 }
    );
  }
}
