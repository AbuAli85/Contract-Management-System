import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { RateLimiter } from './rate-limiter';
import { SecurityMonitor } from './security-monitor';
import { AuditLogger } from './audit-logger';

// ========================================
// 🛡️ PROFESSIONAL SECURITY MIDDLEWARE
// ========================================

export interface SecurityPolicy {
  authentication: {
    required: boolean;
    mfaRequired: boolean;
    allowedRoles: string[];
    sessionValidation: boolean;
  };
  rateLimit: {
    enabled: boolean;
    requests: number;
    windowMs: number;
    skipSuccessfulRequests: boolean;
  };
  geoBlocking: {
    enabled: boolean;
    allowedCountries: string[];
    blockedCountries: string[];
  };
  deviceControl: {
    enabled: boolean;
    requireTrustedDevice: boolean;
    maxDevicesPerUser: number;
  };
  ipWhitelist: {
    enabled: boolean;
    allowedIPs: string[];
    allowedCIDRs: string[];
  };
  dataProtection: {
    encryptRequest: boolean;
    encryptResponse: boolean;
    sanitizeInput: boolean;
    validateSchema: boolean;
  };
  monitoring: {
    logAllRequests: boolean;
    detectAnomalies: boolean;
    alertOnSuspicious: boolean;
    trackUserBehavior: boolean;
  };
}

export interface SecurityContext {
  requestId: string;
  timestamp: Date;
  clientIP: string;
  userAgent: string;
  geolocation?: {
    country: string;
    region: string;
    city: string;
  };
  riskScore: number;
  anomalies: string[];
  user?: {
    id: string;
    email: string;
    role: string;
    deviceId?: string;
  };
}

export interface SecurityResponse {
  allowed: boolean;
  reason?: string;
  context: SecurityContext;
  actions: string[];
}

export class ProfessionalSecurityMiddleware {
  private rateLimiter: RateLimiter;
  private securityMonitor: SecurityMonitor;
  private auditLogger: AuditLogger;

  constructor() {
    this.rateLimiter = new RateLimiter();
    this.securityMonitor = new SecurityMonitor();
    this.auditLogger = new AuditLogger();
  }

  // ========================================
  // 🔒 MAIN SECURITY HANDLER
  // ========================================

  async withSecurity<T = any>(
    handler: (
      req: NextRequest,
      context: SecurityContext
    ) => Promise<NextResponse>,
    policy: Partial<SecurityPolicy> = {}
  ) {
    return async (req: NextRequest, params?: T): Promise<NextResponse> => {
      const startTime = Date.now();
      const requestId = this.generateRequestId();

      try {
        // Step 1: Initialize security context
        const context = await this.initializeSecurityContext(req, requestId);

        // Step 2: Apply security policies
        const securityCheck = await this.applySecurity(req, context, policy);

        if (!securityCheck.allowed) {
          return this.createSecurityResponse(
            securityCheck.reason!,
            securityCheck.context,
            403
          );
        }

        // Step 3: Execute the handler
        const response = await handler(req, context);

        // Step 4: Post-process response
        await this.postProcessResponse(response, context, policy);

        // Step 5: Log successful request
        await this.auditLogger.logRequest({
          ...context,
          status: response.status,
          responseTime: Date.now() - startTime,
          success: true,
        });

        return this.enhanceResponse(response, context);
      } catch (error) {

        const errorContext = await this.initializeSecurityContext(
          req,
          requestId
        );

        await this.auditLogger.logSecurityEvent({
          ...errorContext,
          event: 'middleware_error',
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime: Date.now() - startTime,
        });

        return this.createSecurityResponse(
          'Internal security error',
          errorContext,
          500
        );
      }
    };
  }

  // ========================================
  // 🔍 SECURITY POLICY ENFORCEMENT
  // ========================================

