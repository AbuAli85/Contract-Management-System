"use client";
import { useEffect, useState } from 'react';

interface PerformanceMetrics {
  pageLoadTime: number;
  apiResponseTime: number;
  renderTime: number;
  memoryUsage?: number;
}

export function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    pageLoadTime: 0,
    apiResponseTime: 0,
    renderTime: 0,
  });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Measure page load time
    if (typeof window !== 'undefined') {
      const loadTime = performance.now();
      setMetrics(prev => ({ ...prev, pageLoadTime: loadTime }));

      // Monitor API calls
      const originalFetch = window.fetch;
      window.fetch = async (...args) => {
        const start = performance.now();
        try {
          const response = await originalFetch(...args);
          const end = performance.now();
          setMetrics(prev => ({ 
            ...prev, 
            apiResponseTime: Math.max(prev.apiResponseTime, end - start) 
          }));
          return response;
        } catch (error) {
          const end = performance.now();
          setMetrics(prev => ({ 
            ...prev, 
            apiResponseTime: Math.max(prev.apiResponseTime, end - start) 
          }));
          throw error;
        }
      };

      // Monitor memory usage
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        setMetrics(prev => ({ 
          ...prev, 
          memoryUsage: memory.usedJSHeapSize / 1024 / 1024 
        }));
      }

      // Toggle visibility with Ctrl+Shift+P
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
          setIsVisible(prev => !prev);
        }
      };
      
      if (typeof document !== 'undefined') {
        document.addEventListener('keydown', handleKeyDown);
      }

      return () => {
        if (typeof document !== 'undefined') {
          document.removeEventListener('keydown', handleKeyDown);
        }
        window.fetch = originalFetch;
      };
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono z-50">
      <div className="mb-2 font-bold">Performance Monitor</div>
      <div>Page Load: {metrics.pageLoadTime.toFixed(2)}ms</div>
      <div>API Response: {metrics.apiResponseTime.toFixed(2)}ms</div>
      <div>Render Time: {metrics.renderTime.toFixed(2)}ms</div>
      {metrics.memoryUsage && (
        <div>Memory: {metrics.memoryUsage.toFixed(1)}MB</div>
      )}
      <div className="mt-2 text-gray-400">
        Press Ctrl+Shift+P to toggle
      </div>
    </div>
  );
}

// Hook for measuring component render time
export function useRenderTime() {
  const [renderTime, setRenderTime] = useState(0);

  useEffect(() => {
    const start = performance.now();
    return () => {
      const end = performance.now();
      setRenderTime(end - start);
    };
  }, []);

  return renderTime;
}

// Hook for measuring API call performance
export function useApiPerformance() {
  const [apiTimes, setApiTimes] = useState<Record<string, number>>({});

  const measureApiCall = async (name: string, apiCall: () => Promise<any>) => {
    const start = performance.now();
    try {
      const result = await apiCall();
      const end = performance.now();
      setApiTimes(prev => ({ ...prev, [name]: end - start }));
      return result;
    } catch (error) {
      const end = performance.now();
      setApiTimes(prev => ({ ...prev, [name]: end - start }));
      throw error;
    }
  };

  return { apiTimes, measureApiCall };
} 