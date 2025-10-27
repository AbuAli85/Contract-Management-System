'use client';

import React from 'react';
import { CheckCircle2, Circle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

export interface FormCompletionIndicatorProps {
  completion: number;
  hasStarted: boolean;
  status: 'not-started' | 'in-progress' | 'completed';
  requiredCompleted: number;
  requiredTotal: number;
  optionalCompleted?: number;
  optionalTotal?: number;
  missingRequired?: string[];
  className?: string;
  showDetails?: boolean;
}

/**
 * Form Completion Indicator Component
 * 
 * Displays a progress bar and completion status
 * Only shows after user has started filling the form
 * 
 * @example
 * ```tsx
 * const formCompletion = useFormCompletion({ formData, requiredFields });
 * 
 * <FormCompletionIndicator {...formCompletion} showDetails />
 * ```
 */
export function FormCompletionIndicator({
  completion,
  hasStarted,
  status,
  requiredCompleted,
  requiredTotal,
  optionalCompleted,
  optionalTotal,
  missingRequired = [],
  className,
  showDetails = true,
}: FormCompletionIndicatorProps) {
  // Don't show anything if user hasn't started
  if (!hasStarted) {
    return null;
  }

  const statusConfig = {
    'not-started': {
      icon: Circle,
      color: 'text-gray-400',
      bgColor: 'bg-gray-100',
      progressColor: 'bg-gray-400',
      label: 'Not Started',
    },
    'in-progress': {
      icon: AlertCircle,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      progressColor: 'bg-blue-500',
      label: 'In Progress',
    },
    completed: {
      icon: CheckCircle2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      progressColor: 'bg-green-500',
      label: 'Complete',
    },
  };

  const config = statusConfig[status];
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        'rounded-lg border p-4 space-y-3 transition-all',
        config.bgColor,
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <StatusIcon className={cn('h-5 w-5', config.color)} />
          <span className="text-sm font-medium text-gray-900">
            Form Completion
          </span>
        </div>
        <Badge
          variant={status === 'completed' ? 'default' : 'secondary'}
          className={cn(
            'text-xs',
            status === 'completed' && 'bg-green-600 hover:bg-green-700'
          )}
        >
          {completion}%
        </Badge>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <Progress
          value={completion}
          className="h-2"
          indicatorClassName={config.progressColor}
        />

        {showDetails && (
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>
              Required: {requiredCompleted}/{requiredTotal}
            </span>
            {optionalTotal !== undefined && optionalTotal > 0 && (
              <span>
                Optional: {optionalCompleted}/{optionalTotal}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Missing Required Fields */}
      {missingRequired.length > 0 && showDetails && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-1">
            Missing required fields:
          </p>
          <ul className="text-xs text-gray-600 space-y-0.5 ml-4">
            {missingRequired.slice(0, 5).map(field => (
              <li key={field} className="list-disc">
                {formatFieldName(field)}
              </li>
            ))}
            {missingRequired.length > 5 && (
              <li className="list-disc text-gray-500">
                and {missingRequired.length - 5} more...
              </li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Compact variant - shows only progress bar
 */
export function FormCompletionBar({
  completion,
  hasStarted,
  status,
  className,
}: Pick<FormCompletionIndicatorProps, 'completion' | 'hasStarted' | 'status' | 'className'>) {
  if (!hasStarted) {
    return null;
  }

  const statusColor = {
    'not-started': 'bg-gray-400',
    'in-progress': 'bg-blue-500',
    completed: 'bg-green-500',
  };

  return (
    <div className={cn('space-y-1', className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-600">Form Progress</p>
        <p className="text-xs font-semibold text-gray-900">{completion}%</p>
      </div>
      <Progress
        value={completion}
        className="h-1.5"
        indicatorClassName={statusColor[status]}
      />
    </div>
  );
}

/**
 * Convert camelCase or snake_case field names to readable format
 */
function formatFieldName(fieldName: string): string {
  return fieldName
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, c => c.toUpperCase())
    .trim();
}

