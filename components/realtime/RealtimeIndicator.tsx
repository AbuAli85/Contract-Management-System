'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

/**
 * Real-time Connection Indicator
 * 
 * Shows connection status to Supabase Realtime
 * 
 * @example
 * ```tsx
 * <RealtimeIndicator className="fixed bottom-4 right-4" />
 * ```
 */
export function RealtimeIndicator({ className }: { className?: string }) {
  const [isConnected, setIsConnected] = useState(false);
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel('connection-status');

    channel
      .on('system', {}, (payload) => {
        if (payload.status === 'SUBSCRIBED') {
          setIsConnected(true);
          setShowIndicator(true);
          // Hide after 3 seconds if connected
          setTimeout(() => setShowIndicator(false), 3000);
        } else if (payload.status === 'CLOSED') {
          setIsConnected(false);
          setShowIndicator(true);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  if (!showIndicator) return null;

  return (
    <div
      className={cn(
        'flex items-center space-x-2 px-3 py-2 rounded-lg text-sm',
        'transition-all duration-300',
        isConnected
          ? 'bg-green-100 text-green-700'
          : 'bg-red-100 text-red-700',
        className
      )}
      role="status"
      aria-live="polite"
    >
      {isConnected ? (
        <>
          <Wifi size={16} className="animate-pulse" />
          <span>Real-time connected</span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span>Connection lost</span>
        </>
      )}
    </div>
  );
}

/**
 * Real-time Status Badge
 * Minimal indicator for navbar/header
 */
export function RealtimeStatusBadge() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel('status-badge');

    channel
      .on('system', {}, (payload) => {
        setIsConnected(payload.status === 'SUBSCRIBED');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div
      className="flex items-center space-x-1 text-xs"
      title={isConnected ? 'Real-time connected' : 'Connecting...'}
    >
      <div
        className={cn(
          'w-2 h-2 rounded-full',
          isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
        )}
      />
      <span className="text-gray-600">Live</span>
    </div>
  );
}

