import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { authenticator } from 'otplib';
import * as crypto from 'crypto';

// ========================================
// 🔐 MFA MANAGEMENT API
// ========================================
// Uses server-side Supabase client directly to avoid browser-only singleton issues.

function generateTOTPSecret(): string {
  return authenticator.generateSecret();
}

function generateBackupCodes(count = 10): string[] {
  return Array.from({ length: count }, () =>
    crypto.randomBytes(4).toString('hex').toUpperCase()
  );
}

function verifyTOTPToken(token: string, secret: string): boolean {
  try {
    return authenticator.check(token, secret);
  } catch {
    return false;
  }
}

async function requireAuth() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) return { supabase: null, user: null };
  return { supabase, user };
}

// POST — setup, verify, or authenticate MFA
export async function POST(req: NextRequest) {
  try {
    const { action, token, backupCode } = await req.json();
    const { supabase, user } = await requireAuth();

    if (!supabase || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    switch (action) {
      case 'setup': {
        const secret = generateTOTPSecret();
        const backupCodes = generateBackupCodes();

        const { error: dbError } = await supabase.from('user_mfa').upsert({
          user_id: user.id,
          totp_secret: secret,
          backup_codes: backupCodes,
          enabled: false,
          verified: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

        if (dbError) {
          return NextResponse.json(
            { success: false, error: 'Failed to setup MFA' },
            { status: 500 }
          );
        }

        // Generate otpauth URI for QR code display
        const otpauthUri = authenticator.keyuri(
          user.email ?? user.id,
          'SmartPro Portal',
          secret
        );

        return NextResponse.json({
          success: true,
          qrCode: otpauthUri,
          secret,
          backupCodes,
        });
      }

      case 'verify': {
        if (!token) {
          return NextResponse.json(
            { success: false, error: 'Verification token required' },
            { status: 400 }
          );
        }

        const { data: mfaData, error: mfaError } = await supabase
          .from('user_mfa')
          .select('totp_secret')
          .eq('user_id', user.id)
          .single();

        if (mfaError || !mfaData) {
          return NextResponse.json(
            { success: false, error: 'MFA not set up' },
            { status: 400 }
          );
        }

        const isValid = verifyTOTPToken(token, mfaData.totp_secret);
        if (!isValid) {
          return NextResponse.json(
            { success: false, error: 'Invalid verification code' },
            { status: 400 }
          );
        }

        await supabase
          .from('user_mfa')
          .update({
            enabled: true,
            verified: true,
            verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', user.id);

        return NextResponse.json({
          success: true,
          message: 'MFA successfully enabled',
        });
      }

      case 'authenticate': {
        if (!token && !backupCode) {
          return NextResponse.json(
            { success: false, error: 'Token or backup code required' },
            { status: 400 }
          );
        }

        const { data: mfaData, error: mfaError } = await supabase
          .from('user_mfa')
          .select('totp_secret, backup_codes, enabled')
          .eq('user_id', user.id)
          .single();

        if (mfaError || !mfaData || !mfaData.enabled) {
          return NextResponse.json(
            { success: false, error: 'MFA not enabled' },
            { status: 400 }
          );
        }

        if (backupCode) {
          const isValidBackup = (mfaData.backup_codes as string[]).includes(backupCode);
          if (!isValidBackup) {
            return NextResponse.json(
              { success: false, error: 'Invalid backup code' },
              { status: 401 }
            );
          }
          // Consume the backup code
          const remaining = (mfaData.backup_codes as string[]).filter(c => c !== backupCode);
          await supabase
            .from('user_mfa')
            .update({ backup_codes: remaining, updated_at: new Date().toISOString() })
            .eq('user_id', user.id);

          return NextResponse.json({ success: true, message: 'Backup code accepted' });
        }

        const isValid = verifyTOTPToken(token, mfaData.totp_secret);
        if (!isValid) {
          return NextResponse.json(
            { success: false, error: 'Invalid authentication code' },
            { status: 401 }
          );
        }

        await supabase
          .from('user_mfa')
          .update({ last_used: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq('user_id', user.id);

        return NextResponse.json({ success: true, message: 'MFA verification successful' });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: 'MFA operation failed' },
      { status: 500 }
    );
  }
}

// GET — return MFA status for the current user
export async function GET(_req: NextRequest) {
  try {
    const { supabase, user } = await requireAuth();

    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: mfaData } = await supabase
      .from('user_mfa')
      .select('enabled, backup_codes, last_used, created_at')
      .eq('user_id', user.id)
      .single();

    return NextResponse.json({
      enabled: mfaData?.enabled ?? false,
      verified: mfaData?.enabled ?? false,
      backupCodesRemaining: (mfaData?.backup_codes as string[] | null)?.length ?? 0,
      lastUsed: mfaData?.last_used ?? null,
      setupDate: mfaData?.created_at ?? null,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to get MFA status' },
      { status: 500 }
    );
  }
}

// DELETE — disable MFA (requires password confirmation)
export async function DELETE(req: NextRequest) {
  try {
    const { password } = await req.json();

    if (!password) {
      return NextResponse.json(
        { success: false, error: 'Password required to disable MFA' },
        { status: 400 }
      );
    }

    const { supabase, user } = await requireAuth();

    if (!supabase || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Re-authenticate to confirm password before disabling MFA
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password,
    });

    if (signInError) {
      return NextResponse.json(
        { success: false, error: 'Invalid password' },
        { status: 401 }
      );
    }

    const { error: deleteError } = await supabase
      .from('user_mfa')
      .update({
        enabled: false,
        verified: false,
        totp_secret: null,
        backup_codes: [],
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', user.id);

    if (deleteError) {
      return NextResponse.json(
        { success: false, error: 'Failed to disable MFA' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'MFA successfully disabled',
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to disable MFA' },
      { status: 500 }
    );
  }
}
