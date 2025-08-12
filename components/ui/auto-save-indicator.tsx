import React from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, AlertCircle, Save } from 'lucide-react';

interface AutoSaveIndicatorProps {
  status: 'idle' | 'saving' | 'saved' | 'error';
  lastSaved?: Date;
  className?: string;
}

export function AutoSaveIndicator({
  status,
  lastSaved,
  className,
}: AutoSaveIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'saving':
        return {
          icon: Loader2,
          text: 'Saving...',
          variant: 'secondary' as const,
          className: 'animate-pulse',
        };
      case 'saved':
        return {
          icon: CheckCircle,
          text: 'Saved',
          variant: 'default' as const,
          className: 'text-green-600',
        };
      case 'error':
        return {
          icon: AlertCircle,
          text: 'Save failed',
          variant: 'destructive' as const,
          className: 'text-red-600',
        };
      default:
        return {
          icon: Save,
          text: 'Auto-save enabled',
          variant: 'outline' as const,
          className: 'text-muted-foreground',
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Badge
        variant={config.variant}
        className={cn('flex items-center gap-1 text-xs', config.className)}
      >
        <Icon className='h-3 w-3' />
        {config.text}
      </Badge>
      {lastSaved && status === 'saved' && (
        <span className='text-xs text-muted-foreground'>
          {lastSaved.toLocaleTimeString()}
        </span>
      )}
    </div>
  );
}
