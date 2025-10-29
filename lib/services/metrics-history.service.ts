/**
 * Metrics History Service
 * 
 * Handles recording and retrieving historical metrics for trend analysis
 */

import { createClient } from '@/lib/supabase/server';

export interface MetricSnapshot {
  id: string;
  metric_type: string;
  metric_name: string;
  metric_value: number;
  snapshot_date: string;
  snapshot_time: string;
  breakdown?: Record<string, any>;
  created_at: string;
}

export interface MetricTrend {
  current_value: number;
  previous_value: number;
  change_value: number;
  change_percent: number;
  trend: 'up' | 'down' | 'stable' | 'unknown';
}

export interface TrendData {
  value: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable' | 'unknown';
  previousValue: number;
}

/**
 * Record current metrics snapshot
 */
export async function recordMetricsSnapshot(
  metricType: string,
  metricName: string,
  metricValue: number,
  breakdown?: Record<string, any>
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createClient();

    const { error } = await supabase
      .from('metrics_history')
      .insert({
        metric_type: metricType,
        metric_name: metricName,
        metric_value: metricValue,
        snapshot_date: new Date().toISOString().split('T')[0],
        breakdown,
      });

    if (error) {
      console.error('Error recording metric snapshot:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Unexpected error recording metric:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Record daily metrics for all key performance indicators
 */
export async function recordDailyMetrics(): Promise<{
  success: boolean;
  metricsRecorded?: number;
  error?: string;
}> {
  try {
    const supabase = await createClient();

    // Call the database function to record all metrics
    const { data, error } = await supabase.rpc('record_daily_metrics');

    if (error) {
      console.error('Error recording daily metrics:', error);
      return { success: false, error: error.message };
    }

    return { success: true, metricsRecorded: 6 }; // We record 6 key metrics
  } catch (error) {
    console.error('Unexpected error recording daily metrics:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get metric trend comparing current vs previous period
 */
export async function getMetricTrend(
  metricType: string,
  metricName: string,
  daysBack: number = 7
): Promise<TrendData | null> {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase.rpc('get_metric_trend', {
      p_metric_type: metricType,
      p_metric_name: metricName,
      p_days_back: daysBack,
    });

    if (error) {
      console.error('Error getting metric trend:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const result = data[0];

    return {
      value: result.current_value || 0,
      change: result.change_value || 0,
      changePercent: result.change_percent || 0,
      trend: result.trend || 'unknown',
      previousValue: result.previous_value || 0,
    };
  } catch (error) {
    console.error('Unexpected error getting metric trend:', error);
    return null;
  }
}

/**
 * Get trends for multiple metrics at once
 */
export async function getMultipleMetricTrends(
  metrics: Array<{ type: string; name: string }>,
  daysBack: number = 7
): Promise<Record<string, TrendData | null>> {
  const trends: Record<string, TrendData | null> = {};

  await Promise.all(
    metrics.map(async (metric) => {
      const key = `${metric.type}_${metric.name}`;
      trends[key] = await getMetricTrend(metric.type, metric.name, daysBack);
    })
  );

  return trends;
}

/**
 * Get historical data for charting
 */
export async function getMetricHistory(
  metricType: string,
  metricName: string,
  days: number = 30
): Promise<MetricSnapshot[]> {
  try {
    const supabase = await createClient();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('metrics_history')
      .select('*')
      .eq('metric_type', metricType)
      .eq('metric_name', metricName)
      .gte('snapshot_date', cutoffDate.toISOString().split('T')[0])
      .order('snapshot_date', { ascending: true });

    if (error) {
      console.error('Error fetching metric history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Unexpected error fetching metric history:', error);
    return [];
  }
}

/**
 * Get promoter-specific metrics for trends
 */
export async function getPromoterMetricsTrends(
  daysBack: number = 7
): Promise<{
  totalPromoters: TrendData | null;
  activeWorkforce: TrendData | null;
  criticalDocuments: TrendData | null;
  complianceRate: TrendData | null;
}> {
  const trends = await getMultipleMetricTrends(
    [
      { type: 'promoters', name: 'total' },
      { type: 'promoters', name: 'active' },
      { type: 'promoters', name: 'critical_documents' },
      { type: 'promoters', name: 'compliance_rate' },
    ],
    daysBack
  );

  return {
    totalPromoters: trends['promoters_total'] || null,
    activeWorkforce: trends['promoters_active'] || null,
    criticalDocuments: trends['promoters_critical_documents'] || null,
    complianceRate: trends['promoters_compliance_rate'] || null,
  };
}

/**
 * Calculate simple client-side trend from two values
 * (Fallback when no historical data available)
 */
export function calculateSimpleTrend(
  currentValue: number,
  previousValue: number
): TrendData {
  const change = currentValue - previousValue;
  const changePercent =
    previousValue === 0
      ? currentValue > 0
        ? 100
        : 0
      : Math.round((change / previousValue) * 100 * 100) / 100;

  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (Math.abs(changePercent) < 1) {
    trend = 'stable';
  } else if (change > 0) {
    trend = 'up';
  } else {
    trend = 'down';
  }

  return {
    value: currentValue,
    change,
    changePercent,
    trend,
    previousValue,
  };
}

