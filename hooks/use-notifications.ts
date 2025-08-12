import { useState, useEffect } from 'react';

export interface Notification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: string;
  action?: {
    label: string;
    url: string;
  };
  entity?: string;
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/dashboard/notifications', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          Pragma: 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch notifications');
      }

      const data = await response.json();
      setNotifications(data || []);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const totalCount = notifications.length;
  const highPriorityCount = notifications.filter(
    n => n.priority === 'high'
  ).length;
  const mediumPriorityCount = notifications.filter(
    n => n.priority === 'medium'
  ).length;
  const lowPriorityCount = notifications.filter(
    n => n.priority === 'low'
  ).length;

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === 'high') {
      switch (type) {
        case 'error':
          return 'text-red-600 bg-red-50 border-red-200';
        case 'warning':
          return 'text-orange-600 bg-orange-50 border-orange-200';
        case 'info':
          return 'text-blue-600 bg-blue-50 border-blue-200';
        case 'success':
          return 'text-green-600 bg-green-50 border-green-200';
        default:
          return 'text-red-600 bg-red-50 border-red-200';
      }
    } else if (priority === 'medium') {
      switch (type) {
        case 'error':
          return 'text-red-500 bg-red-25 border-red-100';
        case 'warning':
          return 'text-yellow-600 bg-yellow-50 border-yellow-200';
        case 'info':
          return 'text-blue-500 bg-blue-25 border-blue-100';
        case 'success':
          return 'text-green-500 bg-green-25 border-green-100';
        default:
          return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      }
    } else {
      switch (type) {
        case 'error':
          return 'text-red-400 bg-red-25 border-red-100';
        case 'warning':
          return 'text-yellow-500 bg-yellow-25 border-yellow-100';
        case 'info':
          return 'text-blue-400 bg-blue-25 border-blue-100';
        case 'success':
          return 'text-green-400 bg-green-25 border-green-100';
        default:
          return 'text-gray-500 bg-gray-25 border-gray-100';
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return '🔴';
      case 'warning':
        return '🟡';
      case 'info':
        return '🔵';
      case 'success':
        return '🟢';
      default:
        return '⚪';
    }
  };

  return {
    notifications,
    loading,
    error,
    totalCount,
    highPriorityCount,
    mediumPriorityCount,
    lowPriorityCount,
    fetchNotifications,
    getNotificationColor,
    getNotificationIcon,
  };
}
