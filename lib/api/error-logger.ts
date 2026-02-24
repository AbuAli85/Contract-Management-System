/**
 * Comprehensive Error Logging Utility
 *
 * Provides structured error logging for API routes with:
 * - Request context capture
 * - Error categorization
 * - Stack trace sanitization
 * - Integration points for external monitoring (Sentry, etc.)
 */

import { NextRequest } from 'next/server';

export type ErrorCategory =
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'database'
  | 'external_api'
  | 'internal'
  | 'rate_limit'
  | 'not_found';

export interface ErrorContext {
  category: ErrorCategory;
  endpoint: string;
  method: string;
  userId?: string | undefined;
  userEmail?: string | undefined;
  requestId?: string | undefined;
  ip?: string | undefined;
  userAgent?: string | undefined;
  timestamp: string;
  error: {
    message: string;
    stack?: string | undefined;
    code?: string | undefined;
    details?: any;
  };
  request?:
    | {
        params?: Record<string, any> | undefined;
        body?: any;
        query?: Record<string, any> | undefined;
      }
    | undefined;
}

class APIErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Generate a unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Extract client IP from request
   */
  private getClientIP(request: NextRequest): string {
    return (
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      request.ip ||
      'unknown'
    );
  }

  /**
   * Sanitize error stack trace for production
   */
  private sanitizeStack(stack?: string): string | undefined {
    if (!stack || this.isProduction) {
      return undefined;
    }

    // In development, show full stack
    // In production, remove file paths that might expose system info
    return stack
      .split('\n')
      .filter(line => !line.includes('node_modules'))
      .slice(0, 10) // Limit stack depth
      .join('\n');
  }

  /**
   * Sanitize request body to remove sensitive data
   */
  private sanitizeRequestBody(body: any): any {
    if (!body || typeof body !== 'object') {
      return body;
    }

    const sensitiveFields = [
      'password',
      'token',
      'secret',
      'apiKey',
      'api_key',
      'accessToken',
      'refreshToken',
      'credit_card',
      'ssn',
      'social_security',
    ];

    const sanitized = { ...body };

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }

  /**
   * Format error for console output with colors
   */
  private formatConsoleError(context: ErrorContext): void {
    const icon = this.getCategoryIcon(context.category);
    const color = this.getCategoryColor(context.category);

    console.error(`\n${'='.repeat(80)}`);
    console.error(`${icon} API ERROR - ${context.category.toUpperCase()}`);
    console.error('='.repeat(80));
    console.error(`\n📍 Endpoint: ${context.method} ${context.endpoint}`);
    console.error(`⏰ Time: ${context.timestamp}`);
    console.error(`🆔 Request ID: ${context.requestId}`);

    if (context.userId) {
      console.error(`👤 User: ${context.userEmail || context.userId}`);
    }

    console.error(`🌐 IP: ${context.ip}`);
    console.error(`\n❌ Error: ${context.error.message}`);

    if (context.error.code) {
      console.error(`📋 Code: ${context.error.code}`);
    }

    if (context.error.details) {
      console.error(
        `📄 Details:`,
        JSON.stringify(context.error.details, null, 2)
      );
    }

    if (context.error.stack && this.isDevelopment) {
      console.error(`\n📚 Stack Trace:\n${context.error.stack}`);
    }

    if (context.request) {
      if (context.request.params) {
        console.error(
          `\n🔍 Params:`,
          JSON.stringify(context.request.params, null, 2)
        );
      }

      if (context.request.query) {
        console.error(
          `❓ Query:`,
          JSON.stringify(context.request.query, null, 2)
        );
      }

      if (context.request.body && this.isDevelopment) {
        console.error(
          `📦 Body:`,
          JSON.stringify(context.request.body, null, 2)
        );
      }
    }

    console.error(`\n${'='.repeat(80)}\n`);
  }

  /**
   * Get icon for error category
   */
  private getCategoryIcon(category: ErrorCategory): string {
    const icons = {
      authentication: '🔐',
      authorization: '🚫',
      validation: '⚠️',
      database: '💾',
      external_api: '🌐',
      internal: '⚙️',
      rate_limit: '🚦',
      not_found: '🔍',
    };
    return icons[category] || '❌';
  }

  /**
   * Get color for error category
   */
  private getCategoryColor(category: ErrorCategory): string {
    const colors = {
      authentication: '\x1b[33m', // Yellow
      authorization: '\x1b[31m', // Red
      validation: '\x1b[35m', // Magenta
      database: '\x1b[36m', // Cyan
      external_api: '\x1b[34m', // Blue
      internal: '\x1b[31m', // Red
      rate_limit: '\x1b[33m', // Yellow
      not_found: '\x1b[90m', // Gray
    };
    return colors[category] || '\x1b[31m';
  }

  /**
   * Main logging function
   */
  async logError(
    error: Error | any,
    request: NextRequest,
    category: ErrorCategory,
    additionalContext?: {
      userId?: string | undefined;
      userEmail?: string | undefined;
      requestBody?: any;
      params?: Record<string, any> | undefined;
    }
  ): Promise<ErrorContext> {
    const requestId = this.generateRequestId();
    const url = new URL(request.url);

    const context: ErrorContext = {
      category,
      endpoint: url.pathname,
      method: request.method,
      userId: additionalContext?.userId,
      userEmail: additionalContext?.userEmail,
      requestId,
      ip: this.getClientIP(request),
      userAgent: request.headers.get('user-agent') || 'unknown',
      timestamp: new Date().toISOString(),
      error: {
        message: error instanceof Error ? error.message : String(error),
        stack: this.sanitizeStack(
          error instanceof Error ? error.stack : undefined
        ),
        code: error?.code || error?.statusCode,
        details: error?.details || error?.data,
      },
      request: {
        params: additionalContext?.params,
        body: this.sanitizeRequestBody(additionalContext?.requestBody),
        query: Object.fromEntries(url.searchParams.entries()),
      },
    };

    // Console logging
    this.formatConsoleError(context);

    // TODO: Send to external monitoring service (Sentry, LogRocket, etc.)
    // await this.sendToMonitoring(context);

    return context;
  }

  /**
   * Log authentication errors
   */
  async logAuthError(
    error: Error | any,
    request: NextRequest,
    additionalContext?: {
      attemptedEmail?: string | undefined;
      requestBody?: any;
    }
  ): Promise<ErrorContext> {
    return this.logError(error, request, 'authentication', {
      userEmail: additionalContext?.attemptedEmail,
      requestBody: additionalContext?.requestBody,
    });
  }

  /**
   * Log authorization/permission errors
   */
  async logAuthorizationError(
    error: Error | any,
    request: NextRequest,
    additionalContext?: {
      userId?: string | undefined;
      userEmail?: string | undefined;
      requiredPermission?: string | undefined;
      userPermissions?: string[] | undefined;
    }
  ): Promise<ErrorContext> {
    return this.logError(error, request, 'authorization', {
      userId: additionalContext?.userId,
      userEmail: additionalContext?.userEmail,
      requestBody: {
        required_permission: additionalContext?.requiredPermission,
        user_permissions: additionalContext?.userPermissions,
      },
    });
  }

  /**
   * Log validation errors
   */
  async logValidationError(
    error: Error | any,
    request: NextRequest,
    additionalContext?: {
      userId?: string | undefined;
      validationErrors?: any;
      requestBody?: any;
    }
  ): Promise<ErrorContext> {
    return this.logError(error, request, 'validation', {
      userId: additionalContext?.userId,
      requestBody: additionalContext?.requestBody,
    });
  }

  /**
   * Log database errors
   */
  async logDatabaseError(
    error: Error | any,
    request: NextRequest,
    additionalContext?: {
      userId?: string | undefined;
      query?: string | undefined;
      table?: string | undefined;
    }
  ): Promise<ErrorContext> {
    return this.logError(error, request, 'database', {
      userId: additionalContext?.userId,
      params: {
        table: additionalContext?.table,
        query: additionalContext?.query,
      },
    });
  }

  /**
   * Log rate limit errors
   */
  async logRateLimitError(
    request: NextRequest,
    additionalContext?: {
      limit?: number | undefined;
      remaining?: number | undefined;
      resetTime?: number | undefined;
    }
  ): Promise<ErrorContext> {
    return this.logError(
      new Error('Rate limit exceeded'),
      request,
      'rate_limit',
      {
        params: additionalContext,
      }
    );
  }

  /**
   * Send to external monitoring service
   * TODO: Implement integration with Sentry, LogRocket, etc.
   */
  private async sendToMonitoring(context: ErrorContext): Promise<void> {
    // Example Sentry integration:
    // if (process.env.SENTRY_DSN) {
    //   Sentry.captureException(new Error(context.error.message), {
    //     tags: {
    //       category: context.category,
    //       endpoint: context.endpoint,
    //     },
    //     extra: context,
    //   });
    // }

    // For now, just log that we would send to monitoring
    if (this.isProduction) {
      console.log(
        `[Monitoring] Would send error to external service: ${context.requestId}`
      );
    }
  }
}

// Export singleton instance
export const apiErrorLogger = new APIErrorLogger();

// Export helper functions for common use cases
export const logAuthError = apiErrorLogger.logAuthError.bind(apiErrorLogger);
export const logAuthorizationError =
  apiErrorLogger.logAuthorizationError.bind(apiErrorLogger);
export const logValidationError =
  apiErrorLogger.logValidationError.bind(apiErrorLogger);
export const logDatabaseError =
  apiErrorLogger.logDatabaseError.bind(apiErrorLogger);
export const logRateLimitError =
  apiErrorLogger.logRateLimitError.bind(apiErrorLogger);
