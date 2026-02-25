import { NextRequest, NextResponse } from 'next/server';
import {
  professionalSecurityMiddleware,
  SecurityPolicies,
} from '@/lib/auth/professional-security-middleware';
import { MFAService } from '@/lib/auth/mfa-service';
import { createClient } from '@/lib/supabase/server';

// ========================================
// 🔐 MFA MANAGEMENT API
// ========================================

/**
 * Multi-Factor Authentication management endpoints
 * - TOTP setup and verification
 * - Backup code generation and management
 * - MFA status and configuration
 */

// Enable MFA for user
export const POST = professionalSecurityMiddleware.withSecurity(
  async (req: NextRequest, _context) => {
    try {
      const { action, token, backupCode } = await req.json();
      const mfaService = MFAService.getInstance();

      switch (action) {
        case 'setup': {
          const result = await mfaService.enableMFA();
          if (!result.success) {
            return NextResponse.json(
              { success: false, error: result.error },
              { status: 400 }
            );
          }
          return NextResponse.json({
            success: true,
            qrCode: result.qrCode,
            secret: result.secret,
            backupCodes: result.backupCodes,
          });
        }

        case 'verify': {
          if (!token) {
            return NextResponse.json(
              { success: false, error: 'Verification token required' },
              { status: 400 }
            );
          }
          const result = await mfaService.verifyMFASetup(token);
          if (!result.success) {
            return NextResponse.json(
              { success: false, error: result.error },
              { status: 400 }
            );
          }
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
          const result = await mfaService.verifyMFALogin(token, backupCode);
          if (!result.success) {
            return NextResponse.json(
              { success: false, error: result.error },
              { status: 401 }
            );
          }
          return NextResponse.json({
            success: true,
            message: 'MFA verification successful',
          });
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
  },
  SecurityPolicies.PROTECTED
);

// Get MFA status
export const GET = professionalSecurityMiddleware.withSecurity(
  async (_req: NextRequest, _context) => {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
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
        backupCodesRemaining: mfaData?.backup_codes?.length ?? 0,
        lastUsed: mfaData?.last_used ?? null,
        setupDate: mfaData?.created_at ?? null,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Failed to get MFA status' },
        { status: 500 }
      );
    }
  },
  SecurityPolicies.PROTECTED
);

// Disable MFA
export const DELETE = professionalSecurityMiddleware.withSecurity(
  async (req: NextRequest, _context) => {
    try {
      const { password } = await req.json();

      if (!password) {
        return NextResponse.json(
          { success: false, error: 'Password required to disable MFA' },
          { status: 400 }
        );
      }

      const mfaService = MFAService.getInstance();
      const result = await mfaService.disableMFA(password);

      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 400 }
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
  },
  SecurityPolicies.PROTECTED
);
