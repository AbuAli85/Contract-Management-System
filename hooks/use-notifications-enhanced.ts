'use client'

import { useState, useEffect, useCallback } from 'react'

export interface NotificationData {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  category: 'contract' | 'promoter' | 'document' | 'system' | 'reminder'
  priority: 'high' | 'medium' | 'low'
  title: string
  message: string
  timestamp: string
  read: boolean
  action?: {
    label: string
    url: string
  }
  entity?: string
  metadata?: {
    contractId?: string
    promoterId?: string
    partyId?: string
    daysUntilExpiry?: number
    expiryDate?: string
  }
}

interface NotificationSummary {
  total: number
  unread: number
  high: number
  medium: number
  low: number
  categories: {
    contract: number
    promoter: number
    document: number
    system: number
    reminder: number
  }
}

interface NotificationFilters {
  category?: string
  priority?: string
  unreadOnly?: boolean
  limit?: number
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [summary, setSummary] = useState<NotificationSummary | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastFetch, setLastFetch] = useState<Date | null>(null)

  const fetchNotifications = useCallback(async (filters: NotificationFilters = {}) => {
    try {
      setLoading(true)
      setError(null)
      
      const params = new URLSearchParams()
      if (filters.category) params.append('category', filters.category)
      if (filters.priority) params.append('priority', filters.priority)
      if (filters.unreadOnly) params.append('unread_only', 'true')
      if (filters.limit) params.append('limit', filters.limit.toString())

      const response = await fetch(`/api/dashboard/notifications?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch notifications: ${response.status}`)
      }

      const data = await response.json()
      
      if (data.error) {
        throw new Error(data.error)
      }

      setNotifications(data.notifications || [])
      setSummary(data.summary || null)
      setLastFetch(new Date())
      
    } catch (err) {
      console.error('Fetch notifications error:', err)
      setError(err instanceof Error ? err.message : 'Unknown error')
      setNotifications([])
      setSummary(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/dashboard/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_read',
          notificationIds
        })
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          Array.isArray(prev) ? prev.map(notification => 
            notificationIds.includes(notification.id) 
              ? { ...notification, read: true }
              : notification
          ) : []
        )
        
        // Update summary
        setSummary(prev => prev ? {
          ...prev,
          unread: prev.unread - notificationIds.length
        } : null)
      }
    } catch (error) {
      console.error('Failed to mark notifications as read:', error)
    }
  }, [])

  const markAsUnread = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/dashboard/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_unread',
          notificationIds
        })
      })

      if (response.ok) {
        // Update local state
        setNotifications(prev => 
          Array.isArray(prev) ? prev.map(notification => 
            notificationIds.includes(notification.id) 
              ? { ...notification, read: false }
              : notification
          ) : []
        )
        
        // Update summary
        setSummary(prev => prev ? {
          ...prev,
          unread: prev.unread + notificationIds.length
        } : null)
      }
    } catch (error) {
      console.error('Failed to mark notifications as unread:', error)
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    try {
      // Ensure notifications is an array before filtering
      const safeNotifications = Array.isArray(notifications) ? notifications : []
      const unreadIds = safeNotifications.filter(n => !n.read).map(n => n.id)
      if (unreadIds.length === 0) return

      const response = await fetch('/api/dashboard/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'mark_read',
          markAll: true
        })
      })

      if (response.ok) {
        // Mark all as read
        setNotifications(prev => 
          Array.isArray(prev) ? prev.map(notification => ({ ...notification, read: true })) : []
        )
        
        // Update summary
        setSummary(prev => prev ? { ...prev, unread: 0 } : null)
      }
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error)
    }
  }, [notifications])

  const deleteNotifications = useCallback(async (notificationIds: string[]) => {
    try {
      const response = await fetch('/api/dashboard/notifications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'delete',
          notificationIds
        })
      })

      if (response.ok) {
        // Remove from local state
        setNotifications(prev => 
          Array.isArray(prev) ? prev.filter(notification => !notificationIds.includes(notification.id)) : []
        )
        
        // Update summary
        const safeNotifications = Array.isArray(notifications) ? notifications : []
        const deletedUnread = safeNotifications.filter(n => 
          notificationIds.includes(n.id) && !n.read
        ).length
        
        setSummary(prev => prev ? {
          ...prev,
          total: prev.total - notificationIds.length,
          unread: prev.unread - deletedUnread
        } : null)
      }
    } catch (error) {
      console.error('Failed to delete notifications:', error)
    }
  }, [notifications])

  const refresh = useCallback(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    fetchNotifications()
    
    const interval = setInterval(() => {
      fetchNotifications()
    }, 5 * 60 * 1000) // 5 minutes

    return () => clearInterval(interval)
  }, [fetchNotifications])

  // Computed values
  const unreadCount = summary?.unread || 0
  const highPriorityCount = summary?.high || 0
  const hasUnread = unreadCount > 0
  const hasHighPriority = highPriorityCount > 0

  // Helper functions for styling
  const getNotificationColor = (type: string, priority: string, read: boolean) => {
    const opacity = read ? '0.6' : '1'
    
    if (priority === 'high') {
      switch (type) {
        case 'error':
          return `text-red-600 bg-red-50 border-red-200 opacity-${opacity}`
        case 'warning':
          return `text-orange-600 bg-orange-50 border-orange-200 opacity-${opacity}`
        case 'info':
          return `text-blue-600 bg-blue-50 border-blue-200 opacity-${opacity}`
        case 'success':
          return `text-green-600 bg-green-50 border-green-200 opacity-${opacity}`
        default:
          return `text-red-600 bg-red-50 border-red-200 opacity-${opacity}`
      }
    } else if (priority === 'medium') {
      switch (type) {
        case 'error':
          return `text-red-500 bg-red-25 border-red-100 opacity-${opacity}`
        case 'warning':
          return `text-yellow-600 bg-yellow-50 border-yellow-200 opacity-${opacity}`
        case 'info':
          return `text-blue-500 bg-blue-25 border-blue-100 opacity-${opacity}`
        case 'success':
          return `text-green-500 bg-green-25 border-green-100 opacity-${opacity}`
        default:
          return `text-yellow-600 bg-yellow-50 border-yellow-200 opacity-${opacity}`
      }
    } else {
      switch (type) {
        case 'error':
          return `text-red-400 bg-red-25 border-red-100 opacity-${opacity}`
        case 'warning':
          return `text-yellow-500 bg-yellow-25 border-yellow-100 opacity-${opacity}`
        case 'info':
          return `text-blue-400 bg-blue-25 border-blue-100 opacity-${opacity}`
        case 'success':
          return `text-green-400 bg-green-25 border-green-100 opacity-${opacity}`
        default:
          return `text-gray-500 bg-gray-25 border-gray-100 opacity-${opacity}`
      }
    }
  }

  const getNotificationIcon = (type: string, category: string) => {
    switch (category) {
      case 'contract':
        return '📄'
      case 'promoter':
        return '👤'
      case 'document':
        return '📋'
      case 'system':
        return '⚙️'
      case 'reminder':
        return '⏰'
      default:
        switch (type) {
          case 'error':
            return '🔴'
          case 'warning':
            return '🟡'
          case 'info':
            return '🔵'
          case 'success':
            return '🟢'
          default:
            return '⚪'
        }
    }
  }

  return {
    notifications,
    summary,
    loading,
    error,
    lastFetch,
    unreadCount,
    highPriorityCount,
    hasUnread,
    hasHighPriority,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotifications,
    refresh,
    getNotificationColor,
    getNotificationIcon
  }
}
