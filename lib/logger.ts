/**
 * Professional Logger Service
 *
 * Features:
 * - Structured logging with log levels
 * - Development vs production behavior
 * - Server-safe (no localStorage on server)
 * - Sanitizes sensitive data in production
 * - Ready for external logging service integration (Sentry, Datadog, etc.)
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  data?: unknown;
  timestamp: string;
  context?: string;
  userId?: string;
  requestId?: string;
}

// Sensitive field patterns to redact in production logs
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /authorization/i,
  /cookie/i,
  /session/i,
];

function redactSensitiveData(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;
  if (Array.isArray(data)) return data.map(redactSensitiveData);

  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (SENSITIVE_PATTERNS.some(pattern => pattern.test(key))) {
      result[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      result[key] = redactSensitiveData(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

class Logger {
  private readonly isDevelopment = process.env.NODE_ENV === 'development';
  private readonly isClient = typeof window !== 'undefined';
  private readonly MAX_STORED_LOGS = 100;

  private formatEntry(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string
  ): LogEntry {
    return {
      level,
      message,
      data: this.isDevelopment ? data : redactSensitiveData(data),
      timestamp: new Date().toISOString(),
      context,
    };
  }

  private log(
    level: LogLevel,
    message: string,
    data?: unknown,
    context?: string
  ): void {
    const entry = this.formatEntry(level, message, data, context);

    if (this.isDevelopment) {
      const emoji = { debug: '🔍', info: 'ℹ️', warn: '⚠️', error: '❌' }[level];
      const contextStr = context ? `[${context}]` : '[App]';
      const method = (level === 'debug' ? 'log' : level) as 'log' | 'info' | 'warn' | 'error';
      console[method](`${emoji} ${contextStr}`, message, data !== undefined ? data : '');
    } else if (level === 'error' || level === 'warn') {
      // In production, only log warnings and errors to console
      console[level](`[${entry.timestamp}] [${level.toUpperCase()}]`, message);
    }

    // Store logs client-side for debugging
    if (this.isClient && level !== 'debug') {
      this.storeLog(entry);
    }

    // Production: send to external logging service
    if (!this.isDevelopment && (level === 'error' || level === 'warn')) {
      this.sendToExternalService(entry);
    }
  }

  private storeLog(entry: LogEntry): void {
    try {
      const stored = JSON.parse(
        localStorage.getItem('app_logs') || '[]'
      ) as LogEntry[];
      stored.push(entry);
      // Keep only the most recent logs
      if (stored.length > this.MAX_STORED_LOGS) {
        stored.splice(0, stored.length - this.MAX_STORED_LOGS);
      }
      localStorage.setItem('app_logs', JSON.stringify(stored));
    } catch {
      // Silently fail — localStorage may be unavailable
    }
  }

  private sendToExternalService(entry: LogEntry): void {
    // TODO: Integrate with your preferred logging service
    // Examples:
    //   Sentry:   Sentry.captureMessage(entry.message, { level: entry.level, extra: entry.data })
    //   Datadog:  DD_LOGS.logger[entry.level](entry.message, entry.data)
    //   LogRocket: LogRocket.log(entry.message, entry.data)
    void entry; // Suppress unused variable warning until integration is added
  }

  debug(message: string, data?: unknown, context?: string): void {
    this.log('debug', message, data, context);
  }

  info(message: string, data?: unknown, context?: string): void {
    this.log('info', message, data, context);
  }

  warn(message: string, data?: unknown, context?: string): void {
    this.log('warn', message, data, context);
  }

  error(message: string, data?: unknown, context?: string): void {
    this.log('error', message, data, context);
  }

  /**
   * Get stored logs (client-side only).
   */
  getLogs(): LogEntry[] {
    if (!this.isClient) return [];
    try {
      return JSON.parse(localStorage.getItem('app_logs') || '[]') as LogEntry[];
    } catch {
      return [];
    }
  }

  /**
   * Clear stored logs (client-side only).
   */
  clearLogs(): void {
    if (!this.isClient) return;
    try {
      localStorage.removeItem('app_logs');
    } catch {
      // Silently fail
    }
  }
}

export const logger = new Logger();
export type { LogEntry, LogLevel };
