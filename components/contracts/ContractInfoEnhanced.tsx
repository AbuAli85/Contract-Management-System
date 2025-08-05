// components/contracts/ContractInfoEnhanced.tsx
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import Link from "next/link"
import { 
  User, 
  Clock, 
  Bell, 
  CheckCircle, 
  AlertCircle, 
  Calendar,
  FileText,
  Download,
  Edit,
  RefreshCw
} from "lucide-react"
import { useContractActivity } from "@/lib/hooks/use-contract-activity"

interface ContractInfoEnhancedProps {
  contract: any
  contractId: string
  useRealData?: boolean // Toggle between mock and real data
}

// Mock data for demonstration - same as before but extracted for reuse
const mockActivityData = {
  addedBy: {
    id: "user-1",
    full_name: "Ahmed Hassan",
    email: "ahmed.hassan@company.com",
    avatar_url: "/avatars/ahmed.jpg",
    role: "Contract Manager"
  },
  lastUpdatedBy: {
    id: "user-2", 
    full_name: "Sarah Al-Mansouri",
    email: "sarah.mansouri@company.com",
    avatar_url: "/avatars/sarah.jpg",
    role: "Legal Reviewer"
  },
  notifications: [
    {
      id: "notif-1",
      type: "task",
      title: "Review Required",
      description: "Contract pending legal review",
      priority: "high",
      dueDate: "2025-08-10",
      assignedTo: "Legal Team",
      timestamp: new Date().toISOString(),
      status: "pending"
    },
    {
      id: "notif-2", 
      type: "update",
      title: "Status Changed",
      description: "Contract moved to active status",
      timestamp: "2025-08-05T10:30:00Z",
      createdBy: "Sarah Al-Mansouri",
      status: "read"
    },
    {
      id: "notif-3",
      type: "task",
      title: "Document Upload",
      description: "Upload signed contract documents",
      priority: "medium",
      dueDate: "2025-08-15",
      assignedTo: "HR Department",
      timestamp: new Date().toISOString(),
      status: "pending"
    }
  ],
  tasks: [
    {
      id: "task-1",
      title: "Legal Review",
      status: "pending",
      assignee: "Legal Team",
      dueDate: "2025-08-10",
      createdAt: new Date().toISOString()
    },
    {
      id: "task-2",
      title: "Final Approval",
      status: "completed",
      assignee: "Contract Manager", 
      completedDate: "2025-08-03",
      createdAt: new Date().toISOString()
    }
  ]
}

export function ContractInfoEnhanced({ contract, contractId, useRealData = false }: ContractInfoEnhancedProps) {
  const { data: activityData, loading, error, refetch } = useContractActivity(useRealData ? contractId : '')

  // Use real data if available and requested, otherwise use mock data
  const displayData = useRealData && activityData ? activityData.activity : {
    addedBy: mockActivityData.addedBy,
    lastUpdatedBy: mockActivityData.lastUpdatedBy,
    notifications: mockActivityData.notifications,
    tasks: mockActivityData.tasks
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task': return <CheckCircle className="h-4 w-4" />
      case 'update': return <Bell className="h-4 w-4" />
      case 'alert': return <AlertCircle className="h-4 w-4" />
      default: return <Bell className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short', 
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getUserInitials = (fullName: string) => {
    return fullName.split(' ').map(n => n[0]).join('').toUpperCase()
  }

  if (useRealData && loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Contract Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    )
  }

  if (useRealData && error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Data</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refetch} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Data Source Indicator */}
      {useRealData && (
        <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Live Data {activityData ? '(Connected)' : '(Using Mock Data)'}
            </span>
          </div>
          <Button size="sm" variant="outline" onClick={refetch}>
            <RefreshCw className="mr-2 h-3 w-3" />
            Refresh
          </Button>
        </div>
      )}

      {/* Main Contract Information */}
      <Card>
        <CardHeader>
          <CardTitle>Contract Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Contract ID</label>
              <p className="mt-1 font-semibold">{contract?.id}</p>
            </div>
            
            <div>
              <label className="text-sm font-medium text-gray-500">Status</label>
              <p className="mt-1 font-semibold capitalize">{contract?.status}</p>
            </div>
          </div>
          
          <div className="mt-6 flex gap-2">
            <Button asChild>
              <Link href={`/edit-contract/${contractId}`}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Contract
              </Link>
            </Button>
            
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Download PDF
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* User Activity & Updates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              User Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Added By */}
            {displayData.addedBy && (
              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={displayData.addedBy.avatar_url} alt={displayData.addedBy.full_name} />
                  <AvatarFallback>{getUserInitials(displayData.addedBy.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{displayData.addedBy.full_name}</p>
                    {displayData.addedBy.role && (
                      <Badge variant="secondary" className="text-xs">{displayData.addedBy.role}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{displayData.addedBy.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Contract Creator</span> • {formatDate(contract?.created_at || new Date().toISOString())}
                  </p>
                </div>
              </div>
            )}

            {/* Last Updated By */}
            {displayData.lastUpdatedBy && (
              <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={displayData.lastUpdatedBy.avatar_url} alt={displayData.lastUpdatedBy.full_name} />
                  <AvatarFallback>{getUserInitials(displayData.lastUpdatedBy.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{displayData.lastUpdatedBy.full_name}</p>
                    {displayData.lastUpdatedBy.role && (
                      <Badge variant="secondary" className="text-xs">{displayData.lastUpdatedBy.role}</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{displayData.lastUpdatedBy.email}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="font-medium">Last Update</span> • {formatDate(contract?.updated_at || new Date().toISOString())}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Tasks ({displayData.tasks?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {displayData.tasks?.length > 0 ? (
                displayData.tasks.map((task) => (
                  <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-sm">{task.title}</p>
                      <p className="text-xs text-gray-500">{task.assignee}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {task.status === 'completed' ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Completed
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          <Clock className="mr-1 h-3 w-3" />
                          {task.dueDate ? `Due ${formatDate(task.dueDate)}` : 'No due date'}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p>No tasks assigned</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Recent Notifications ({displayData.notifications?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {displayData.notifications?.length > 0 ? (
              displayData.notifications.map((notification) => (
                <div key={notification.id} className="flex items-start gap-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm">{notification.title}</p>
                        <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                        {notification.assignedTo && (
                          <p className="text-xs text-gray-500 mt-1">
                            Assigned to: <span className="font-medium">{notification.assignedTo}</span>
                          </p>
                        )}
                        {notification.createdBy && (
                          <p className="text-xs text-gray-500 mt-1">
                            By: <span className="font-medium">{notification.createdBy}</span>
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {notification.priority && (
                          <Badge className={getPriorityColor(notification.priority)}>
                            {notification.priority}
                          </Badge>
                        )}
                        {notification.dueDate && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Calendar className="h-3 w-3" />
                            {formatDate(notification.dueDate)}
                          </div>
                        )}
                        {notification.timestamp && (
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(notification.timestamp)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Bell className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>No notifications</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