  private async applySecurity(
    req: NextRequest,
    context: SecurityContext,
    policy: Partial<SecurityPolicy>
  ): Promise<SecurityResponse> {
    const actions: string[] = [];
    let riskScore = 0;
    const anomalies: string[] = [];

    // 1. Rate Limiting
    if (policy.rateLimit?.enabled) {
      const rateLimitResult = await this.rateLimiter.checkLimit(
        context.clientIP,
        policy.rateLimit.requests,
        policy.rateLimit.windowMs
      );

      if (!rateLimitResult.allowed) {
        actions.push('rate_limit_exceeded');
        return {
          allowed: false,
          reason: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter} seconds`,
          context: {
            ...context,
            riskScore: 1.0,
            anomalies: ['rate_limit_exceeded'],
          },
          actions,
        };
      }
    }

    // 2. Geo-blocking
    if (policy.geoBlocking?.enabled && context.geolocation) {
      const geoCheck = this.checkGeoPolicy(
        context.geolocation,
        policy.geoBlocking
      );
      if (!geoCheck.allowed) {
        actions.push('geo_blocked');
        riskScore += 1.0;
        anomalies.push('blocked_country');

        await this.auditLogger.logSecurityEvent({
          ...context,
          event: 'geo_blocking_triggered',
          country: context.geolocation.country,
        });

        return {
          allowed: false,
          reason: 'Access denied from your location',
          context: { ...context, riskScore, anomalies },
          actions,
        };
      }
    }

    // 3. IP Whitelist
    if (policy.ipWhitelist?.enabled) {
      const ipCheck = this.checkIPWhitelist(
        context.clientIP,
        policy.ipWhitelist
      );
      if (!ipCheck.allowed) {
        actions.push('ip_blocked');
        riskScore += 1.0;
        anomalies.push('blocked_ip');

        return {
          allowed: false,
          reason: 'Access denied from your IP address',
          context: { ...context, riskScore, anomalies },
          actions,
        };
      }
    }

    // 4. Authentication
    if (policy.authentication?.required) {
      const authCheck = await this.checkAuthentication(
        req,
        context,
        policy.authentication
      );
      if (!authCheck.allowed) {
        actions.push('authentication_failed');
        riskScore += 0.8;
        anomalies.push('unauthenticated');

        return {
          allowed: false,
          reason: authCheck.reason || 'Authentication required',
          context: { ...context, riskScore, anomalies },
          actions,
        };
      }

      // Update context with user info
      context.user = authCheck.user;
    }

    // 5. Device Control
    if (policy.deviceControl?.enabled && context.user) {
      const deviceCheck = await this.checkDevicePolicy(
        context.user,
        policy.deviceControl
      );
      if (!deviceCheck.allowed) {
        actions.push('device_blocked');
        riskScore += 0.6;
        anomalies.push('untrusted_device');

        return {
          allowed: false,
          reason: deviceCheck.reason || 'Device not trusted',
          context: { ...context, riskScore, anomalies },
          actions,
        };
      }
    }

    // 6. Anomaly Detection
    if (policy.monitoring?.detectAnomalies) {
      const anomalyCheck = await this.securityMonitor.detectAnomalies(context);
      riskScore += anomalyCheck.riskScore;
      anomalies.push(...anomalyCheck.anomalies);
      actions.push(...anomalyCheck.actions);

      if (anomalyCheck.riskScore > 0.8) {
        await this.auditLogger.logSecurityEvent({
          ...context,
          event: 'high_risk_request',
          riskScore: anomalyCheck.riskScore,
          anomalies: anomalyCheck.anomalies,
        });

        if (policy.monitoring?.alertOnSuspicious) {
          await this.sendSecurityAlert(context, anomalyCheck);
        }
      }
    }

    // 7. Final risk assessment
    const finalRiskScore = Math.min(riskScore, 1.0);
    if (finalRiskScore > 0.9) {
      return {
        allowed: false,
        reason: 'Request blocked due to security policy',
        context: { ...context, riskScore: finalRiskScore, anomalies },
        actions,
      };
    }

    return {
      allowed: true,
      context: { ...context, riskScore: finalRiskScore, anomalies },
      actions,
    };
  }

  // ========================================
  // 🔐 AUTHENTICATION & AUTHORIZATION
  // ========================================

  private async checkAuthentication(
    req: NextRequest,
    context: SecurityContext,
    authPolicy: any
  ): Promise<{ allowed: boolean; reason?: string; user?: any }> {
    try {
      const supabase = await createClient();
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        await this.auditLogger.logSecurityEvent({
          ...context,
          event: 'authentication_failed',
          error: error?.message || 'No user found',
        });

        return {
          allowed: false,
          reason: 'Authentication required',
        };
      }

      // Check session validity
      if (authPolicy.sessionValidation) {
        const sessionValid = await this.validateSession(user.id);
        if (!sessionValid) {
          return {
            allowed: false,
            reason: 'Session expired or invalid',
          };
        }
      }

      // Get user profile for role checking
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, status')
        .eq('id', user.id)
        .single();

      if (!profile) {
        return {
          allowed: false,
          reason: 'User profile not found',
        };
      }

      // Check user status
      if (profile.status !== 'active') {
        await this.auditLogger.logSecurityEvent({
          ...context,
          event: 'inactive_user_access_attempt',
          userId: user.id,
          status: profile.status,
        });

        return {
          allowed: false,
          reason: 'Account is not active',
        };
      }

      // Check role-based access
      if (authPolicy.allowedRoles?.length > 0) {
        if (!authPolicy.allowedRoles.includes(profile.role)) {
          await this.auditLogger.logSecurityEvent({
            ...context,
            event: 'insufficient_permissions',
            userId: user.id,
            userRole: profile.role,
            requiredRoles: authPolicy.allowedRoles,
          });

          return {
            allowed: false,
            reason: 'Insufficient permissions',
          };
        }
      }

      // Check MFA requirement
      if (authPolicy.mfaRequired) {
        const mfaStatus = await this.checkMFAStatus(user.id);
        if (!mfaStatus.verified) {
          return {
            allowed: false,
            reason: 'Multi-factor authentication required',
          };
        }
      }

      return {
        allowed: true,
        user: {
          id: user.id,
          email: user.email!,
          role: profile.role,
        },
      };
    } catch (error) {
      return {
        allowed: false,
        reason: 'Authentication system error',
      };
    }
  }

  // ========================================
  // 🌍 GEO & IP CONTROL
  // ========================================

  private checkGeoPolicy(
    geolocation: { country: string; region: string; city: string },
    geoPolicy: any
  ): { allowed: boolean; reason?: string } {
    // Check blocked countries first
    if (geoPolicy.blockedCountries?.includes(geolocation.country)) {
      return {
        allowed: false,
        reason: `Access blocked from ${geolocation.country}`,
      };
    }

    // Check allowed countries
    if (geoPolicy.allowedCountries?.length > 0) {
      if (!geoPolicy.allowedCountries.includes(geolocation.country)) {
        return {
          allowed: false,
          reason: `Access not allowed from ${geolocation.country}`,
        };
      }
    }

    return { allowed: true };
  }

  private checkIPWhitelist(
    clientIP: string,
    ipPolicy: any
  ): { allowed: boolean; reason?: string } {
    // Check exact IP matches
    if (ipPolicy.allowedIPs?.includes(clientIP)) {
      return { allowed: true };
    }

    // Check CIDR ranges
    if (ipPolicy.allowedCIDRs?.length > 0) {
      for (const cidr of ipPolicy.allowedCIDRs) {
        if (this.isIPInCIDR(clientIP, cidr)) {
          return { allowed: true };
        }
      }
    }

    // If whitelist is configured but IP not found
    if (ipPolicy.allowedIPs?.length > 0 || ipPolicy.allowedCIDRs?.length > 0) {
      return {
        allowed: false,
        reason: 'IP address not in whitelist',
      };
    }

    return { allowed: true };
  }

  // ========================================
  // 🔧 UTILITY METHODS
  // ========================================

  private async initializeSecurityContext(
    req: NextRequest,
    requestId: string
  ): Promise<SecurityContext> {
    const clientIP = this.getClientIP(req);
    const userAgent = req.headers.get('user-agent') || 'unknown';
    const geolocation = await this.getGeolocation(clientIP);

    return {
      requestId,
      timestamp: new Date(),
      clientIP,
      userAgent,
      geolocation,
      riskScore: 0,
      anomalies: [],
    };
  }

  private getClientIP(req: NextRequest): string {
    // Try various headers for getting real IP
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const cloudflareIP = req.headers.get('cf-connecting-ip');

    if (cloudflareIP) return cloudflareIP;
    if (realIP) return realIP;
    if (forwardedFor) return forwardedFor.split(',')[0].trim();

    return req.ip || 'unknown';
  }

  private async getGeolocation(
    ip: string
  ): Promise<{ country: string; region: string; city: string } | undefined> {
    try {
      // Use a geolocation API service
      const response = await fetch(`https://ipapi.co/${ip}/json/`);
      const data = await response.json();

      if (data.country_name) {
        return {
          country: data.country_name,
          region: data.region,
          city: data.city,
        };
      }
    } catch (error) {
    }

    return undefined;
  }

  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private isIPInCIDR(ip: string, cidr: string): boolean {
    // Simple CIDR check implementation
    const [network, prefixLength] = cidr.split('/');
    const networkParts = network.split('.').map(Number);
    const ipParts = ip.split('.').map(Number);

    const prefix = parseInt(prefixLength, 10);
    const mask = (0xffffffff << (32 - prefix)) >>> 0;

    const networkInt =
      (networkParts[0] << 24) |
      (networkParts[1] << 16) |
      (networkParts[2] << 8) |
      networkParts[3];
    const ipInt =
      (ipParts[0] << 24) | (ipParts[1] << 16) | (ipParts[2] << 8) | ipParts[3];

    return (networkInt & mask) === (ipInt & mask);
  }

  private async validateSession(userId: string): Promise<boolean> {
    try {
      const supabase = await createClient();
      const { data: session } = await supabase
        .from('user_sessions')
        .select('expires_at, status')
        .eq('user_id', userId)
        .eq('status', 'active')
        .single();

      if (!session) return false;

      return new Date(session.expires_at) > new Date();
    } catch (error) {
      return false;
    }
  }

  private async checkMFAStatus(
    userId: string
  ): Promise<{ verified: boolean; required: boolean }> {
    try {
      const supabase = await createClient();
      const { data: mfaStatus } = await supabase
        .from('user_mfa')
        .select('enabled, verified_at')
        .eq('user_id', userId)
        .single();

      if (!mfaStatus) {
        return { verified: false, required: false };
      }

      return {
        verified: mfaStatus.enabled && mfaStatus.verified_at !== null,
        required: mfaStatus.enabled,
      };
    } catch (error) {
      return { verified: false, required: false };
    }
  }

  private async checkDevicePolicy(
    user: any,
    devicePolicy: any
  ): Promise<{ allowed: boolean; reason?: string }> {
    try {
      const supabase = await createClient();

      // Get user's devices
      const { data: devices } = await supabase
        .from('user_devices')
        .select('id, trusted, last_used')
        .eq('user_id', user.id)
        .eq('status', 'active');

      if (!devices) {
        return { allowed: !devicePolicy.requireTrustedDevice };
      }

      // Check max devices limit
      if (devices.length > devicePolicy.maxDevicesPerUser) {
        return {
          allowed: false,
          reason: `Maximum ${devicePolicy.maxDevicesPerUser} devices allowed`,
        };
      }

      // Check if current device is trusted (if required)
      if (devicePolicy.requireTrustedDevice) {
        const currentDeviceFingerprint = this.getCurrentDeviceFingerprint();
        const trustedDevice = devices.find(
          d => d.trusted && d.fingerprint === currentDeviceFingerprint
        );

        if (!trustedDevice) {
          return {
            allowed: false,
            reason: 'Device must be trusted for this action',
          };
        }
      }

      return { allowed: true };
    } catch (error) {
      return { allowed: false, reason: 'Device validation failed' };
    }
  }

  private getCurrentDeviceFingerprint(): string {
    // Generate device fingerprint from browser characteristics
    if (typeof window === 'undefined') return 'server';

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Device fingerprint', 2, 2);

    return btoa(
      [
        navigator.userAgent,
        navigator.language,
        `${screen.width}x${screen.height}`,
        Intl.DateTimeFormat().resolvedOptions().timeZone,
        canvas.toDataURL(),
      ].join('|')
    ).substring(0, 32);
  }

  private async postProcessResponse(
    response: NextResponse,
    context: SecurityContext,
    policy: Partial<SecurityPolicy>
  ): Promise<void> {
    // Encrypt response if required
    if (policy.dataProtection?.encryptResponse) {
      // TODO: Implement response encryption
    }

    // Remove sensitive headers
    response.headers.delete('x-powered-by');
    response.headers.delete('server');
  }

  private enhanceResponse(
    response: NextResponse,
    context: SecurityContext
  ): NextResponse {
    // Add security headers
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'X-Request-ID': context.requestId,
      'X-Response-Time': (Date.now() - context.timestamp.getTime()).toString(),
    };

    Object.entries(securityHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });

