'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Bell, 
  BellRing, 
  Clock, 
  AlertTriangle, 
  ExternalLink,
  Eye,
  CheckCheck,
  Filter
} from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications-enhanced'
import { formatDistanceToNow } from 'date-fns'
import { useRouter } from '@/navigation'

interface DashboardNotificationsProps {
  onRefresh?: () => void
  maxItems?: number
  compact?: boolean
}

export function DashboardNotifications({ 
  onRefresh, 
  maxItems = 5,
  compact = true 
}: DashboardNotificationsProps) {
  const router = useRouter()
  const {
    notifications,
    summary,
    loading,
    error,
    unreadCount,
    hasUnread,
    markAsRead,
    markAllAsRead,
    refresh,
    getNotificationIcon
  } = useNotifications()

  const displayNotifications = notifications.slice(0, maxItems)

  const handleNotificationClick = async (notification: any) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead([notification.id])
    }

    // Navigate to action URL if available
    if (notification.action?.url) {
      router.push(notification.action.url)
    }
  }

  const handleViewAll = () => {
    router.push('/notifications')
  }

  const getTypeIcon = (type: string) => {
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

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  if (loading && notifications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Notifications Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-2">{error}</p>
          <Button onClick={refresh} variant="outline" size="sm">
            Try Again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5" />
            Recent Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {hasUnread && (
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={markAllAsRead}
                className="text-xs"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Mark All Read
              </Button>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleViewAll}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View All
            </Button>
          </div>
        </div>
        
        {/* Quick Stats */}
        {summary && !compact && (
          <div className="grid grid-cols-4 gap-2 mt-2">
            <div className="text-center">
              <div className="text-sm font-semibold">{summary.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-red-600">{summary.high}</div>
              <div className="text-xs text-gray-500">High</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-yellow-600">{summary.medium}</div>
              <div className="text-xs text-gray-500">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-sm font-semibold text-orange-600">{summary.unread}</div>
              <div className="text-xs text-gray-500">Unread</div>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          {displayNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No notifications</p>
            </div>
          ) : (
            <div className="space-y-1">
              {displayNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-3 border-b last:border-b-0 transition-all duration-200 hover:bg-gray-50 cursor-pointer
                    ${!notification.read ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''}
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 mt-0.5">
                      <span className="text-lg">
                        {getNotificationIcon(notification.type, notification.category)}
                      </span>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className={`text-sm font-medium mb-1 ${!notification.read ? 'font-semibold' : ''}`}>
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full inline-block" />
                            )}
                          </h4>
                          
                          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-3 text-xs text-gray-500">
                            <span>
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </span>
                            
                            <Badge 
                              variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {notification.priority}
                            </Badge>
                            
                            {notification.entity && (
                              <span className="truncate">• {notification.entity}</span>
                            )}
                          </div>
                        </div>
                        
                        {notification.action && (
                          <div className="flex-shrink-0 ml-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              className="text-xs h-6 px-2"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleNotificationClick(notification)
                              }}
                            >
                              {notification.action.label}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {notifications.length > maxItems && (
          <div className="p-3 border-t bg-gray-50">
            <Button 
              variant="ghost" 
              size="sm" 
              className="w-full text-sm"
              onClick={handleViewAll}
            >
              View {notifications.length - maxItems} more notifications
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
