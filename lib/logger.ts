/**
 * Professional Logger Service
 * Replaces console.log with structured logging
 * Integrates with monitoring services in production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: any;
  timestamp: string;
  context?: string | undefined;
  userId?: string | undefined;
  requestId?: string | undefined;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private log(level: LogLevel, message: string, data?: any, context?: string) {
    const entry: LogEntry = {
      level,
      message,
      data,
      timestamp: new Date().toISOString(),
      context,
    };

    // In development, use console with better formatting
    if (this.isDevelopment) {
      const emoji = {
        debug: '🔍',
        info: 'ℹ️',
        warn: '⚠️',
        error: '❌',
      }[level];

      const contextStr = context ? `[${context}]` : '[App]';
      const method = level === 'debug' ? 'log' : level;

      console[method](
        `${emoji} ${contextStr}`,
        message,
        data !== undefined ? data : ''
      );
    }

    // In production, send to logging service (but not debug logs)
    if (!this.isDevelopment && level !== 'debug') {
      this.sendToLoggingService(entry);
    }
  }

  private sendToLoggingService(entry: LogEntry) {
    // Only store logs on the client side
    if (!this.isClient) return;

    try {
      // Store in localStorage for debugging (keep last 100 logs)
      const logs = JSON.parse(localStorage.getItem('app_logs') || '[]');
      logs.push(entry);
      
      // Keep only last 100 logs to avoid storage issues
      if (logs.length > 100) {
        logs.shift();
      }
      
      localStorage.setItem('app_logs', JSON.stringify(logs));

      // TODO: Integrate with external logging service (Sentry, LogRocket, etc.)
      // Example:
      // if (window.Sentry && entry.level === 'error') {
      //   window.Sentry.captureException(new Error(entry.message), {
      //     extra: entry.data,
      //     tags: { context: entry.context }
      //   });
      // }
    } catch (error) {
      // Silently fail if localStorage is not available
      // Don't log this to avoid infinite loops
    }
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, data?: any, context?: string) {
    this.log('debug', message, data, context);
  }

  /**
   * Log informational messages
   */
  info(message: string, data?: any, context?: string) {
    this.log('info', message, data, context);
  }

  /**
   * Log warning messages
   */
  warn(message: string, data?: any, context?: string) {
    this.log('warn', message, data, context);
  }

  /**
   * Log error messages
   */
  error(message: string, data?: any, context?: string) {
    this.log('error', message, data, context);
  }

  /**
   * Get stored logs (client-side only)
   */
  getLogs(): LogEntry[] {
    if (!this.isClient) return [];
    
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]');
    } catch {
      return [];
    }
  }

  /**
   * Clear stored logs
   */
  clearLogs() {
    if (!this.isClient) return;
    
    try {
      localStorage.removeItem('app_logs');
    } catch {
      // Silently fail
    }
  }
}

export const logger = new Logger();

