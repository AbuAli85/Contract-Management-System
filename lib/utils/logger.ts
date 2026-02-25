/**
 * Production-safe logging utility
 * Only logs in development mode to avoid cluttering production consoles
 * and prevent exposure of sensitive information
 */

const isDevelopment = process.env.NODE_ENV === 'development';

interface Logger {
  log: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
}

/**
 * Safe logger that only outputs in development
 */
export const logger: Logger = {
  log: (...args: unknown[]) => {
    if (isDevelopment) {
    }
  },
  warn: (...args: unknown[]) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  error: (...args: unknown[]) => {
    // Always log errors, even in production (but sanitize sensitive data)
    const sanitized = args.map(arg => {
      if (typeof arg === 'string') {
        // Remove potential sensitive patterns
        return arg.replace(/\b\d{4,}\b/g, '****'); // Mask long numbers
      }
      return arg;
    });
    console.error(...sanitized);
  },
  debug: (...args: unknown[]) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
  info: (...args: unknown[]) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
};

/**
 * Structured logging for analytics/metrics (always enabled)
 * Use this for important events that should be tracked in production
 */
export const analyticsLogger = {
  track: (event: string, data?: Record<string, unknown>) => {
    if (isDevelopment) {
    }
    // In production, send to analytics service
    // Example: analytics.track(event, data);
  },
};
