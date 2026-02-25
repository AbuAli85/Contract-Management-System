import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

/**
 * Device Management API
 * Manages trusted devices for the authenticated user
 */

// GET - List trusted devices for the current user
export async function GET(_req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: devices, error } = await supabase
      .from('user_trusted_devices')
      .select('id, device_name, device_fingerprint, last_used_at, created_at')
      .eq('user_id', user.id)
      .order('last_used_at', { ascending: false });

    if (error) {
      // Table may not exist yet - return empty array gracefully
      return NextResponse.json({ devices: [] });
    }

    return NextResponse.json({ devices: devices ?? [] });
  } catch {
    return NextResponse.json({ devices: [] });
  }
}

// DELETE - Remove a trusted device
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deviceId } = await req.json();
    if (!deviceId) {
      return NextResponse.json(
        { error: 'Device ID is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('user_trusted_devices')
      .delete()
      .eq('id', deviceId)
      .eq('user_id', user.id);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to remove device' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Device removed successfully',
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
