"use client"

import React, { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Bell,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle,
  X,
  ExternalLink,
  Clock,
  Calendar,
  FileText,
  Users
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface Notification {
  id: string
  type: 'error' | 'warning' | 'info' | 'success'
  priority: 'high' | 'medium' | 'low'
  title: string
  message: string
  timestamp: string
  action?: {
    label: string
    url: string
  }
  entity?: string
}

interface DashboardNotificationsProps {
  notifications: Notification[]
  onRefresh?: () => void
}

export function DashboardNotifications({ notifications, onRefresh }: DashboardNotificationsProps) {
  const [dismissedNotifications, setDismissedNotifications] = useState<Set<string>>(new Set())

  const visibleNotifications = notifications.filter(n => !dismissedNotifications.has(n.id))
  const highPriorityCount = visibleNotifications.filter(n => n.priority === 'high').length
  const totalCount = visibleNotifications.length

  const dismissNotification = (id: string) => {
    setDismissedNotifications(prev => new Set([...prev, id]))
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Bell className="h-4 w-4 text-gray-500" />
    }
  }

  const getNotificationBorder = (type: string, priority: string) => {
    if (priority === 'high') {
      return 'border-l-4 border-l-red-500'
    }
    switch (type) {
      case 'error':
        return 'border-l-4 border-l-red-500'
      case 'warning':
        return 'border-l-4 border-l-yellow-500'
      case 'info':
        return 'border-l-4 border-l-blue-500'
      case 'success':
        return 'border-l-4 border-l-green-500'
      default:
        return 'border-l-4 border-l-gray-300'
    }
  }

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <div className="relative">
              <Bell className="h-5 w-5 text-orange-600" />
              {highPriorityCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {highPriorityCount}
                </span>
              )}
            </div>
            Notifications
          </CardTitle>
          <CardDescription>
            {totalCount > 0 ? `${totalCount} active notifications` : 'No active notifications'}
            {highPriorityCount > 0 && (
              <span className="ml-2 text-red-600 font-medium">
                ({highPriorityCount} high priority)
              </span>
            )}
          </CardDescription>
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {visibleNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center shadow-lg">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">All caught up!</h3>
            <p className="text-slate-600 max-w-md leading-relaxed mb-6 font-medium">
              No notifications require your attention right now. We'll notify you when something important happens.
            </p>
            <div className="flex items-center gap-3 text-sm text-slate-500 bg-green-50 px-4 py-2 rounded-full border border-green-200">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
              <span className="font-medium">System monitoring active</span>
            </div>
          </div>
        ) : (
          <div className="h-[400px] overflow-y-auto pr-4">
            <div className="space-y-3">
              {visibleNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={cn(
                    "relative rounded-lg border p-4 hover:bg-accent/50 transition-colors",
                    getNotificationBorder(notification.type, notification.priority)
                  )}
                >
                  {/* Dismiss button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 h-6 w-6 p-0 hover:bg-gray-200"
                    onClick={() => dismissNotification(notification.id)}
                  >
                    <X className="h-3 w-3" />
                  </Button>

                  <div className="flex items-start gap-3 pr-6">
                    {/* Icon */}
                    <div className="mt-0.5">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-medium">{notification.title}</h4>
                        <Badge 
                          variant={notification.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {notification.priority}
                        </Badge>
                      </div>
                      
                      <p className="text-sm text-muted-foreground">
                        {notification.message}
                      </p>

                      {notification.entity && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Users className="h-3 w-3" />
                          {notification.entity}
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                        </div>

                        {notification.action && (
                          <Link href={notification.action.url}>
                            <Button variant="outline" size="sm" className="h-7 text-xs">
                              {notification.action.label}
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {visibleNotifications.length > 5 && (
                <div className="text-center pt-4">
                  <Button variant="outline" size="sm">
                    View All Notifications
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
