import { createClient } from '@/lib/supabase/server';
import { createClient as createClientComponent } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { authenticator } from 'otplib';

export interface MFASetupResult {
  success: boolean;
  qrCode?: string;
  secret?: string;
  backupCodes?: string[];
  error?: string;
}

export interface MFAVerificationResult {
  success: boolean;
  error?: string;
  requiresBackupCode?: boolean;
}

export class MFAService {
  private static instance: MFAService;
  private supabase: any;

  private constructor() {
    this.supabase = createClientComponent();
  }

  public static getInstance(): MFAService {
    if (!MFAService.instance) {
      MFAService.instance = new MFAService();
    }
    return MFAService.instance;
  }

  /**
   * Enable MFA for the current user
   */
  async enableMFA(): Promise<MFASetupResult> {
    try {
      // Get current user
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();

      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Generate TOTP secret
      const secret = this.generateTOTPSecret();

      // Generate backup codes
      const backupCodes = this.generateBackupCodes();

      // Store MFA setup in database
      const { error: dbError } = await this.supabase.from('user_mfa').upsert({
        user_id: user.id,
        totp_secret: secret,
        backup_codes: backupCodes,
        enabled: false,
        verified: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      if (dbError) {
        return { success: false, error: 'Failed to setup MFA' };
      }

      // Generate QR code for authenticator app
      const qrCode = await this.generateQRCode(user.email!, secret);

      // Log security event
      await this.logSecurityEvent('mfa_setup_initiated', {
        userId: user.id,
        email: user.email,
      });

      return {
        success: true,
        qrCode,
        secret,
        backupCodes,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'MFA setup failed',
      };
    }
  }

  /**
   * Verify MFA setup with TOTP token
   */
  async verifyMFASetup(token: string): Promise<MFAVerificationResult> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();

      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get stored MFA data
      const { data: mfaData, error: mfaError } = await this.supabase
        .from('user_mfa')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (mfaError || !mfaData) {
        return { success: false, error: 'MFA not setup' };
      }

      // Verify TOTP token
      const isValid = this.verifyTOTPToken(token, mfaData.totp_secret);

      if (!isValid) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Enable MFA
      const { error: updateError } = await this.supabase
        .from('user_mfa')
        .update({
          enabled: true,
          verified: true,
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        return { success: false, error: 'Failed to enable MFA' };
      }

      // Log security event
      await this.logSecurityEvent('mfa_enabled', {
        userId: user.id,
        email: user.email,
      });

      toast.success('Two-factor authentication enabled successfully');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'MFA verification failed',
      };
    }
  }

  /**
   * Verify MFA during login
   */
  async verifyMFALogin(
    token: string,
    backupCode?: string
  ): Promise<MFAVerificationResult> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();

      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Get MFA data
      const { data: mfaData, error: mfaError } = await this.supabase
        .from('user_mfa')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (mfaError || !mfaData || !mfaData.enabled) {
        return { success: false, error: 'MFA not enabled' };
      }

