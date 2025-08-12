'use client';

import React, { useState } from 'react';
import { useBookingOperations } from '@/hooks/useBookings';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Loader2,
  CheckCircle,
  XCircle,
  PlayCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import type { BookingStatus } from '@/types/booking';

interface BookingActionsProps {
  bookingId: string;
  currentStatus: BookingStatus;
  onStatusChange?: (newStatus: BookingStatus) => void;
  userRole: 'client' | 'provider' | 'admin' | 'manager';
  isOwner: boolean;
}

const statusConfig = {
  pending: {
    label: 'Pending',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Clock,
    actions: {
      client: ['cancel'],
      provider: ['confirm', 'cancel'],
      admin: ['confirm', 'cancel'],
      manager: ['confirm', 'cancel'],
    },
  },
  confirmed: {
    label: 'Confirmed',
    color: 'bg-blue-100 text-blue-800',
    icon: CheckCircle,
    actions: {
      client: ['cancel'],
      provider: ['start', 'cancel'],
      admin: ['start', 'cancel'],
      manager: ['start', 'cancel'],
    },
  },
  in_progress: {
    label: 'In Progress',
    color: 'bg-orange-100 text-orange-800',
    icon: PlayCircle,
    actions: {
      client: [],
      provider: ['complete'],
      admin: ['complete'],
      manager: ['complete'],
    },
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-800',
    icon: CheckCircle,
    actions: {
      client: [],
      provider: [],
      admin: [],
      manager: [],
    },
  },
  cancelled: {
    label: 'Cancelled',
    color: 'bg-red-100 text-red-800',
    icon: XCircle,
    actions: {
      client: [],
      provider: [],
      admin: [],
      manager: [],
    },
  },
  refunded: {
    label: 'Refunded',
    color: 'bg-gray-100 text-gray-800',
    icon: XCircle,
    actions: {
      client: [],
      provider: [],
      admin: [],
      manager: [],
    },
  },
  no_show: {
    label: 'No Show',
    color: 'bg-red-100 text-red-800',
    icon: AlertCircle,
    actions: {
      client: [],
      provider: [],
      admin: [],
      manager: [],
    },
  },
};

export function BookingActions({
  bookingId,
  currentStatus,
  onStatusChange,
  userRole,
  isOwner,
}: BookingActionsProps) {
  const { updateStatus, loading, error, clearError } = useBookingOperations();

  const [localStatus, setLocalStatus] = useState<BookingStatus>(currentStatus);

  const config = statusConfig[currentStatus];
  const IconComponent = config.icon;

  const allowedActions = config.actions[userRole] || [];

  // Only show actions if user is owner or has admin/manager role
  const canPerformActions = isOwner || ['admin', 'manager'].includes(userRole);

  const handleStatusChange = async (newStatus: BookingStatus) => {
    try {
      await updateStatus(bookingId, newStatus);
      setLocalStatus(newStatus);
      onStatusChange?.(newStatus);
    } catch (err) {
      // Error is already handled by the hook
      console.error('Failed to update status:', err);
    }
  };

  const getActionButton = (action: string) => {
    const actionConfig = {
      confirm: {
        label: 'Confirm',
        variant: 'default' as const,
        onClick: () => handleStatusChange('confirmed'),
        icon: CheckCircle,
      },
      cancel: {
        label: 'Cancel',
        variant: 'destructive' as const,
        onClick: () => handleStatusChange('cancelled'),
        icon: XCircle,
      },
      start: {
        label: 'Start',
        variant: 'default' as const,
        onClick: () => handleStatusChange('in_progress'),
        icon: PlayCircle,
      },
      complete: {
        label: 'Complete',
        variant: 'default' as const,
        onClick: () => handleStatusChange('completed'),
        icon: CheckCircle,
      },
    };

    const config = actionConfig[action as keyof typeof actionConfig];
    if (!config) return null;

    const IconComponent = config.icon;

    return (
      <Button
        key={action}
        variant={config.variant}
        size='sm'
        onClick={config.onClick}
        disabled={loading}
        className='flex items-center gap-2'
      >
        {loading ? (
          <Loader2 className='h-4 w-4 animate-spin' />
        ) : (
          <IconComponent className='h-4 w-4' />
        )}
        {config.label}
      </Button>
    );
  };

  return (
    <Card className='w-full'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <IconComponent className='h-5 w-5' />
          Booking Status
        </CardTitle>
        <CardDescription>Current status and available actions</CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Current Status */}
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Current Status:</span>
          <Badge className={config.color}>{config.label}</Badge>
        </div>

        {/* Error Display */}
        {error && (
          <Alert variant='destructive'>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              {error}
              <Button
                variant='ghost'
                size='sm'
                onClick={clearError}
                className='ml-2 h-auto p-1'
              >
                Dismiss
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        {canPerformActions && allowedActions.length > 0 && (
          <div className='space-y-2'>
            <span className='text-sm font-medium'>Actions:</span>
            <div className='flex flex-wrap gap-2'>
              {allowedActions.map(action => getActionButton(action))}
            </div>
          </div>
        )}

        {/* No Actions Available */}
        {canPerformActions && allowedActions.length === 0 && (
          <div className='text-sm text-muted-foreground'>
            No actions available for this status
          </div>
        )}

        {/* Insufficient Permissions */}
        {!canPerformActions && (
          <div className='text-sm text-muted-foreground'>
            You don't have permission to perform actions on this booking
          </div>
        )}

        {/* Status Change History */}
        <div className='pt-4 border-t'>
          <span className='text-sm font-medium'>Status History:</span>
          <div className='mt-2 text-sm text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <Clock className='h-3 w-3' />
              <span>Created: {new Date().toLocaleDateString()}</span>
            </div>
            {localStatus !== currentStatus && (
              <div className='flex items-center gap-2'>
                <CheckCircle className='h-3 w-3' />
                <span>Updated: {new Date().toLocaleDateString()}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
