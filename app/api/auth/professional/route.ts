import { NextRequest, NextResponse } from 'next/server';
import {
  professionalSecurityMiddleware,
  SecurityPolicies,
} from '@/lib/auth/professional-security-middleware';
import { createClient } from '@/lib/supabase/server';

// ========================================
// 🏢 PROFESSIONAL AUTHENTICATION API
// ========================================

/**
 * Enhanced login endpoint with comprehensive security features:
 * - Multi-factor authentication support
 * - Device fingerprinting and trust management
 * - Risk-based authentication
 * - Comprehensive audit logging
 * - Rate limiting and brute force protection
 */

export const POST = professionalSecurityMiddleware.withSecurity(
  async (req: NextRequest, context) => {
    try {
      const { email, password, mfaToken, deviceName, trustDevice } =
        await req.json();

      if (!email || !password) {
        return NextResponse.json(
          { success: false, error: 'Email and password are required' },
          { status: 400 }
        );
      }

      const supabase = await createClient();

      // Authenticate with Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        return NextResponse.json(
          { success: false, error: error?.message ?? 'Authentication failed' },
          { status: 401 }
        );
      }

      // Check if user profile is active
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status, full_name')
        .eq('id', data.user.id)
        .single();

      if (profile?.status && !['active', 'approved'].includes(profile.status)) {
        await supabase.auth.signOut();
        return NextResponse.json(
          { success: false, error: 'Account is not active. Please contact support.' },
          { status: 403 }
        );
      }

      // Check MFA requirement
      const { data: mfaData } = await supabase
        .from('user_mfa')
        .select('enabled')
        .eq('user_id', data.user.id)
        .single();

      if (mfaData?.enabled && !mfaToken) {
        return NextResponse.json({
          success: false,
          requiresMFA: true,
          message: 'MFA token required',
        });
      }

      // Verify MFA token if provided
      if (mfaData?.enabled && mfaToken) {
        const { MFAService } = await import('@/lib/auth/mfa-service');
        const mfaService = MFAService.getInstance();
        const mfaResult = await mfaService.verifyMFALogin(mfaToken);
        if (!mfaResult.success) {
          return NextResponse.json(
            { success: false, error: 'Invalid MFA token' },
            { status: 401 }
          );
        }
      }

      return NextResponse.json({
        success: true,
        message: 'Authentication successful',
        user: {
          id: data.user.id,
          email: data.user.email,
          role: profile?.role ?? 'user',
          fullName: profile?.full_name,
        },
        securityContext: {
          requestId: context.requestId,
          riskScore: context.riskScore,
          timestamp: context.timestamp,
        },
        requiresMFA: false,
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Authentication failed' },
        { status: 500 }
      );
    }
  },
  SecurityPolicies.PUBLIC
);

export const GET = professionalSecurityMiddleware.withSecurity(
  async (_req: NextRequest, context) => {
    return NextResponse.json({
      message: 'Professional Authentication API',
      version: '2.0.0',
      features: [
        'Multi-factor authentication',
        'Biometric authentication',
        'Risk-based authentication',
        'Device management',
        'Session management',
        'Security monitoring',
        'Compliance reporting',
      ],
      securityContext: {
        requestId: context.requestId,
        riskScore: context.riskScore,
        timestamp: context.timestamp,
      },
    });
  },
  SecurityPolicies.PUBLIC
);
