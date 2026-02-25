'use client';

import { useEffect, useState } from 'react';
import { BaseWidget } from '../BaseWidget';
import { FileText, TrendingUp, TrendingDown, Clock } from 'lucide-react';
import type { WidgetProps } from '@/lib/types/dashboard';
import type { ContractMetrics } from '@/lib/metrics';

export function ContractMetricsWidget(props: WidgetProps) {
  const [metrics, setMetrics] = useState<ContractMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/metrics/contracts');
      const data = await response.json();

      if (data.success) {
        setMetrics(data.metrics);
      } else {
        setError(data.error || 'Failed to load metrics');
      }
    } catch (err) {
      setError('Network error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();

    // Auto-refresh based on config
    const interval = props.config.refreshInterval || 60;
    const timer = setInterval(fetchMetrics, interval * 1000);

    return () => clearInterval(timer);
  }, [props.config.refreshInterval]);

  return (
    <BaseWidget
      {...props}
      title='Contract Metrics'
      description='Overview of contract statistics'
      icon={<FileText className='h-4 w-4' />}
      isLoading={isLoading}
      error={error}
      onRefresh={fetchMetrics}
    >
      {metrics && (
        <div className='space-y-4'>
          <div className='grid grid-cols-2 gap-4'>
            <MetricCard
              label='Total'
              value={metrics.total}
              icon={<FileText className='h-4 w-4' />}
              color='blue'
            />
            <MetricCard
              label='Active'
              value={metrics.active}
              icon={<TrendingUp className='h-4 w-4' />}
              color='green'
            />
            <MetricCard
              label='Pending'
              value={metrics.pending}
              icon={<Clock className='h-4 w-4' />}
              color='orange'
            />
            <MetricCard
              label='Expired'
              value={metrics.expired}
              icon={<TrendingDown className='h-4 w-4' />}
              color='red'
            />
          </div>

          {metrics.expiringSoon > 0 && (
            <div className='p-3 bg-amber-50 dark:bg-amber-950 rounded-lg border border-amber-200 dark:border-amber-800'>
              <p className='text-sm'>
                <span className='font-semibold'>{metrics.expiringSoon}</span>{' '}
                contract{metrics.expiringSoon !== 1 ? 's' : ''} expiring soon
              </p>
            </div>
          )}

          {metrics.totalValue > 0 && (
            <div className='pt-3 border-t'>
              <p className='text-xs text-muted-foreground'>Total Value</p>
              <p className='text-2xl font-bold'>
                {new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: 'OMR',
                }).format(metrics.totalValue)}
              </p>
            </div>
          )}
        </div>
      )}
    </BaseWidget>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'red';
}

function MetricCard({ label, value, icon, color }: MetricCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300',
    green: 'bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-300',
    orange:
      'bg-orange-50 text-orange-700 dark:bg-orange-950 dark:text-orange-300',
    red: 'bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-300',
  };

  return (
    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
      <div className='flex items-center justify-between mb-1'>
        {icon}
        <span className='text-2xl font-bold'>{value}</span>
      </div>
      <p className='text-xs font-medium'>{label}</p>
    </div>
  );
}
