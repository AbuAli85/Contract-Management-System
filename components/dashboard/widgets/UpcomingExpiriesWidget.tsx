'use client';

import { useEffect, useState } from 'react';
import { BaseWidget } from '../BaseWidget';
import { Clock, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, differenceInDays } from 'date-fns';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { WidgetProps } from '@/lib/types/dashboard';

interface ExpiringContract {
  id: string;
  contract_number: string;
  title: string;
  end_date: string;
  daysUntilExpiry: number;
  status: string;
}

export function UpcomingExpiriesWidget(props: WidgetProps) {
  const [contracts, setContracts] = useState<ExpiringContract[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchExpiringContracts = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const daysThreshold = props.config.filters?.daysThreshold || 30;
      const response = await fetch(`/api/contracts/expiring?days=${daysThreshold}`);
      const data = await response.json();
      
      if (data.success) {
        const contractsWithDays = (data.contracts || []).map((contract: any) => ({
          ...contract,
          daysUntilExpiry: differenceInDays(new Date(contract.end_date), new Date()),
        }));
        setContracts(contractsWithDays);
      } else {
        setError(data.error || 'Failed to load expiring contracts');
      }
    } catch (err) {
      setError('Network error');
      console.error('Failed to fetch expiring contracts:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExpiringContracts();
    
    const interval = props.config.refreshInterval || 300; // 5 minutes default
    const timer = setInterval(fetchExpiringContracts, interval * 1000);
    
    return () => clearInterval(timer);
  }, [props.config.refreshInterval, props.config.filters?.daysThreshold]);

  const getUrgencyBadge = (days: number) => {
    if (days <= 7) {
      return <Badge variant="destructive">Critical</Badge>;
    } else if (days <= 14) {
      return <Badge variant="default" className="bg-orange-500">Urgent</Badge>;
    } else if (days <= 30) {
      return <Badge variant="secondary">Soon</Badge>;
    }
    return <Badge variant="outline">Upcoming</Badge>;
  };

  return (
    <BaseWidget
      {...props}
      title="Upcoming Expiries"
      description="Contracts expiring soon"
      icon={<Clock className="h-4 w-4" />}
      isLoading={isLoading}
      error={error}
      onRefresh={fetchExpiringContracts}
    >
      {contracts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-4">
          <Clock className="h-12 w-12 text-green-500 mb-2" />
          <p className="text-sm font-medium">All contracts up to date</p>
          <p className="text-xs text-muted-foreground mt-1">
            No expiring contracts in the next {props.config.filters?.daysThreshold || 30} days
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {contracts.map((contract) => (
            <Link
              key={contract.id}
              href={`/en/contracts/${contract.id}`}
              className="block p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {contract.contract_number}
                  </p>
                  <p className="text-xs text-muted-foreground truncate">
                    {contract.title || 'Untitled Contract'}
                  </p>
                </div>
                {getUrgencyBadge(contract.daysUntilExpiry)}
              </div>
              
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <AlertTriangle className="h-3 w-3" />
                <span>
                  Expires {formatDistanceToNow(new Date(contract.end_date), { addSuffix: true })}
                </span>
                <span className="ml-auto font-medium">
                  {contract.daysUntilExpiry} day{contract.daysUntilExpiry !== 1 ? 's' : ''}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </BaseWidget>
  );
}

