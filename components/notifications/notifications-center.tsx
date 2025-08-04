'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Bell, 
  BellRing, 
  CheckCheck, 
  Trash2, 
  Filter, 
  RefreshCw,
  Eye,
  EyeOff,
  AlertTriangle,
  Info,
  CheckCircle,
  XCircle,
  Calendar,
  Users,
  FileText,
  Settings,
  Clock
} from 'lucide-react'
import { useNotifications } from '@/hooks/use-notifications-enhanced'
import { format, formatDistanceToNow } from 'date-fns'
import { useRouter } from '@/navigation'

interface NotificationsCenterProps {
  maxHeight?: string
  showFilters?: boolean
  compact?: boolean
}

export function NotificationsCenter({ 
  maxHeight = '600px', 
  showFilters = true,
  compact = false 
}: NotificationsCenterProps) {
  const router = useRouter()
  const {
    notifications,
    summary,
    loading,
    error,
    lastFetch,
    unreadCount,
    hasUnread,
    fetchNotifications,
    markAsRead,
    markAsUnread,
    markAllAsRead,
    deleteNotifications,
    refresh,
    getNotificationColor,
    getNotificationIcon
  } = useNotifications()

  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [filters, setFilters] = useState({
    category: '',
    priority: '',
    unreadOnly: false
  })
  const [showBulkActions, setShowBulkActions] = useState(false)

  const filteredNotifications = useMemo(() => {
    // Ensure notifications is always an array
    const safeNotifications = Array.isArray(notifications) ? notifications : []
    let filtered = safeNotifications

    if (filters.category) {
      filtered = filtered.filter(n => n.category === filters.category)
    }

    if (filters.priority) {
      filtered = filtered.filter(n => n.priority === filters.priority)
    }

    if (filters.unreadOnly) {
      filtered = filtered.filter(n => !n.read)
    }

    return filtered
  }, [notifications, filters])

  const handleSelectAll = () => {
    if (selectedIds.length === filteredNotifications.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filteredNotifications.map(n => n.id))
    }
  }

  const handleSelectNotification = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(x => x !== id)
        : [...prev, id]
    )
  }

  const handleMarkSelectedAsRead = async () => {
    if (selectedIds.length > 0) {
      await markAsRead(selectedIds)
      setSelectedIds([])
    }
  }

  const handleMarkSelectedAsUnread = async () => {
    if (selectedIds.length > 0) {
      await markAsUnread(selectedIds)
      setSelectedIds([])
    }
  }

  const handleDeleteSelected = async () => {
    if (selectedIds.length > 0) {
      await deleteNotifications(selectedIds)
      setSelectedIds([])
    }
  }

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

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case 'medium':
        return <Info className="h-4 w-4 text-yellow-500" />
      case 'low':
        return <Clock className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'contract':
        return <FileText className="h-4 w-4" />
      case 'promoter':
        return <Users className="h-4 w-4" />
      case 'document':
        return <Calendar className="h-4 w-4" />
      case 'system':
        return <Settings className="h-4 w-4" />
      case 'reminder':
        return <Clock className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      default:
        return <Info className="h-4 w-4" />
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
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
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
            <XCircle className="h-5 w-5" />
            Error Loading Notifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">{error}</p>
          <Button onClick={refresh} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
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
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {unreadCount}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {showFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowBulkActions(!showBulkActions)}
              >
                <Filter className="h-4 w-4" />
              </Button>
            )}
            
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
            
            {hasUnread && (
              <Button variant="outline" size="sm" onClick={markAllAsRead}>
                <CheckCheck className="h-4 w-4 mr-1" />
                Mark All Read
              </Button>
            )}
          </div>
        </div>

        {/* Summary Stats */}
        {summary && !compact && (
          <div className="grid grid-cols-5 gap-2 mt-4">
            <div className="text-center">
              <div className="text-lg font-semibold">{summary.total}</div>
              <div className="text-xs text-gray-500">Total</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-red-600">{summary.high}</div>
              <div className="text-xs text-gray-500">High</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-yellow-600">{summary.medium}</div>
              <div className="text-xs text-gray-500">Medium</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-blue-600">{summary.low}</div>
              <div className="text-xs text-gray-500">Low</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-orange-600">{summary.unread}</div>
              <div className="text-xs text-gray-500">Unread</div>
            </div>
          </div>
        )}

        {/* Filters */}
        {showFilters && showBulkActions && (
          <div className="space-y-4 mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="category-filter">Category</Label>
                <Select 
                  value={filters.category} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    <SelectItem value="contract">Contracts</SelectItem>
                    <SelectItem value="promoter">Promoters</SelectItem>
                    <SelectItem value="document">Documents</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    <SelectItem value="reminder">Reminders</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority-filter">Priority</Label>
                <Select 
                  value={filters.priority} 
                  onValueChange={(value) => setFilters(prev => ({ ...prev, priority: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Priorities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Priorities</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <Switch
                  id="unread-only"
                  checked={filters.unreadOnly}
                  onCheckedChange={(checked) => setFilters(prev => ({ ...prev, unreadOnly: checked }))}
                />
                <Label htmlFor="unread-only">Unread Only</Label>
              </div>
            </div>

            {/* Bulk Actions */}
            {filteredNotifications.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t">
                <Checkbox
                  id="select-all"
                  checked={selectedIds.length === filteredNotifications.length}
                  onCheckedChange={handleSelectAll}
                />
                <Label htmlFor="select-all" className="text-sm">
                  Select All ({selectedIds.length} selected)
                </Label>
                
                {selectedIds.length > 0 && (
                  <div className="flex gap-2 ml-auto">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleMarkSelectedAsRead}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Mark Read
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={handleMarkSelectedAsUnread}
                    >
                      <EyeOff className="h-4 w-4 mr-1" />
                      Mark Unread
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm" 
                      onClick={handleDeleteSelected}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-full" style={{ maxHeight }}>
          {filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No notifications found</p>
              {Object.values(filters).some(v => v) && (
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => setFilters({ category: '', priority: '', unreadOnly: false })}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2 p-4">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`
                    p-4 rounded-lg border transition-all duration-200 hover:shadow-md cursor-pointer
                    ${!notification.read ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}
                    ${selectedIds.includes(notification.id) ? 'ring-2 ring-blue-500' : ''}
                  `}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex items-start gap-3">
                    {showBulkActions && (
                      <Checkbox
                        checked={selectedIds.includes(notification.id)}
                        onCheckedChange={() => handleSelectNotification(notification.id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                    
                    <div className="flex-shrink-0">
                      {getTypeIcon(notification.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className={`text-sm font-medium ${!notification.read ? 'font-semibold' : ''}`}>
                              {notification.title}
                            </h4>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">
                            {notification.message}
                          </p>
                          
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(notification.category)}
                              <span className="capitalize">{notification.category}</span>
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {getPriorityIcon(notification.priority)}
                              <span className="capitalize">{notification.priority}</span>
                            </div>
                            
                            <span>
                              {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
                            </span>
                            
                            {notification.entity && (
                              <span>• {notification.entity}</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Badge variant={notification.priority === 'high' ? 'destructive' : 'secondary'}>
                            {notification.priority}
                          </Badge>
                          
                          {notification.action && (
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                handleNotificationClick(notification)
                              }}
                            >
                              {notification.action.label}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
        
        {lastFetch && (
          <div className="px-4 py-2 text-xs text-gray-500 border-t bg-gray-50">
            Last updated: {format(lastFetch, 'MMM d, yyyy HH:mm')}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
