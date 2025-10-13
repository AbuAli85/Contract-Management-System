import { createClient } from '@/lib/supabase/server';
import { NextRequest } from 'next/server';

export interface CaptchaConfig {
  provider: 'hcaptcha' | 'turnstile';
  siteKey: string;
  secretKey: string;
}

export interface AuthOptions {
  captchaToken?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class ProductionAuthService {
  private captchaConfig: CaptchaConfig | null = null;

  constructor() {
    this.initializeCaptchaConfig();
  }

  // Lazy client creation to avoid storing unresolved Promise
  private async getSupabaseClient() {
    return await createClient();
  }

  private initializeCaptchaConfig() {
    const provider = process.env.NEXT_PUBLIC_CAPTCHA_PROVIDER as 'hcaptcha' | 'turnstile';
    
    if (provider === 'hcaptcha') {
      this.captchaConfig = {
        provider: 'hcaptcha',
        siteKey: process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY || '',
        secretKey: process.env.HCAPTCHA_SECRET_KEY || '',
      };
    } else if (provider === 'turnstile') {
      this.captchaConfig = {
        provider: 'turnstile',
        siteKey: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '',
        secretKey: process.env.TURNSTILE_SECRET_KEY || '',
      };
    }
  }

  /**
   * Verify CAPTCHA token with the configured provider
   */
  async verifyCaptcha(token: string, ipAddress?: string): Promise<boolean> {
    if (!this.captchaConfig) {
      console.warn('CAPTCHA not configured, skipping verification');
      return true;
    }

    if (!token) {
      throw new Error('CAPTCHA token is required');
    }

    try {
      const response = await fetch(this.getCaptchaVerifyUrl(), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          secret: this.captchaConfig.secretKey,
          response: token,
          ...(ipAddress && { remoteip: ipAddress }),
        }),
      });

      const data = await response.json();
      
      if (this.captchaConfig.provider === 'hcaptcha') {
        return data.success === true;
      } else {
        return data.success === true;
      }
    } catch (error) {
      console.error('CAPTCHA verification failed:', error);
      throw new Error('CAPTCHA verification failed');
    }
  }

  private getCaptchaVerifyUrl(): string {
    if (!this.captchaConfig) {
      throw new Error('CAPTCHA not configured');
    }

    return this.captchaConfig.provider === 'hcaptcha'
      ? 'https://hcaptcha.com/siteverify'
      : 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
  }

  /**
   * Sign up with CAPTCHA verification
   */
  async signUp(
    email: string,
    password: string,
    options: {
      fullName?: string;
      role?: string;
      phone?: string;
      company?: string;
    } = {},
    authOptions: AuthOptions = {}
  ) {
    // Verify CAPTCHA if configured
    if (this.captchaConfig && authOptions.captchaToken) {
      const isValid = await this.verifyCaptcha(authOptions.captchaToken, authOptions.ipAddress);
      if (!isValid) {
        throw new Error('CAPTCHA verification failed');
      }
    }

    const supabase = await this.getSupabaseClient();

    // Create user with Supabase
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: options.fullName,
          role: options.role || 'user',
          phone: options.phone,
          company: options.company,
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Sign in with CAPTCHA verification
   */
  async signIn(
    email: string,
    password: string,
    authOptions: AuthOptions = {}
  ) {
    // Verify CAPTCHA if configured
    if (this.captchaConfig && authOptions.captchaToken) {
      const isValid = await this.verifyCaptcha(authOptions.captchaToken, authOptions.ipAddress);
      if (!isValid) {
        throw new Error('CAPTCHA verification failed');
      }
    }

    const supabase = await this.getSupabaseClient();

    // Sign in with Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Reset password with CAPTCHA verification
   */
  async resetPassword(
    email: string,
    authOptions: AuthOptions = {}
  ) {
    // Verify CAPTCHA if configured
    if (this.captchaConfig && authOptions.captchaToken) {
      const isValid = await this.verifyCaptcha(authOptions.captchaToken, authOptions.ipAddress);
      if (!isValid) {
        throw new Error('CAPTCHA verification failed');
      }
    }

    const supabase = await this.getSupabaseClient();

    // Reset password with Supabase
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`,
    });

    if (error) {
      throw new Error(error.message);
    }

    return data;
  }

  /**
   * Get CAPTCHA configuration for client-side
   */
  getCaptchaConfig() {
    return {
      provider: this.captchaConfig?.provider || null,
      siteKey: this.captchaConfig?.siteKey || null,
      enabled: !!this.captchaConfig,
    };
  }

  /**
   * Check if CAPTCHA is required for the current request
   */
  isCaptchaRequired(request: NextRequest): boolean {
    // Check if CAPTCHA is enabled
    if (!this.captchaConfig) {
      return false;
    }

    // Check feature flag
    if (process.env.FEATURE_CAPTCHA_ENABLED === 'false') {
      return false;
    }

    // Check if it's a production environment
    if (process.env.NODE_ENV !== 'production') {
      return false;
    }

    // Check rate limiting or suspicious activity
    // This is a simplified check - in production you might want to check
    // IP reputation, rate limiting, etc.
    return true;
  }

  /**
   * Log authentication attempt for security monitoring
   */
  async logAuthAttempt(
    type: 'signup' | 'signin' | 'reset',
    email: string,
    success: boolean,
    ipAddress?: string,
    userAgent?: string,
    error?: string
  ) {
    if (process.env.ENABLE_SECURITY_AUDIT_LOGGING !== 'true') {
      return;
    }

    try {
      // Log to your preferred logging service (e.g., Sentry, LogRocket, etc.)
      console.log('Auth attempt:', {
        type,
        email,
        success,
        ipAddress,
        userAgent,
        error,
        timestamp: new Date().toISOString(),
      });

      // You can also store this in your database for analysis
      // await this.supabase.from('auth_logs').insert({
      //   type,
      //   email,
      //   success,
      //   ip_address: ipAddress,
      //   user_agent: userAgent,
      //   error_message: error,
      //   created_at: new Date().toISOString(),
      // });
    } catch (error) {
      console.error('Failed to log auth attempt:', error);
    }
  }

  /**
   * Get client IP address from request
   */
  getClientIP(request: NextRequest): string {
    const forwarded = request.headers.get('x-forwarded-for');
    const realIP = request.headers.get('x-real-ip');
    const cfConnectingIP = request.headers.get('cf-connecting-ip');
    
    if (cfConnectingIP) return cfConnectingIP;
    if (realIP) return realIP;
    if (forwarded) return forwarded.split(',')[0].trim();
    
    return 'unknown';
  }

  /**
   * Get user agent from request
   */
  getUserAgent(request: NextRequest): string {
    return request.headers.get('user-agent') || 'unknown';
  }
}

// Export singleton instance
export const productionAuthService = new ProductionAuthService();
