/**
 * Correlation ID utilities for request tracing
 * Based on MCP server patterns for end-to-end request tracking
 */

import type { NextRequest } from 'next/server';

/**
 * Generate a unique correlation ID for request tracing
 */
export function generateCorrelationId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `cms-${timestamp}-${random}`;
}

/**
 * Extract correlation ID from headers
 */
export function extractCorrelationId(
  headers:
    | Headers
    | Record<string, string | string[] | undefined>
    | NextRequest['headers']
): string | undefined {
  if (headers instanceof Headers) {
    return (
      headers.get('x-correlation-id') ||
      headers.get('X-Correlation-ID') ||
      undefined
    );
  }

  // Handle Record<string, string>
  if (typeof headers === 'object' && headers !== null) {
    const correlationId =
      (headers as any)['x-correlation-id'] ||
      (headers as any)['X-Correlation-ID'] ||
      (headers as any)['x-request-id'];

    return typeof correlationId === 'string' ? correlationId : undefined;
  }

  return undefined;
}

/**
 * Add correlation ID to headers object
 */
export function withCorrelationId<T extends Record<string, any>>(
  headers: T,
  correlationId?: string
): T & { 'X-Correlation-ID': string } {
  return {
    ...headers,
    'X-Correlation-ID': correlationId || generateCorrelationId(),
  };
}

/**
 * Create a correlation ID and add it to response headers
 */
export function addCorrelationIdToResponse(
  response: Response,
  correlationId?: string
): Response {
  const id = correlationId || generateCorrelationId();
  response.headers.set('X-Correlation-ID', id);
  return response;
}

/**
 * Log with correlation ID
 */
export function logWithCorrelation(
  correlationId: string,
  level: 'info' | 'warn' | 'error' | 'debug',
  message: string,
  data?: any
): void {
  const logMessage = `[${correlationId}] ${message}`;
  const logData = data ? { ...data, correlationId } : { correlationId };

  switch (level) {
    case 'error':
      console.error(logMessage, logData);
      break;
    case 'warn':
      console.warn(logMessage, logData);
      break;
    case 'debug':
      console.debug(logMessage, logData);
      break;
    default:
  }
}
