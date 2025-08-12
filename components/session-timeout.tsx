'use client';

import { useState, useEffect } from 'react';
import { useSessionTimeout } from '@/hooks/use-session-timeout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, Shield, AlertTriangle } from 'lucide-react';

interface SessionTimeoutProps {
  timeoutMinutes?: number;
  warningMinutes?: number;
  showStatus?: boolean;
}

export function SessionTimeout({
  timeoutMinutes = 5,
  warningMinutes = 1,
  showStatus = false,
}: SessionTimeoutProps) {
  const [timeRemaining, setTimeRemaining] = useState<number>(
    timeoutMinutes * 60
  );
  const [showWarning, setShowWarning] = useState<boolean>(false);

  const { getTimeRemaining, resetTimers } = useSessionTimeout({
    timeoutMinutes,
    warningMinutes,
    onTimeout: () => {
      // Custom timeout handler if needed
      console.log('Session timeout triggered');
    },
  });

  // Update time remaining
  useEffect(() => {
    const interval = setInterval(() => {
      const remaining = getTimeRemaining();
      setTimeRemaining(remaining);

      // Show warning when time is running out
      if (remaining <= warningMinutes * 60 && remaining > 0) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [getTimeRemaining, warningMinutes]);

  // Calculate progress percentage
  const progressPercentage =
    ((timeoutMinutes * 60 - timeRemaining) / (timeoutMinutes * 60)) * 100;

  // Format time remaining
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!showStatus) {
    return null;
  }

  return (
    <div className='fixed bottom-4 right-4 z-50'>
      <Card
        className={`w-80 transition-all duration-300 ${showWarning ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}
      >
        <CardHeader className='pb-2'>
          <CardTitle className='flex items-center gap-2 text-sm'>
            <Clock className='h-4 w-4' />
            Session Timeout
            {showWarning && (
              <AlertTriangle className='h-4 w-4 text-orange-500' />
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className='space-y-3'>
          {/* Progress Bar */}
          <div className='space-y-1'>
            <div className='flex justify-between text-xs text-gray-600'>
              <span>Time Remaining</span>
              <span
                className={showWarning ? 'text-orange-600 font-medium' : ''}
              >
                {formatTime(timeRemaining)}
              </span>
            </div>
            <Progress
              value={progressPercentage}
              className={`h-2 ${showWarning ? 'bg-orange-100' : ''}`}
            />
          </div>

          {/* Warning Alert */}
          {showWarning && (
            <Alert className='border-orange-200 bg-orange-50'>
              <AlertTriangle className='h-4 w-4 text-orange-600' />
              <AlertDescription className='text-orange-800'>
                Your session will expire soon. Click anywhere to extend.
              </AlertDescription>
            </Alert>
          )}

          {/* Status Info */}
          <div className='flex items-center gap-2 text-xs text-gray-600'>
            <Shield className='h-3 w-3' />
            <span>
              Auto-logout after {timeoutMinutes} minutes of inactivity
            </span>
          </div>

          {/* Extend Session Button */}
          <Button
            size='sm'
            variant='outline'
            onClick={resetTimers}
            className='w-full'
          >
            Extend Session
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
