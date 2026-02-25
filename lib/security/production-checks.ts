/**
 * Production Security Checks
 *
 * This module provides runtime security checks to ensure that
 * development-only features are disabled in production environments.
 */

export interface SecurityCheckResult {
  passed: boolean;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
}

export interface SecurityCheckReport {
  allPassed: boolean;
  checks: SecurityCheckResult[];
  criticalIssues: number;
  errors: number;
  warnings: number;
}

/**
 * Check if test accounts are disabled in production
 */
export function checkTestAccountsDisabled(): SecurityCheckResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const testAccountsEnabled =
    process.env.NEXT_PUBLIC_ENABLE_TEST_ACCOUNTS === 'true';

  if (isProduction && testAccountsEnabled) {
    return {
      passed: false,
      message:
        'CRITICAL: Test accounts are enabled in production environment. This is a severe security risk.',
      severity: 'critical',
    };
  }

  if (isProduction && !testAccountsEnabled) {
    return {
      passed: true,
      message: 'Test accounts are properly disabled in production.',
      severity: 'info',
    };
  }

  return {
    passed: true,
    message: 'Test accounts check skipped (development environment).',
    severity: 'info',
  };
}

/**
 * Check if debug mode is disabled in production
 */
export function checkDebugModeDisabled(): SecurityCheckResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const debugEnabled = process.env.DEBUG === 'true';
  const debugAuth = process.env.DEBUG_AUTH === 'true';
  const debugRBAC = process.env.DEBUG_RBAC === 'true';
  const debugAPI = process.env.DEBUG_API === 'true';

  if (isProduction && (debugEnabled || debugAuth || debugRBAC || debugAPI)) {
    return {
      passed: false,
      message:
        'ERROR: Debug mode is enabled in production. This can leak sensitive information.',
      severity: 'error',
    };
  }

  return {
    passed: true,
    message: 'Debug mode is properly disabled in production.',
    severity: 'info',
  };
}

/**
 * Check if HTTPS is enforced
 */
export function checkHTTPSEnforced(): SecurityCheckResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';

  if (isProduction && !appUrl.startsWith('https://')) {
    return {
      passed: false,
      message:
        'ERROR: HTTPS is not enforced. NEXT_PUBLIC_APP_URL should start with https:// in production.',
      severity: 'error',
    };
  }

  return {
    passed: true,
    message: 'HTTPS is properly enforced.',
    severity: 'info',
  };
}

/**
 * Check if rate limiting is configured
 */
export function checkRateLimitingConfigured(): SecurityCheckResult {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL;
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!upstashUrl || !upstashToken) {
    return {
      passed: false,
      message:
        'WARNING: Upstash Redis is not configured. Rate limiting will use in-memory storage, which does not work in distributed environments.',
      severity: 'warning',
    };
  }

  return {
    passed: true,
    message: 'Rate limiting is properly configured with Upstash Redis.',
    severity: 'info',
  };
}

/**
 * Check if CORS is properly configured
 */
export function checkCORSConfiguration(): SecurityCheckResult {
  const isProduction = process.env.NODE_ENV === 'production';
  const allowedOrigins = process.env.ALLOWED_ORIGINS || '';

  if (isProduction && allowedOrigins.includes('localhost')) {
    return {
      passed: false,
      message:
        'ERROR: CORS configuration includes localhost in production. This should be removed.',
      severity: 'error',
    };
  }

  if (isProduction && !allowedOrigins) {
    return {
      passed: false,
      message: 'WARNING: ALLOWED_ORIGINS is not set. Using default origins.',
      severity: 'warning',
    };
  }

  return {
    passed: true,
    message: 'CORS is properly configured.',
    severity: 'info',
  };
}

/**
 * Check if Supabase credentials are configured
 */
export function checkSupabaseConfiguration(): SecurityCheckResult {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
    return {
      passed: false,
      message:
        'CRITICAL: Supabase credentials are not properly configured. The application will not function.',
      severity: 'critical',
    };
  }

  return {
    passed: true,
    message: 'Supabase is properly configured.',
    severity: 'info',
  };
}

/**
 * Check if email service is configured
 */
export function checkEmailConfiguration(): SecurityCheckResult {
  const resendApiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL;

  if (!resendApiKey || !fromEmail) {
    return {
      passed: false,
      message:
        'WARNING: Email service (Resend) is not configured. Email notifications will not be sent.',
      severity: 'warning',
    };
  }

  return {
    passed: true,
    message: 'Email service is properly configured.',
    severity: 'info',
  };
}

/**
 * Check if RBAC enforcement is enabled
 */
export function checkRBACEnforcement(): SecurityCheckResult {
  const rbacEnforcement = process.env.RBAC_ENFORCEMENT;
  const isProduction = process.env.NODE_ENV === 'production';

  if (isProduction && rbacEnforcement !== 'true') {
    return {
      passed: false,
      message:
        'CRITICAL: RBAC enforcement is not enabled in production. This is a severe security risk.',
      severity: 'critical',
    };
  }

  return {
    passed: true,
    message: 'RBAC enforcement is properly enabled.',
    severity: 'info',
  };
}

/**
 * Run all security checks
 */
export function runAllSecurityChecks(): SecurityCheckReport {
  const checks: SecurityCheckResult[] = [
    checkTestAccountsDisabled(),
    checkDebugModeDisabled(),
    checkHTTPSEnforced(),
    checkRateLimitingConfigured(),
    checkCORSConfiguration(),
    checkSupabaseConfiguration(),
    checkEmailConfiguration(),
    checkRBACEnforcement(),
  ];

  const criticalIssues = checks.filter(
    c => c.severity === 'critical' && !c.passed
  ).length;
  const errors = checks.filter(c => c.severity === 'error' && !c.passed).length;
  const warnings = checks.filter(
    c => c.severity === 'warning' && !c.passed
  ).length;
  const allPassed = checks.every(c => c.passed);

  return {
    allPassed,
    checks,
    criticalIssues,
    errors,
    warnings,
  };
}

/**
 * Log security check results
 */
export function logSecurityCheckResults(report: SecurityCheckReport): void {
  report.checks.forEach(check => {
    const icon = check.passed ? '✅' : '❌';
    const severityIcon = {
      info: 'ℹ️',
      warning: '⚠️',
      error: '🚨',
      critical: '🔥',
    }[check.severity];
  });

  if (report.criticalIssues > 0) {
  }
}

/**
 * Throw an error if critical security checks fail
 * This should be called during application startup
 */
export function enforceSecurityChecks(): void {
  const report = runAllSecurityChecks();
  logSecurityCheckResults(report);

  // Allow bypassing security checks for initial deployment setup
  // Set SKIP_SECURITY_CHECKS=true in Railway to deploy without all env vars configured
  const skipChecks = process.env.SKIP_SECURITY_CHECKS === 'true';

  if (report.criticalIssues > 0 && process.env.NODE_ENV === 'production') {
    if (skipChecks) {
      return;
    }
    throw new Error(
      `Critical security checks failed. Cannot start application in production with ${report.criticalIssues} critical issue(s).`
    );
  }
}