    return response;
  }

  private createSecurityResponse(
    reason: string,
    context: SecurityContext,
    status: number
  ): NextResponse {
    const response = NextResponse.json(
      {
        error: reason,
        requestId: context.requestId,
        timestamp: context.timestamp,
      },
      { status }
    );

    return this.enhanceResponse(response, context);
  }

  private async sendSecurityAlert(
    context: SecurityContext,
    anomalyCheck: any
  ): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase.from('security_alerts').insert({
        ip_address: context.ipAddress,
        user_id: context.userId,
        risk_score: anomalyCheck.riskScore,
        anomalies: anomalyCheck.anomalies,
        actions: anomalyCheck.actions,
        created_at: new Date().toISOString(),
      });
    } catch {
      // Non-critical: security alert logging failure
    }
  }
}

// ========================================
// 🛠️ HELPER CLASSES
// ========================================

class RateLimiter {
  private cache = new Map<string, { count: number; resetTime: number }>();

  async checkLimit(
    key: string,
    maxRequests: number,
    windowMs: number
  ): Promise<{
    allowed: boolean;
    retryAfter?: number;
    remaining?: number;
  }> {
    const now = Date.now();
    const windowStart = now - windowMs;

    const current = this.cache.get(key);

    if (!current || current.resetTime < now) {
      this.cache.set(key, { count: 1, resetTime: now + windowMs });
      return { allowed: true, remaining: maxRequests - 1 };
    }

    if (current.count >= maxRequests) {
      return {
        allowed: false,
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
      };
    }

    current.count++;
    return { allowed: true, remaining: maxRequests - current.count };
  }
}

