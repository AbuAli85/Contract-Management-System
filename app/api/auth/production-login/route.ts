import { NextRequest, NextResponse } from 'next/server';
import { productionAuthService } from '@/lib/auth/production-auth-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, captchaToken } = body;

    // Validate required fields
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get client information
    const ipAddress = productionAuthService.getClientIP(request);
    const userAgent = productionAuthService.getUserAgent(request);

    // Check if CAPTCHA is required
    const captchaRequired = productionAuthService.isCaptchaRequired(request);

    if (captchaRequired && !captchaToken) {
      return NextResponse.json(
        {
          error: 'CAPTCHA verification required',
          captchaRequired: true,
          captchaConfig: productionAuthService.getCaptchaConfig(),
        },
        { status: 400 }
      );
    }

    // Attempt authentication
    try {
      const authData = await productionAuthService.signIn(email, password, {
        captchaToken,
        ipAddress,
        userAgent,
      });

      // Log successful authentication
      await productionAuthService.logAuthAttempt(
        'signin',
        email,
        true,
        ipAddress,
        userAgent
      );

      return NextResponse.json({
        success: true,
        user: authData.user,
        session: authData.session,
      });
    } catch (authError) {
      // Log failed authentication
      await productionAuthService.logAuthAttempt(
        'signin',
        email,
        false,
        ipAddress,
        userAgent,
        authError instanceof Error ? authError.message : 'Unknown error'
      );

      // Check if it's a CAPTCHA error
      if (
        authError instanceof Error &&
        (authError.message.includes('captcha') ||
          authError.message.includes('verification'))
      ) {
        return NextResponse.json(
          {
            error: 'CAPTCHA verification failed',
            captchaRequired: true,
            captchaConfig: productionAuthService.getCaptchaConfig(),
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        {
          error:
            authError instanceof Error
              ? authError.message
              : 'Authentication failed',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return CAPTCHA configuration for client-side
    const captchaConfig = productionAuthService.getCaptchaConfig();
    const captchaRequired = productionAuthService.isCaptchaRequired(request);

    return NextResponse.json({
      captchaRequired,
      captchaConfig,
      environment: process.env.NODE_ENV,
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to get configuration' },
      { status: 500 }
    );
  }
}