      // Check backup code first if provided
      if (backupCode) {
        const isValidBackup = mfaData.backup_codes.includes(backupCode);

        if (isValidBackup) {
          // Remove used backup code
          const updatedBackupCodes = mfaData.backup_codes.filter(
            code => code !== backupCode
          );

          await this.supabase
            .from('user_mfa')
            .update({
              backup_codes: updatedBackupCodes,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', user.id);

          // Log security event
          await this.logSecurityEvent('mfa_backup_code_used', {
            userId: user.id,
            email: user.email,
          });

          return { success: true };
        } else {
          return { success: false, error: 'Invalid backup code' };
        }
      }

      // Verify TOTP token
      const isValid = this.verifyTOTPToken(token, mfaData.totp_secret);

      if (!isValid) {
        // Log failed attempt
        await this.logSecurityEvent('mfa_verification_failed', {
          userId: user.id,
          email: user.email,
          reason: 'invalid_totp',
        });

        return {
          success: false,
          error: 'Invalid verification code',
          requiresBackupCode: true,
        };
      }

      // Log successful verification
      await this.logSecurityEvent('mfa_verification_success', {
        userId: user.id,
        email: user.email,
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : 'MFA verification failed',
      };
    }
  }

  /**
   * Disable MFA for the current user
   */
  async disableMFA(password: string): Promise<MFAVerificationResult> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();

      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Verify password before disabling MFA
      const { error: signInError } =
        await this.supabase.auth.signInWithPassword({
          email: user.email!,
          password,
        });

      if (signInError) {
        return { success: false, error: 'Invalid password' };
      }

      // Disable MFA
      const { error: updateError } = await this.supabase
        .from('user_mfa')
        .update({
          enabled: false,
          verified: false,
          disabled_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        return { success: false, error: 'Failed to disable MFA' };
      }

      // Log security event
      await this.logSecurityEvent('mfa_disabled', {
        userId: user.id,
        email: user.email,
      });

      toast.success('Two-factor authentication disabled');

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to disable MFA',
      };
    }
  }

  /**
   * Get MFA status for the current user
   */
  async getMFAStatus(): Promise<{
    enabled: boolean;
    verified: boolean;
    backupCodesRemaining: number;
  }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();

      if (userError || !user) {
        return { enabled: false, verified: false, backupCodesRemaining: 0 };
      }

      const { data: mfaData, error: mfaError } = await this.supabase
        .from('user_mfa')
        .select('enabled, verified, backup_codes')
        .eq('user_id', user.id)
        .single();

      if (mfaError || !mfaData) {
        return { enabled: false, verified: false, backupCodesRemaining: 0 };
      }

      return {
        enabled: mfaData.enabled,
        verified: mfaData.verified,
        backupCodesRemaining: mfaData.backup_codes?.length || 0,
      };
    } catch (error) {
      return { enabled: false, verified: false, backupCodesRemaining: 0 };
    }
  }

  /**
   * Generate new backup codes
   */
  async generateNewBackupCodes(): Promise<{
    success: boolean;
    backupCodes?: string[];
    error?: string;
  }> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();

      if (userError || !user) {
        return { success: false, error: 'User not authenticated' };
      }

      const newBackupCodes = this.generateBackupCodes();

      const { error: updateError } = await this.supabase
        .from('user_mfa')
        .update({
          backup_codes: newBackupCodes,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', user.id);

      if (updateError) {
        return { success: false, error: 'Failed to generate backup codes' };
      }

      // Log security event
      await this.logSecurityEvent('mfa_backup_codes_regenerated', {
        userId: user.id,
        email: user.email,
      });

      return { success: true, backupCodes: newBackupCodes };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate backup codes',
      };
    }
  }

  // Private helper methods

  private generateTOTPSecret(): string {
    // Generate a secure random secret using otplib
    return authenticator.generateSecret();
  }

  private generateBackupCodes(): string[] {
    const codes: string[] = [];
    // Use crypto.randomBytes for secure random generation
    const crypto =
      typeof window === 'undefined' ? require('crypto') : window.crypto;

    for (let i = 0; i < 10; i++) {
      if (typeof window === 'undefined') {
        // Node.js environment (server-side)
        const randomBytes = crypto.randomBytes(6);
        const code = randomBytes.toString('hex').toUpperCase();
        codes.push(code);
      } else {
        // Browser environment (client-side)
        const array = new Uint8Array(6);
        crypto.getRandomValues(array);
        const code = Array.from(array)
          .map(b => b.toString(16).padStart(2, '0'))
          .join('')
          .toUpperCase();
        codes.push(code);
      }
    }
    return codes;
  }

  private async generateQRCode(email: string, secret: string): Promise<string> {
    // Generate QR code URL for authenticator apps
    const issuer = 'Contract Management System';
    const account = email;
    const url = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`;

    // In a real implementation, you would use a QR code library
    // For now, return the URL that can be used with external QR generators
    return url;
  }

  private verifyTOTPToken(token: string, secret: string): boolean {
    // Validate token format
    if (!token || token.length !== 6 || !/^\d{6}$/.test(token)) {
      return false;
    }

    try {
      // Use otplib to verify the TOTP token against the secret
      return authenticator.verify({ token, secret });
    } catch (error) {
      return false;
    }
  }

  private async logSecurityEvent(
    eventType: string,
    metadata: any
  ): Promise<void> {
    try {
      await this.supabase.from('security_audit_log').insert({
        event_type: eventType,
        user_id: metadata.userId,
        metadata: {
          ...metadata,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
    }
  }
}

// Export singleton instance
export const mfaService = MFAService.getInstance();
