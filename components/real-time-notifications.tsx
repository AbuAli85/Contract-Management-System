'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Bell, X, Calendar, DollarSign, User, Clock, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useToast } from '@/hooks/use-toast'

interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'booking_created' | 'booking_updated' | 'payment_received' | 'review_received' | 'system' | 'reminder'
  metadata: {
    booking_id?: string
    booking_number?: string
    client_name?: string
    service_title?: string
    amount?: number
    status?: string
    [key: string]: any
  }
  read: boolean
  created_at: string
  expires_at?: string
}

interface User {
  id: string
  role: string
  email: string
  full_name: string
}

interface RealTimeNotificationsProps {
  user: User
  className?: string
}

export function RealTimeNotifications({ user, className }: RealTimeNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()
  const { toast } = useToast()

  // Load initial notifications
  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(50)

        if (error) throw error

        setNotifications(data || [])
        setUnreadCount(data?.filter(n => !n.read).length || 0)
      } catch (error) {
        console.error('Error loading notifications:', error)
        toast({
          title: "Failed to load notifications",
          description: "Please refresh the page to try again.",
          variant: 'destructive'
        })
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()
  }, [user.id, supabase, toast])

  // Set up real-time subscription
  useEffect(() => {
    console.log('🔔 Setting up real-time notifications for user:', user.id)

    const subscription = supabase
      .channel(`notifications:${user.id}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('📩 New notification received:', payload.new)
          
          const newNotification = payload.new as Notification
          
          // Add to notifications list
          setNotifications(current => [newNotification, ...current])
          setUnreadCount(current => current + 1)

          // Show toast for immediate feedback
          toast({
            title: newNotification.title,
            description: newNotification.message,
            duration: 5000,
          })

          // Play notification sound (optional)
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(newNotification.title, {
              body: newNotification.message,
              icon: '/notification-icon.png'
            })
          }
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('📝 Notification updated:', payload.new)
          
          const updatedNotification = payload.new as Notification
          
          setNotifications(current => 
            current.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            )
          )

          // Update unread count if read status changed
          if (updatedNotification.read) {
            setUnreadCount(current => Math.max(0, current - 1))
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status)
      })

    return () => {
      console.log('🔌 Cleaning up notification subscription')
      supabase.removeChannel(subscription)
    }
  }, [user.id, supabase, toast])

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error

      // Optimistically update local state
      setNotifications(current =>
        current.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      )
      setUnreadCount(current => Math.max(0, current - 1))

    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
      
      if (unreadIds.length === 0) return

      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', unreadIds)

      if (error) throw error

      setNotifications(current =>
        current.map(n => ({ ...n, read: true }))
      )
      setUnreadCount(0)

      toast({
        title: "All notifications marked as read",
        duration: 2000
      })

    } catch (error) {
      console.error('Error marking all as read:', error)
      toast({
        title: "Failed to mark notifications as read",
        variant: 'destructive'
      })
    }
  }

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error

      const notification = notifications.find(n => n.id === notificationId)
      
      setNotifications(current => 
        current.filter(n => n.id !== notificationId)
      )

      if (notification && !notification.read) {
        setUnreadCount(current => Math.max(0, current - 1))
      }

    } catch (error) {
      console.error('Error deleting notification:', error)
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'booking_created':
        return <Calendar className="w-4 h-4 text-blue-600" />
      case 'booking_updated':
        return <Clock className="w-4 h-4 text-orange-600" />
      case 'payment_received':
        return <DollarSign className="w-4 h-4 text-green-600" />
      case 'review_received':
        return <User className="w-4 h-4 text-purple-600" />
      case 'system':
        return <Info className="w-4 h-4 text-gray-600" />
      case 'reminder':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />
      default:
        return <Bell className="w-4 h-4 text-gray-600" />
    }
  }

  const getNotificationBadgeColor = (type: string) => {
    switch (type) {
      case 'booking_created':
        return 'bg-blue-100 text-blue-800'
      case 'booking_updated':
        return 'bg-orange-100 text-orange-800'
      case 'payment_received':
        return 'bg-green-100 text-green-800'
      case 'review_received':
        return 'bg-purple-100 text-purple-800'
      case 'system':
        return 'bg-gray-100 text-gray-800'
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMins / 60)
    const diffDays = Math.floor(diffHours / 24)

    if (diffMins < 1) return 'Just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  return (
    <div className={`relative ${className}`}>
      {/* Notification Bell */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            className="absolute -top-1 -right-1 px-1 min-w-[1.25rem] h-5 text-xs bg-red-500 hover:bg-red-500"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Notifications Panel */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-[80vh] shadow-lg border z-50">
          <CardHeader className="flex flex-row items-center justify-between py-3">
            <div>
              <CardTitle className="text-lg">Notifications</CardTitle>
              <CardDescription>
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={markAllAsRead}
                  className="text-xs"
                >
                  Mark all read
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {loading ? (
              <div className="p-4 text-center text-sm text-gray-500">
                Loading notifications...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No notifications yet</p>
                <p className="text-sm text-gray-400 mt-1">
                  You'll see new bookings and updates here
                </p>
              </div>
            ) : (
              <ScrollArea className="max-h-96">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`border-b p-4 hover:bg-gray-50 transition-colors ${
                      !notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </p>
                            <p className="text-sm text-gray-600 mt-1">
                              {notification.message}
                            </p>
                            
                            {/* Metadata */}
                            {notification.metadata && (
                              <div className="flex flex-wrap gap-2 mt-2">
                                {notification.metadata.booking_number && (
                                  <Badge variant="outline" className="text-xs">
                                    {notification.metadata.booking_number}
                                  </Badge>
                                )}
                                {notification.metadata.amount && (
                                  <Badge variant="outline" className="text-xs">
                                    ${notification.metadata.amount}
                                  </Badge>
                                )}
                                <Badge 
                                  className={`text-xs ${getNotificationBadgeColor(notification.type)}`}
                                >
                                  {notification.type.replace('_', ' ')}
                                </Badge>
                              </div>
                            )}
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteNotification(notification.id)}
                            className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-gray-500">
                            {formatTimeAgo(notification.created_at)}
                          </span>
                          
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => markAsRead(notification.id)}
                              className="text-xs text-blue-600 hover:text-blue-800"
                            >
                              Mark read
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// Hook for managing notifications
export function useNotifications(userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const supabase = createClientComponentClient()

  useEffect(() => {
    if (!userId) return

    const loadNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20)

        if (error) throw error

        setNotifications(data || [])
        setUnreadCount(data?.filter(n => !n.read).length || 0)
      } catch (error) {
        console.error('Error loading notifications:', error)
      } finally {
        setLoading(false)
      }
    }

    loadNotifications()

    // Set up real-time subscription
    const subscription = supabase
      .channel(`notifications:${userId}`)
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        }, 
        (payload) => {
          const newNotification = payload.new as Notification
          setNotifications(current => [newNotification, ...current])
          setUnreadCount(current => current + 1)
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public', 
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const updatedNotification = payload.new as Notification
          setNotifications(current => 
            current.map(n => 
              n.id === updatedNotification.id ? updatedNotification : n
            )
          )
          if (updatedNotification.read) {
            setUnreadCount(current => Math.max(0, current - 1))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(subscription)
    }
  }, [userId, supabase])

  return {
    notifications,
    unreadCount,
    loading
  }
}
