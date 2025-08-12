'use client';

import { User, Session, AuthError } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

// ========================================
// 🏢 PROFESSIONAL AUTHENTICATION SERVICE
// ========================================

export interface SecurityConfig {
  enableMFA: boolean;
  enableBiometric: boolean;
  sessionTimeout: number;
  maxConcurrentSessions: number;
  enableDeviceFingerprinting: boolean;
  passwordPolicy: PasswordPolicy;
  enableLocationTracking: boolean;
  enableAuditLogging: boolean;
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  preventReuse: number;
  maxAge: number;
}

export interface DeviceInfo {
  id: string;
  name: string;
  platform: string;
  browser: string;
  location?: GeolocationCoordinates;
  fingerprint: string;
  trusted: boolean;
  lastUsed: Date;
}

export interface SecurityContext {
  riskScore: number;
  location: string;
  device: DeviceInfo;
  anomalies: string[];
  requiresAdditionalAuth: boolean;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  mounted: boolean;
  error: string | null;
  securityContext: SecurityContext | null;
  mfaRequired: boolean;
  deviceTrusted: boolean;
  sessionExpiry: Date | null;
}

type AuthListener = (state: AuthState) => void;

export class ProfessionalAuthService {
  private static instance: ProfessionalAuthService;
  private state: AuthState = {
    user: null,
    session: null,
    loading: true,
    mounted: false,
    error: null,
    securityContext: null,
    mfaRequired: false,
    deviceTrusted: false,
    sessionExpiry: null,
  };
  private listeners: AuthListener[] = [];
  private refreshTimer: NodeJS.Timeout | null = null;
  private securityConfig: SecurityConfig;
  private auditTrail: any[] = [];

  private constructor() {
    this.securityConfig = this.getDefaultSecurityConfig();
    this.initializeSecurityMonitoring();
  }

  static getInstance(): ProfessionalAuthService {
    if (!ProfessionalAuthService.instance) {
      ProfessionalAuthService.instance = new ProfessionalAuthService();
    }
    return ProfessionalAuthService.instance;
  }

  private getDefaultSecurityConfig(): SecurityConfig {
    return {
      enableMFA: true,
      enableBiometric: true,
      sessionTimeout: 3600000, // 1 hour
      maxConcurrentSessions: 3,
      enableDeviceFingerprinting: true,
      passwordPolicy: {
        minLength: 12,
        requireUppercase: true,
        requireLowercase: true,
        requireNumbers: true,
        requireSpecialChars: true,
        preventReuse: 5,
        maxAge: 7776000000, // 90 days
      },
      enableLocationTracking: true,
      enableAuditLogging: true,
    };
  }

  // ========================================
  // 🔐 ENHANCED AUTHENTICATION METHODS
  // ========================================

  async signInWithCredentials(
    email: string,
    password: string,
    options?: {
      rememberDevice?: boolean;
      requireMFA?: boolean;
      deviceName?: string;
    }
  ): Promise<{
    success: boolean;
    error?: string;
    requiresMFA?: boolean;
    user?: User;
    securityContext?: SecurityContext;
  }> {
    try {
      this.updateState({ loading: true, error: null });

      // Step 1: Validate password policy
      const passwordValid = await this.validatePassword(password);
      if (!passwordValid.valid) {
        return { success: false, error: passwordValid.error };
      }

      // Step 2: Check for suspicious activity
      const securityContext = await this.evaluateSecurityContext(email);

      if (securityContext.riskScore > 0.8) {
        await this.logSecurityEvent('high_risk_login_attempt', {
          email,
          riskScore: securityContext.riskScore,
        });
        return {
          success: false,
          error: 'Account temporarily locked due to suspicious activity',
        };
      }

      // Step 3: Attempt authentication
      const supabase = createClient();
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        await this.logSecurityEvent('login_failed', {
          email,
          error: error.message,
        });
        return { success: false, error: this.formatAuthError(error) };
      }

      if (!data.user) {
        return { success: false, error: 'Authentication failed' };
      }

      // Step 4: Check MFA requirement
      const mfaRequired = await this.checkMFARequirement(data.user.id);
      if (mfaRequired && !options?.requireMFA) {
        this.updateState({ mfaRequired: true });
        return {
          success: false,
          requiresMFA: true,
          user: data.user,
          securityContext,
        };
      }

      // Step 5: Device management
      const deviceInfo = await this.registerDevice(data.user.id, {
        trusted: options?.rememberDevice || false,
        name: options?.deviceName || this.getDeviceName(),
      });

      // Step 6: Set up session
      await this.setupSecureSession(data.session!, securityContext, deviceInfo);

      await this.logSecurityEvent('login_successful', {
        userId: data.user.id,
        email: data.user.email,
        deviceId: deviceInfo.id,
      });

      return {
        success: true,
        user: data.user,
        securityContext,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      await this.logSecurityEvent('login_error', { error: errorMessage });
      return { success: false, error: errorMessage };
    } finally {
      this.updateState({ loading: false });
    }
  }

