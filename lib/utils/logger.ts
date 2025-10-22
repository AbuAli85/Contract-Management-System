/**
 * Structured Logger for API and Application Errors
 * Provides consistent logging with context and metadata
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

export interface LogContext {
  requestId?: string | undefined;
  userId?: string | undefined;
  endpoint?: string | undefined;
  method?: string | undefined;
  duration?: string | number | undefined;
  statusCode?: number | undefined;
  userAgent?: string | undefined;
  ip?: string | undefined;
  [key: string]: any;
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  context?: LogContext | undefined;
  error?: Error | any | undefined;
  timestamp: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isProduction = process.env.NODE_ENV === 'production';

  /**
   * Format log entry for console output
   */
  private formatLogEntry(entry: LogEntry): string {
    const { level, message, context, timestamp } = entry;
    const emoji = this.getLevelEmoji(level);
    
    if (this.isDevelopment) {
      // Detailed format for development
      let formatted = `${emoji} [${timestamp}] ${level.toUpperCase()}: ${message}`;
      
      if (context) {
        formatted += `\n  Context: ${JSON.stringify(context, null, 2)}`;
      }
      
      if (entry.error) {
        formatted += `\n  Error: ${entry.error.message || entry.error}`;
        if (entry.error.stack) {
          formatted += `\n  Stack: ${entry.error.stack}`;
        }
      }
      
      return formatted;
    }
    
    // Compact format for production
    return JSON.stringify({
      ...entry,
      error: entry.error
        ? {
            message: entry.error.message || entry.error.toString(),
            stack: entry.error.stack,
          }
        : undefined,
    });
  }

  /**
   * Get emoji for log level
   */
  private getLevelEmoji(level: LogLevel): string {
    const emojis: Record<LogLevel, string> = {
      debug: '🔍',
      info: 'ℹ️',
      warn: '⚠️',
      error: '❌',
      fatal: '💥',
    };
    return emojis[level] || 'ℹ️';
  }

  /**
   * Create a log entry
   */
  private log(
    level: LogLevel,
    message: string,
    context?: LogContext | undefined,
    error?: Error | any | undefined
  ): void {
    const entry: LogEntry = {
      level,
      message,
      context: context ?? undefined,
      error: error ?? undefined,
      timestamp: new Date().toISOString(),
    };

    const formatted = this.formatLogEntry(entry);

    // Console output based on level
    switch (level) {
      case 'debug':
        if (this.isDevelopment) console.debug(formatted);
        break;
      case 'info':
        console.log(formatted);
        break;
      case 'warn':
        console.warn(formatted);
        break;
      case 'error':
      case 'fatal':
        console.error(formatted);
        break;
    }

    // In production, you might want to send to external service
    if (this.isProduction && (level === 'error' || level === 'fatal')) {
      this.sendToExternalService(entry);
    }
  }

  /**
   * Send log to external monitoring service (e.g., Sentry, LogRocket)
   */
  private sendToExternalService(entry: LogEntry): void {
    // TODO: Implement external logging service integration
    // Example: Sentry.captureException(entry.error, { extra: entry.context });
    
    // For now, just log that we would send it
    if (this.isDevelopment) {
      console.log('📤 Would send to external service:', entry.message);
    }
  }

  // Public logging methods

  debug(message: string, context?: LogContext | undefined): void {
    this.log('debug', message, context);
  }

  info(message: string, context?: LogContext | undefined): void {
    this.log('info', message, context);
  }

  warn(message: string, context?: LogContext | undefined, error?: Error | any | undefined): void {
    this.log('warn', message, context, error);
  }

  error(message: string, context?: LogContext | undefined, error?: Error | any | undefined): void {
    this.log('error', message, context, error);
  }

  fatal(message: string, context?: LogContext | undefined, error?: Error | any | undefined): void {
    this.log('fatal', message, context, error);
  }

  /**
   * Create a scoped logger with pre-filled context
   */
  createScoped(scopeContext: LogContext): Logger {
    const scopedLogger = new Logger();
    const originalLog = scopedLogger.log.bind(scopedLogger);

    scopedLogger.log = (
      level: LogLevel,
      message: string,
      context?: LogContext | undefined,
      error?: Error | any | undefined
    ) => {
      originalLog(level, message, { ...scopeContext, ...context }, error);
    };

    return scopedLogger;
  }

  /**
   * Log API request start
   */
  apiRequestStart(requestId: string, endpoint: string, method: string): void {
    this.info('API Request Started', {
      requestId,
      endpoint,
      method,
    });
  }

  /**
   * Log API request completion
   */
  apiRequestComplete(
    requestId: string,
    statusCode: number,
    duration: number
  ): void {
    this.info('API Request Completed', {
      requestId,
      statusCode,
      duration: `${duration}ms`,
    });
  }

  /**
   * Log API request error
   */
  apiRequestError(
    requestId: string,
    error: Error | any,
    context?: LogContext | undefined
  ): void {
    this.error(
      'API Request Failed',
      {
        ...context,
        requestId,
      },
      error
    );
  }

  /**
   * Log database query
   */
  dbQuery(
    table: string,
    operation: string,
    duration?: number | undefined,
    context?: LogContext | undefined
  ): void {
    this.debug('Database Query', {
      ...context,
      table,
      operation,
      duration: duration !== undefined ? `${duration}ms` : undefined,
    });
  }

  /**
   * Log database error
   */
  dbError(
    table: string,
    operation: string,
    error: Error | any,
    context?: LogContext | undefined
  ): void {
    this.error(
      'Database Error',
      {
        ...context,
        table,
        operation,
      },
      error
    );
  }

  /**
   * Log authentication event
   */
  authEvent(
    event: string,
    userId?: string | undefined,
    success: boolean = true,
    context?: LogContext | undefined
  ): void {
    const level = success ? 'info' : 'warn';
    this.log(
      level,
      `Authentication: ${event}`,
      {
        ...context,
        userId: userId ?? undefined,
        success,
      }
    );
  }

  /**
   * Log RBAC check
   */
  rbacCheck(
    permission: string,
    userId: string,
    allowed: boolean,
    context?: LogContext | undefined
  ): void {
    this.info('RBAC Check', {
      ...context,
      permission,
      userId,
      allowed,
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export type for scoped loggers
export type ScopedLogger = Logger;