class SecurityMonitor {
  async detectAnomalies(context: SecurityContext): Promise<{
    riskScore: number;
    anomalies: string[];
    actions: string[];
  }> {
    const anomalies: string[] = [];
    const actions: string[] = [];
    let riskScore = 0;

    // Check for suspicious user agent
    if (
      context.userAgent.includes('bot') ||
      context.userAgent.includes('crawler')
    ) {
      anomalies.push('bot_detected');
      riskScore += 0.3;
      actions.push('require_captcha');
    }

    // Check for unusual request patterns
    const requestHistory = await this.getRequestHistory(context.clientIP);
    if (requestHistory.length > 100) {
      anomalies.push('high_request_volume');
      riskScore += 0.4;
      actions.push('increase_monitoring');
    }

    // Check for tor/proxy usage
    if (await this.isTorOrProxy(context.clientIP)) {
      anomalies.push('proxy_detected');
      riskScore += 0.5;
      actions.push('require_additional_verification');
    }

    return { riskScore, anomalies, actions };
  }

  private async getRequestHistory(ip: string): Promise<any[]> {
    try {
      const supabase = await createClient();
      const since = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // Last hour
      const { data } = await supabase
        .from('audit_logs')
        .select('created_at, action')
        .eq('ip_address', ip)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(100);
      return data || [];
    } catch {
      return [];
    }
  }

