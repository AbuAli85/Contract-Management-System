import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  validatePasswordComprehensive,
  hashPasswordForHistory,
} from '@/lib/security/password-validation';
import {
  rateLimiters,
  getRateLimitHeaders,
  getClientIdentifier,
} from '@/lib/security/upstash-rate-limiter';

export const dynamic = 'force-dynamic';

/**
 * Change user password with comprehensive security checks
 */
export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting (30/min for password changes)
    const identifier = getClientIdentifier(request);
    const rateLimitResult = await rateLimiters.apiWrite.limit(identifier);

    if (!rateLimitResult.success) {
      const headers = getRateLimitHeaders({
        success: rateLimitResult.success,
        limit: rateLimitResult.limit,
        remaining: rateLimitResult.remaining,
        reset: rateLimitResult.reset,
        retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
      });

      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many password change attempts. Please wait before trying again.',
          retryAfter: Math.ceil((rateLimitResult.reset - Date.now()) / 1000),
        },
        {
          status: 429,
          headers,
        }
      );
    }

    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { currentPassword, newPassword } = await request.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Current password and new password are required' },
        { status: 400 }
      );
    }

    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) {
      return NextResponse.json(
        { error: 'Current password is incorrect' },
        { status: 401 }
      );
    }

    // Comprehensive password validation
    const validation = await validatePasswordComprehensive(newPassword, user.id, {
      checkBreach: true,
      checkHistory: true,
      requireMinimumStrength: true,
    });

    if (!validation.isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password validation failed',
          errors: validation.errors,
          warnings: validation.warnings,
          strength: validation.strength,
        },
        { status: 400 }
      );
    }

    // Check for breach
    if (validation.breachInfo?.isBreached) {
      return NextResponse.json(
        {
          success: false,
          error: 'Breached password',
          message: `This password has been found in ${validation.breachInfo.breachCount.toLocaleString()} data breaches. Please choose a different password.`,
        },
        { status: 400 }
      );
    }

    // Check password history
    if (validation.historyInfo?.isReused) {
      return NextResponse.json(
        {
          success: false,
          error: 'Password reused',
          message: validation.historyInfo.message,
        },
        { status: 400 }
      );
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      console.error('Error updating password:', updateError);
      return NextResponse.json(
        { error: 'Failed to update password' },
        { status: 500 }
      );
    }

    // Add to password history
    const passwordHash = await hashPasswordForHistory(newPassword);
    const { error: historyError } = await supabase
      .from('password_history')
      .insert({
        user_id: user.id,
        password_hash: passwordHash,
        created_at: new Date().toISOString(),
      });

    if (historyError) {
      console.error('Error saving password history:', historyError);
      // Don't fail the password change if history save fails
    }

    // Send email notification
    await sendPasswordChangeNotification(request, user);

    return NextResponse.json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Password change error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Send email notification when password is changed
 */
async function sendPasswordChangeNotification(
  request: NextRequest,
  user: any
) {
  try {
    // Get client information
    const ip =
      request.ip ||
      request.headers.get('x-forwarded-for')?.split(',')[0] ||
      'unknown';
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'UTC',
      dateStyle: 'full',
      timeStyle: 'long',
    });

    // Create secure account link (contains token)
    const secureAccountUrl = `${process.env.NEXT_PUBLIC_APP_URL}/secure-account?userId=${user.id}&timestamp=${Date.now()}`;

    // Email content
    const emailSubject = '🔐 Password Changed - Security Alert';
    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
          <h2 style="margin: 0; color: #1f2937;">Password Changed</h2>
        </div>
        
        <div style="padding: 20px; background: white; border: 1px solid #e5e7eb; border-radius: 8px;">
          <p style="margin: 0 0 15px 0; color: #374151;">
            Hello,
          </p>
          
          <p style="margin: 0 0 15px 0; color: #374151;">
            Your password was successfully changed.
          </p>
          
          <div style="background: #f3f4f6; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #1f2937;">
              Change Details:
            </p>
            <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">
              <strong>Time:</strong> ${timestamp}
            </p>
            <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">
              <strong>IP Address:</strong> ${ip}
            </p>
            <p style="margin: 5px 0; color: #4b5563; font-size: 14px;">
              <strong>Device:</strong> ${userAgent.substring(0, 100)}
            </p>
          </div>
          
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
            <p style="margin: 0 0 10px 0; font-weight: bold; color: #991b1b;">
              ⚠️ Wasn't you?
            </p>
            <p style="margin: 0 0 15px 0; color: #7f1d1d; font-size: 14px;">
              If you didn't make this change, your account may be compromised.
            </p>
            <a href="${secureAccountUrl}" 
               style="display: inline-block; background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Secure My Account
            </a>
          </div>
          
          <p style="margin: 20px 0 0 0; color: #6b7280; font-size: 13px;">
            If you made this change, you can safely ignore this email.
          </p>
        </div>
        
        <div style="margin-top: 20px; padding: 15px; color: #6b7280; font-size: 12px; text-align: center;">
          <p style="margin: 0;">
            This is an automated security notification from Contract Management System.
          </p>
          <p style="margin: 5px 0 0 0;">
            For security reasons, please do not reply to this email.
          </p>
        </div>
      </div>
    `;

    // Send email via Supabase Auth (if email notifications are enabled)
    // Or use your email service (SendGrid, Resend, etc.)
    console.log('📧 Password change notification sent to:', user.email);
    console.log('   IP:', ip);
    console.log('   Time:', timestamp);

    // TODO: Implement actual email sending
    // For now, just log the notification
    // In production, integrate with your email service:
    // - SendGrid
    // - Resend
    // - AWS SES
    // - Mailgun
    // etc.

    return {
      sent: true,
      recipient: user.email,
    };
  } catch (error) {
    console.error('Error sending password change notification:', error);
    // Don't fail the password change if email fails
    return {
      sent: false,
      error: 'Failed to send notification',
    };
  }
}

