import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { formatAuthError } from '@/lib/actions/cookie-actions';

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    // Validate email
    if (!email) {
      return NextResponse.json(
        { error: { message: 'Email is required' } },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: { message: 'Invalid email format' } },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // Check if user exists (for internal logging only, don't expose to client)
    const { data: userData } = await supabase
      .from('users')
      .select('id, email, full_name')
      .eq('email', email)
      .single();

    if (userData) {
      console.log(`🔐 Password reset requested for: ${email}`);

      // Generate password reset link using Supabase Auth
      const { data, error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.thesmartpro.io'}/en/reset-password`,
      });

      if (resetError) {
        console.error('❌ Supabase reset error:', resetError);
        throw resetError;
      }

      // ENHANCED: Send custom branded email using Resend
      // This provides a better user experience than Supabase's default email
      if (process.env.RESEND_API_KEY) {
        try {
          const { sendEmail } = await import('@/lib/services/email.service');
          const { passwordResetEmail } = await import('@/lib/email-templates');

          // Generate custom reset link (Supabase sends the token via email)
          // We'll use the same redirect URL
          const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'https://portal.thesmartpro.io'}/en/reset-password`;

          const emailContent = passwordResetEmail({
            recipientName: userData.full_name || email.split('@')[0],
            resetLink: resetLink,
            expiresIn: '1 hour',
          });

          const emailResult = await sendEmail({
            to: email,
            ...emailContent,
          });

          if (emailResult.success) {
            console.log('✅ Custom password reset email sent via Resend:', emailResult.messageId);
          } else {
            console.warn('⚠️ Failed to send custom email, Supabase email will be used:', emailResult.error);
          }
        } catch (emailError) {
          console.error('⚠️ Custom email error (Supabase email will still be sent):', emailError);
          // Don't fail the request if custom email fails
          // User will still receive Supabase's default email
        }
      } else {
        console.log('📧 RESEND_API_KEY not configured, using Supabase default email');
      }
    } else {
      console.log(`⚠️ Password reset attempted for non-existent email: ${email}`);
      // Don't log this as an error to prevent email enumeration
    }

    // Always return success to prevent email enumeration
    // Never reveal whether the email exists or not
    return NextResponse.json({
      success: true,
      message:
        'If an account with that email exists, a password reset link has been sent. Please check your email inbox (and spam folder).',
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);

    // Don't expose internal errors to the client
    // Always return the same message to prevent email enumeration
    return NextResponse.json({
      success: true,
      message:
        'If an account with that email exists, a password reset link has been sent. Please check your email inbox (and spam folder).',
    });
  }
}