  async signInWithMFA(
    token: string,
    backupCode?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.state.user) {
        return { success: false, error: 'No user session found' };
      }

      const supabase = createClient();

      // Verify MFA token or backup code
      const isValidToken = await this.verifyMFAToken(this.state.user.id, token);
      const isValidBackupCode = backupCode
        ? await this.verifyBackupCode(this.state.user.id, backupCode)
        : false;

      if (!isValidToken && !isValidBackupCode) {
        await this.logSecurityEvent('mfa_verification_failed', {
          userId: this.state.user.id,
        });
        return { success: false, error: 'Invalid verification code' };
      }

      // If backup code was used, generate new ones
      if (isValidBackupCode) {
        await this.generateNewBackupCodes(this.state.user.id);
      }

      this.updateState({ mfaRequired: false });

      await this.logSecurityEvent('mfa_verification_successful', {
        userId: this.state.user.id,
      });
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'MFA verification failed';
      return { success: false, error: errorMessage };
    }
  }

  async signInWithBiometric(): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.securityConfig.enableBiometric) {
        return {
          success: false,
          error: 'Biometric authentication is disabled',
        };
      }

      // Check if WebAuthn is supported
      if (!window.PublicKeyCredential) {
        return {
          success: false,
          error: 'Biometric authentication not supported',
        };
      }

      const supabase = createClient();

      // Get stored credentials for the user
      const credentials = await this.getStoredCredentials();
      if (!credentials) {
        return { success: false, error: 'No biometric credentials found' };
      }

      // Perform WebAuthn authentication
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: new Uint8Array(32),
          allowCredentials: credentials,
          userVerification: 'required',
        },
      });

      if (!assertion) {
        return { success: false, error: 'Biometric authentication failed' };
      }

      // Verify the assertion with your backend
      const verified = await this.verifyBiometricAssertion(assertion);
      if (!verified) {
        return { success: false, error: 'Biometric verification failed' };
      }

      await this.logSecurityEvent('biometric_login_successful', {
        method: 'webauthn',
      });
      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Biometric authentication failed';
      await this.logSecurityEvent('biometric_login_failed', {
        error: errorMessage,
      });
      return { success: false, error: errorMessage };
    }
  }

  // ========================================
  // 🛡️ SECURITY MONITORING & ANALYTICS
  // ========================================

  private async evaluateSecurityContext(
    email: string
  ): Promise<SecurityContext> {
    const deviceInfo = await this.getDeviceFingerprint();
    const location = await this.getCurrentLocation();
    const anomalies: string[] = [];
    let riskScore = 0;

    // Check for unusual login patterns
    const loginHistory = await this.getLoginHistory(email);

    // Location-based risk assessment
    if (location && loginHistory.length > 0) {
      const lastLocation = loginHistory[0].location;
      const distance = this.calculateDistance(location, lastLocation);

      if (distance > 1000) {
        // More than 1000km from last login
        anomalies.push('unusual_location');
        riskScore += 0.3;
      }
    }

    // Time-based risk assessment
    const lastLogin = loginHistory[0]?.timestamp;
    if (lastLogin) {
      const timeDiff = Date.now() - lastLogin.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff < 1) {
        // Login within 1 hour
        const prevLocation = loginHistory[0].location;
        if (location && this.calculateDistance(location, prevLocation) > 100) {
          anomalies.push('impossible_travel');
          riskScore += 0.5;
        }
      }
    }

    // Device-based risk assessment
    if (!deviceInfo.trusted) {
      anomalies.push('new_device');
      riskScore += 0.2;
    }

    // Failed attempts check
    const failedAttempts = await this.getFailedLoginAttempts(email, 3600000); // Last hour
    if (failedAttempts > 3) {
      anomalies.push('multiple_failed_attempts');
      riskScore += 0.4;
    }

    return {
      riskScore: Math.min(riskScore, 1.0),
      location: location
        ? `${location.latitude},${location.longitude}`
        : 'unknown',
      device: deviceInfo,
      anomalies,
      requiresAdditionalAuth: riskScore > 0.5,
    };
  }

  private async getDeviceFingerprint(): Promise<DeviceInfo> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);

    const fingerprint = [
      navigator.userAgent,
      navigator.language,
      `${screen.width}x${screen.height}`,
      Intl.DateTimeFormat().resolvedOptions().timeZone,
      canvas.toDataURL(),
    ].join('|');

    const hash = await this.hashString(fingerprint);

    return {
      id: hash.substring(0, 16),
      name: this.getDeviceName(),
      platform: navigator.platform,
      browser: navigator.userAgent.split(' ')[0],
      fingerprint: hash,
      trusted: await this.isDeviceTrusted(hash),
      lastUsed: new Date(),
    };
  }

  private async getCurrentLocation(): Promise<GeolocationCoordinates | null> {
    if (!this.securityConfig.enableLocationTracking) return null;

    return new Promise(resolve => {
      if (!navigator.geolocation) {
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        position => resolve(position.coords),
        () => resolve(null),
        { timeout: 5000, enableHighAccuracy: false }
      );
    });
  }

  // ========================================
  // 🔑 MFA IMPLEMENTATION
  // ========================================

  async enableMFA(): Promise<{
    success: boolean;
    qrCode?: string;
    backupCodes?: string[];
    error?: string;
  }> {
    try {
      if (!this.state.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const secret = this.generateTOTPSecret();
      const qrCode = await this.generateQRCode(this.state.user.email!, secret);
      const backupCodes = this.generateBackupCodes();

      // Store the secret temporarily (will be confirmed when user verifies)
      await this.storePendingMFASecret(this.state.user.id, secret);
      await this.storeBackupCodes(this.state.user.id, backupCodes);

      await this.logSecurityEvent('mfa_setup_initiated', {
        userId: this.state.user.id,
      });

      return {
        success: true,
        qrCode,
        backupCodes,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'MFA setup failed';
      return { success: false, error: errorMessage };
    }
  }

  async verifyMFASetup(
    token: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.state.user) {
        return { success: false, error: 'User not authenticated' };
      }

      const secret = await this.getPendingMFASecret(this.state.user.id);
      if (!secret) {
        return { success: false, error: 'No pending MFA setup found' };
      }

      const isValid = this.verifyTOTPToken(secret, token);
      if (!isValid) {
        return { success: false, error: 'Invalid verification code' };
      }

      // Confirm MFA setup
      await this.confirmMFASetup(this.state.user.id, secret);
      await this.clearPendingMFASecret(this.state.user.id);

      await this.logSecurityEvent('mfa_setup_completed', {
        userId: this.state.user.id,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'MFA verification failed';
      return { success: false, error: errorMessage };
    }
  }

  async disableMFA(
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!this.state.user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Verify password before disabling MFA
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: this.state.user.email!,
        password,
      });

      if (error) {
        return { success: false, error: 'Invalid password' };
      }

      await this.removeMFASetup(this.state.user.id);
      await this.logSecurityEvent('mfa_disabled', {
        userId: this.state.user.id,
      });

      return { success: true };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to disable MFA';
      return { success: false, error: errorMessage };
    }
  }

  // ========================================
  // 🔒 SESSION MANAGEMENT
  // ========================================

  private async setupSecureSession(
    session: Session,
    securityContext: SecurityContext,
    deviceInfo: DeviceInfo
  ): Promise<void> {
    // Set session expiry based on security context
    const expiryTime = this.calculateSessionExpiry(securityContext);

    this.updateState({
      session,
      user: session.user,
      securityContext,
      deviceTrusted: deviceInfo.trusted,
      sessionExpiry: new Date(expiryTime),
      loading: false,
      mounted: true,
    });

    // Set up automatic session refresh
    this.setupSessionRefresh(session, expiryTime);

    // Monitor session for security
    this.startSessionMonitoring();
  }

  private calculateSessionExpiry(securityContext: SecurityContext): number {
    let timeout = this.securityConfig.sessionTimeout;

    // Reduce session timeout for high-risk contexts
    if (securityContext.riskScore > 0.5) {
      timeout = Math.floor(timeout * 0.5); // 50% reduction
    }

    if (!securityContext.device.trusted) {
      timeout = Math.floor(timeout * 0.75); // 25% reduction
    }

    return Date.now() + timeout;
  }

  private setupSessionRefresh(session: Session, expiryTime: number): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
    }

    // Refresh 5 minutes before expiry
    const refreshTime = expiryTime - Date.now() - 5 * 60 * 1000;

    this.refreshTimer = setTimeout(
      async () => {
        await this.refreshSession();
      },
      Math.max(refreshTime, 60000)
    ); // At least 1 minute
  }

  private startSessionMonitoring(): void {
    // Monitor for suspicious activity during session
    setInterval(async () => {
      if (!this.state.session) return;

      const currentContext = await this.evaluateSecurityContext(
        this.state.user?.email || ''
      );

      if (currentContext.riskScore > 0.8) {
        await this.terminateSession('high_risk_activity_detected');
      }
    }, 60000); // Check every minute
  }

  async terminateSession(reason: string = 'user_logout'): Promise<void> {
    try {
      if (this.refreshTimer) {
        clearTimeout(this.refreshTimer);
        this.refreshTimer = null;
      }

      const supabase = createClient();
      await supabase.auth.signOut();

      await this.logSecurityEvent('session_terminated', {
        reason,
        userId: this.state.user?.id,
      });

      this.updateState({
        user: null,
        session: null,
        securityContext: null,
        mfaRequired: false,
        deviceTrusted: false,
        sessionExpiry: null,
      });
    } catch (error) {
      console.error('Error terminating session:', error);
    }
  }

  // ========================================
  // 🔧 UTILITY METHODS
  // ========================================

  private async validatePassword(
    password: string
  ): Promise<{ valid: boolean; error?: string }> {
    const policy = this.securityConfig.passwordPolicy;

    if (password.length < policy.minLength) {
      return {
        valid: false,
        error: `Password must be at least ${policy.minLength} characters long`,
      };
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one uppercase letter',
      };
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one lowercase letter',
      };
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      return {
        valid: false,
        error: 'Password must contain at least one number',
      };
    }

    if (
      policy.requireSpecialChars &&
      !/[!@#$%^&*(),.?\":{}|<>]/.test(password)
    ) {
      return {
        valid: false,
        error: 'Password must contain at least one special character',
      };
    }

    return { valid: true };
  }

  private formatAuthError(error: AuthError): string {
    const errorMap: { [key: string]: string } = {
      invalid_credentials: 'Invalid email or password',
      email_not_confirmed: 'Please verify your email address',
      too_many_requests: 'Too many login attempts. Please try again later',
      signup_disabled: 'Account registration is currently disabled',
      weak_password: 'Password is too weak. Please choose a stronger password',
    };

    return errorMap[error.message] || error.message || 'Authentication failed';
  }

  private getDeviceName(): string {
    const platform = navigator.platform;
    const userAgent = navigator.userAgent;

    if (userAgent.includes('Mobile')) return `${platform} Mobile`;
    if (userAgent.includes('Tablet')) return `${platform} Tablet`;
    return `${platform} Desktop`;
  }

  private calculateDistance(
    coord1: GeolocationCoordinates,
    coord2: GeolocationCoordinates
  ): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.deg2rad(coord2.latitude - coord1.latitude);
    const dLon = this.deg2rad(coord2.longitude - coord1.longitude);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(coord1.latitude)) *
        Math.cos(this.deg2rad(coord2.latitude)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hash))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  // ========================================
  // 📊 AUDIT & LOGGING
  // ========================================

  private async logSecurityEvent(event: string, data: any = {}): Promise<void> {
    if (!this.securityConfig.enableAuditLogging) return;

    const logEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      event,
      data,
      userAgent: navigator.userAgent,
      ip: await this.getUserIP(),
      sessionId: this.state.session?.access_token?.substring(0, 10),
    };

    this.auditTrail.push(logEntry);

    // Store in database
    try {
      const supabase = createClient();
      await supabase.from('security_audit_log').insert(logEntry);
    } catch (error) {
      console.error('Failed to log security event:', error);
    }
  }

  private async getUserIP(): Promise<string> {
    try {
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      return data.ip;
    } catch (error) {
      return 'unknown';
    }
  }

  // ========================================
  // 🔄 STATE MANAGEMENT
  // ========================================

  private updateState(updates: Partial<AuthState>): void {
    this.state = { ...this.state, ...updates };
    this.notifyListeners();
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  subscribe(listener: AuthListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  getState(): AuthState {
    return { ...this.state };
  }

  // ========================================
  // 🚀 INITIALIZATION
  // ========================================

  private initializeSecurityMonitoring(): void {
    // Initialize security monitoring
    if (typeof window !== 'undefined') {
      this.setupSecurityEventListeners();
    }
  }

  private setupSecurityEventListeners(): void {
    // Monitor for suspicious activities
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.logSecurityEvent('tab_hidden');
      } else {
        this.logSecurityEvent('tab_visible');
      }
    });

    // Monitor for developer tools
    const devtools = { open: false, orientation: null };
    const threshold = 160;

    setInterval(() => {
      if (
        window.outerHeight - window.innerHeight > threshold ||
        window.outerWidth - window.innerWidth > threshold
      ) {
        if (!devtools.open) {
          devtools.open = true;
          this.logSecurityEvent('devtools_opened');
        }
      } else {
        if (devtools.open) {
          devtools.open = false;
          this.logSecurityEvent('devtools_closed');
        }
      }
    }, 500);
  }

  // ========================================
  // 🔮 PLACEHOLDER METHODS (To be implemented)
  // ========================================

  private async checkMFARequirement(userId: string): Promise<boolean> {
    // TODO: Implement MFA requirement check
    return false;
  }

  private async registerDevice(
    userId: string,
    options: any
  ): Promise<DeviceInfo> {
    // TODO: Implement device registration
    return await this.getDeviceFingerprint();
  }

  private async verifyMFAToken(
    userId: string,
    token: string
  ): Promise<boolean> {
    // TODO: Implement TOTP verification
    return false;
  }

  private async verifyBackupCode(
    userId: string,
    code: string
  ): Promise<boolean> {
    // TODO: Implement backup code verification
    return false;
  }

  private async getLoginHistory(email: string): Promise<any[]> {
    // TODO: Implement login history retrieval
    return [];
  }

  private async getFailedLoginAttempts(
    email: string,
    timeWindow: number
  ): Promise<number> {
    // TODO: Implement failed attempts counting
    return 0;
  }

  private async isDeviceTrusted(fingerprint: string): Promise<boolean> {
    // TODO: Implement device trust checking
    return false;
  }

  private generateTOTPSecret(): string {
    // TODO: Implement TOTP secret generation
    return 'placeholder-secret';
  }

  private async generateQRCode(email: string, secret: string): Promise<string> {
    // TODO: Implement QR code generation
    return 'data:image/png;base64,placeholder';
  }

  private generateBackupCodes(): string[] {
    // TODO: Implement backup code generation
    return Array.from({ length: 10 }, () =>
      Math.random().toString(36).substring(2, 10).toUpperCase()
    );
  }

  private async storePendingMFASecret(
    userId: string,
    secret: string
  ): Promise<void> {
    // TODO: Implement pending MFA secret storage
  }

  private async storeBackupCodes(
    userId: string,
    codes: string[]
  ): Promise<void> {
    // TODO: Implement backup codes storage
  }

  private async getPendingMFASecret(userId: string): Promise<string | null> {
    // TODO: Implement pending MFA secret retrieval
    return null;
  }

  private verifyTOTPToken(secret: string, token: string): boolean {
    // TODO: Implement TOTP token verification
    return false;
  }

  private async confirmMFASetup(userId: string, secret: string): Promise<void> {
    // TODO: Implement MFA setup confirmation
  }

  private async clearPendingMFASecret(userId: string): Promise<void> {
    // TODO: Implement pending secret cleanup
  }

  private async removeMFASetup(userId: string): Promise<void> {
    // TODO: Implement MFA removal
  }

  private async generateNewBackupCodes(userId: string): Promise<void> {
    // TODO: Implement new backup codes generation
  }

  private async getStoredCredentials(): Promise<any> {
    // TODO: Implement WebAuthn credentials retrieval
    return null;
  }

  private async verifyBiometricAssertion(assertion: any): Promise<boolean> {
    // TODO: Implement biometric assertion verification
    return false;
  }

  private async refreshSession(): Promise<void> {
    // TODO: Implement session refresh logic
    try {
      const supabase = createClient();
      const { data, error } = await supabase.auth.refreshSession();

      if (error) {
        await this.terminateSession('session_refresh_failed');
        return;
      }

      if (data.session) {
        this.updateState({
          session: data.session,
          user: data.session.user,
          sessionExpiry: new Date(
            Date.now() + this.securityConfig.sessionTimeout
          ),
        });

        this.setupSessionRefresh(
          data.session,
          Date.now() + this.securityConfig.sessionTimeout
        );
      }
    } catch (error) {
      await this.terminateSession('session_refresh_error');
    }
  }
}
