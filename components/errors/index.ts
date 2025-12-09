/**
 * Error Components Library
 *
 * Centralized export for all error-related components and utilities
 */

// Error Boundary
export { ErrorBoundary, withErrorBoundary } from './error-boundary';

// Error Fallback UI
export { ErrorFallback } from './error-fallback';

// Specific Error Types
export {
  NetworkError,
  PermissionError,
  NotFoundError,
  TimeoutError,
  ValidationError,
  DatabaseError,
  ServerError,
  RateLimitError,
  AutoError,
} from './error-types';

// Type exports
export type { BaseErrorProps } from './error-types';
