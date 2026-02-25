/**
 * Performance monitoring utilities for tracking API and query performance
 */

export interface PerformanceMetrics {
  operationName: string;
  startTime: number;
  endTime?: number | undefined;
  duration?: number | undefined;
  success: boolean;
  error?: string | undefined;
  metadata?: Record<string, any> | undefined;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private maxMetrics = 100; // Keep last 100 metrics

  /**
   * Start tracking an operation
   */
  startOperation(
    operationName: string,
    metadata?: Record<string, any>
  ): string {
    const operationId = `${operationName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const metric: PerformanceMetrics = {
      operationName,
      startTime: Date.now(),
      success: false,
      metadata: metadata || undefined,
    };

    this.metrics.push(metric);

    // Keep only last N metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    return operationId;
  }

  /**
   * End tracking an operation
   */
  endOperation(
    operationName: string,
    success: boolean = true,
    error?: string,
    metadata?: Record<string, any>
  ): number | null {
    const metric = this.metrics
      .slice()
      .reverse()
      .find(m => m.operationName === operationName && !m.endTime);

    if (!metric) {
      console.warn(
        `⚠️ [Performance] No matching start found for: ${operationName}`
      );
      return null;
    }

    metric.endTime = Date.now();
    metric.duration = metric.endTime - metric.startTime;
    metric.success = success;
    metric.error = error || undefined;
    metric.metadata = metadata
      ? { ...metric.metadata, ...metadata }
      : metric.metadata;

    const emoji = success ? '✅' : '❌';
    const status = success ? 'Completed' : 'Failed';

    // Log warning if operation is slow
    if (metric.duration > 3000) {
      console.warn(
        `🐌 [Performance] Slow operation detected: ${operationName} took ${metric.duration}ms`
      );
    }

    return metric.duration;
  }

  /**
   * Get metrics for a specific operation
   */
  getMetrics(operationName?: string): PerformanceMetrics[] {
    if (operationName) {
      return this.metrics.filter(m => m.operationName === operationName);
    }
    return this.metrics;
  }

  /**
   * Get average duration for an operation
   */
  getAverageDuration(operationName: string): number | null {
    const metrics = this.getMetrics(operationName).filter(m => m.duration);

    if (metrics.length === 0) {
      return null;
    }

    const total = metrics.reduce((sum, m) => sum + (m.duration || 0), 0);
    return total / metrics.length;
  }

  /**
   * Get success rate for an operation
   */
  getSuccessRate(operationName: string): number | null {
    const metrics = this.getMetrics(operationName).filter(m => m.endTime);

    if (metrics.length === 0) {
      return null;
    }

    const successful = metrics.filter(m => m.success).length;
    return (successful / metrics.length) * 100;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, any> {
    const operations = [...new Set(this.metrics.map(m => m.operationName))];

    return operations.reduce(
      (summary, operation) => {
        const metrics = this.getMetrics(operation);
        const completed = metrics.filter(m => m.endTime);
        const successful = completed.filter(m => m.success);

        summary[operation] = {
          total: metrics.length,
          completed: completed.length,
          successful: successful.length,
          failed: completed.length - successful.length,
          successRate:
            completed.length > 0
              ? `${((successful.length / completed.length) * 100).toFixed(2)}%`
              : 'N/A',
          avgDuration:
            `${this.getAverageDuration(operation)?.toFixed(2)}ms` || 'N/A',
        };

        return summary;
      },
      {} as Record<string, any>
    );
  }

  /**
   * Log summary to console
   */
  logSummary(): void {
    console.table(this.getSummary());
  }
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Helper function to wrap async operations with performance tracking
 */
export async function withPerformanceTracking<T>(
  operationName: string,
  operation: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  performanceMonitor.startOperation(operationName, metadata);

  try {
    const result = await operation();
    performanceMonitor.endOperation(operationName, true, undefined, metadata);
    return result;
  } catch (error) {
    performanceMonitor.endOperation(
      operationName,
      false,
      error instanceof Error ? error.message : 'Unknown error',
      metadata
    );
    throw error;
  }
}

/**
 * Higher-order function to add timeout to promises
 */
export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  operationName: string = 'Operation'
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(
        () =>
          reject(new Error(`${operationName} timeout after ${timeoutMs}ms`)),
        timeoutMs
      )
    ),
  ]);
}

/**
 * Helper to log API request/response
 */
export function logApiCall(
  endpoint: string,
  method: string,
  duration: number,
  status: number,
  success: boolean,
  metadata?: Record<string, any>
): void {
  const emoji = success ? '✅' : '❌';
}
