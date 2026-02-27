/**
 * Security Utilities
 * Input sanitization, validation, and security helpers
 */

/**
 * Sanitize HTML to prevent XSS attacks.
 * Works in both browser and server environments.
 * For rich HTML content, consider using DOMPurify on the client.
 */
export function sanitizeHtml(html: string): string {
  // Server-safe: use regex-based sanitization
  return html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize user input for safe display
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/[<>]/g, '') // Remove < and >
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .trim();
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number (international format)
 */
export function isValidPhone(phone: string): boolean {
  const phoneRegex = /^\+?[\d\s\-()]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Validate URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Generate secure random string
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Hash string using SubtleCrypto (for client-side use only, NOT for passwords)
 */
export async function hashString(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Rate limiting helper (client-side)
 */
export class RateLimiter {
  private requests: number[] = [];
  private limit: number;
  private windowMs: number;

  constructor(limit: number, windowMs: number) {
    this.limit = limit;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length < this.limit) {
      this.requests.push(now);
      return true;
    }

    return false;
  }

  getTimeUntilNextRequest(): number {
    if (this.requests.length < this.limit) return 0;

    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, this.windowMs - (Date.now() - oldestRequest));
  }
}

/**
 * Content Security Policy violations reporter
 */
export function setupCSPReporting() {
  if (typeof window === 'undefined') return;

  document.addEventListener('securitypolicyviolation', e => {
    const violation = {
      blockedURI: e.blockedURI,
      violatedDirective: e.violatedDirective,
      originalPolicy: e.originalPolicy,
      sourceFile: e.sourceFile,
      lineNumber: e.lineNumber,
      columnNumber: e.columnNumber,
      timestamp: new Date().toISOString(),
    };

    // Log in development
    if (process.env.NODE_ENV === 'development') {
    }

    // Report to endpoint in production
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/csp-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(violation),
      }).catch(error => {
      });
    }
  });
}

/**
 * Validate file upload
 */
export interface FileValidationOptions {
  maxSizeBytes: number;
  allowedTypes: string[];
  allowedExtensions?: string[];
}

export function validateFile(
  file: File,
  options: FileValidationOptions
): { valid: boolean; error?: string } {
  const { maxSizeBytes, allowedTypes, allowedExtensions } = options;

  // Check file size
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${(maxSizeBytes / 1024 / 1024).toFixed(2)}MB limit`,
    };
  }

  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `File type ${file.type} is not allowed`,
    };
  }

  // Check file extension
  if (allowedExtensions) {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedExtensions.includes(extension)) {
      return {
        valid: false,
        error: `File extension .${extension} is not allowed`,
      };
    }
  }

  return { valid: true };
}

/**
 * Prevent timing attacks when comparing strings
 */
export function constantTimeCompare(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }

  return result === 0;
}

/**
 * Escape special characters for use in RegExp
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Remove potentially dangerous characters from filename
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .slice(0, 255);
}

/**
 * Check if string contains SQL injection patterns
 */
export function containsSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/gi,
    /(--|\#|\/\*|\*\/)/gi,
    /(\bOR\b.*=.*)/gi,
    /(\bAND\b.*=.*)/gi,
    /(;|\||&)/gi,
  ];

  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Check if string contains XSS patterns
 */
export function containsXSS(input: string): boolean {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi,
    /<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi,
    /<embed\b[^<]*>/gi,
  ];

  return xssPatterns.some(pattern => pattern.test(input));
}

/**
 * Create secure headers for API responses
 */
export function getSecureHeaders(): Record<string, string> {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline';",
  };
}

/**
 * Mask sensitive data for display
 */
export function maskSensitiveData(
  data: string,
  type: 'email' | 'phone' | 'card' | 'generic' = 'generic',
  visibleChars: number = 4
): string {
  if (!data) return '';

  switch (type) {
    case 'email': {
      const [local, domain] = data.split('@');
      if (!domain || !local) return data;
      const maskedLocal =
        local.slice(0, 2) + '*'.repeat(Math.max(0, local.length - 2));
      return `${maskedLocal}@${domain}`;
    }

    case 'phone': {
      const cleaned = data.replace(/\D/g, '');
      return (
        cleaned.slice(0, -visibleChars).replace(/\d/g, '*') +
        cleaned.slice(-visibleChars)
      );
    }

    case 'card': {
      const cleaned = data.replace(/\s/g, '');
      return (
        '*'.repeat(cleaned.length - visibleChars) + cleaned.slice(-visibleChars)
      );
    }

    case 'generic':
    default:
      return (
        '*'.repeat(Math.max(0, data.length - visibleChars)) +
        data.slice(-visibleChars)
      );
  }
}

/**
 * Validate password strength
 */
export interface PasswordStrength {
  score: number; // 0-4
  feedback: string[];
  isStrong: boolean;
}

export function validatePasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;

  // Length check
  if (password.length >= 8) score++;
  else feedback.push('Password should be at least 8 characters long');

  if (password.length >= 12) score++;

  // Complexity checks
  if (/[a-z]/.test(password)) score++;
  else feedback.push('Include lowercase letters');

  if (/[A-Z]/.test(password)) score++;
  else feedback.push('Include uppercase letters');

  if (/\d/.test(password)) score++;
  else feedback.push('Include numbers');

  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) score++;
  else feedback.push('Include special characters');

  // Common patterns check
  if (/(.)\1{2,}/.test(password)) {
    score--;
    feedback.push('Avoid repeating characters');
  }

  if (/^(123|abc|qwerty|password)/i.test(password)) {
    score = 0;
    feedback.push('Avoid common patterns');
  }

  return {
    score: Math.max(0, Math.min(4, score)),
    feedback,
    isStrong: score >= 3,
  };
}