  private async isTorOrProxy(_ip: string): Promise<boolean> {
    // Tor/proxy detection requires an external IP intelligence service
    return false;
  }
}

class AuditLogger {
  async logRequest(data: any): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase.from('security_request_log').insert({
        request_id: data.requestId,
        timestamp: data.timestamp,
        client_ip: data.clientIP,
        user_agent: data.userAgent,
        user_id: data.user?.id,
        status: data.status,
        response_time: data.responseTime,
        risk_score: data.riskScore,
        anomalies: data.anomalies,
      });
    } catch (error) {
    }
  }

  async logSecurityEvent(data: any): Promise<void> {
    try {
      const supabase = await createClient();
      await supabase.from('security_event_log').insert({
        request_id: data.requestId,
        timestamp: data.timestamp,
        event: data.event,
        client_ip: data.clientIP,
        user_agent: data.userAgent,
        user_id: data.user?.id,
        error: data.error,
        data,
      });
    } catch (error) {
    }
  }
}

// ========================================
// 🚀 EXPORTS
// ========================================

export const professionalSecurityMiddleware =
  new ProfessionalSecurityMiddleware();

// Security policy presets
export const SecurityPolicies = {
  PUBLIC: {
    authentication: {
      required: false,
      mfaRequired: false,
      allowedRoles: [],
      sessionValidation: false,
    },
    rateLimit: { enabled: true, requests: 100, windowMs: 60000 },
    monitoring: { logAllRequests: true, detectAnomalies: true },
  },
  PROTECTED: {
    authentication: {
      required: true,
      mfaRequired: false,
      allowedRoles: [],
      sessionValidation: true,
    },
    rateLimit: { enabled: true, requests: 60, windowMs: 60000 },
    monitoring: {
      logAllRequests: true,
      detectAnomalies: true,
      alertOnSuspicious: true,
    },
  },
  ADMIN: {
    authentication: {
      required: true,
      mfaRequired: true,
      allowedRoles: ['admin', 'super_admin'],
      sessionValidation: true,
    },
    rateLimit: { enabled: true, requests: 30, windowMs: 60000 },
    deviceControl: { enabled: true, requireTrustedDevice: true },
    monitoring: {
      logAllRequests: true,
      detectAnomalies: true,
      alertOnSuspicious: true,
      trackUserBehavior: true,
    },
  },
  HIGH_SECURITY: {
    authentication: {
      required: true,
      mfaRequired: true,
      allowedRoles: [],
      sessionValidation: true,
    },
    rateLimit: { enabled: true, requests: 10, windowMs: 60000 },
    geoBlocking: { enabled: true, allowedCountries: ['US', 'CA', 'GB'] },
    deviceControl: {
      enabled: true,
      requireTrustedDevice: true,
      maxDevicesPerUser: 3,
    },
    dataProtection: {
      encryptRequest: true,
      encryptResponse: true,
      sanitizeInput: true,
      validateSchema: true,
    },
    monitoring: {
      logAllRequests: true,
      detectAnomalies: true,
      alertOnSuspicious: true,
      trackUserBehavior: true,
    },
  },
} as const;
