"use client"

import React from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import {
  Activity,
  FileText,
  Users,
  CheckCircle,
  Clock,
  XCircle,
  AlertTriangle,
  Plus,
  Edit,
  Trash2,
  Eye
} from "lucide-react"
import Link from "next/link"
import { formatDistanceToNow } from "date-fns"

interface ActivityItem {
  id: string
  type: 'contract' | 'promoter' | 'system'
  title: string
  description: string
  status: string
  timestamp: string
  entity: string
  action: 'created' | 'updated' | 'deleted' | 'approved' | 'rejected'
  icon: string
  color: string
}

interface DashboardActivitiesProps {
  activities: ActivityItem[]
  onRefresh?: () => void
}

export function DashboardActivities({ activities, onRefresh }: DashboardActivitiesProps) {
  const getActivityIcon = (iconName: string, action: string) => {
    const iconProps = { className: "h-4 w-4" }
    
    switch (iconName) {
      case 'FileText':
        return <FileText {...iconProps} />
      case 'Users':
        return <Users {...iconProps} />
      default:
        switch (action) {
          case 'created':
            return <Plus {...iconProps} />
          case 'updated':
            return <Edit {...iconProps} />
          case 'deleted':
            return <Trash2 {...iconProps} />
          case 'approved':
            return <CheckCircle {...iconProps} />
          case 'rejected':
            return <XCircle {...iconProps} />
          default:
            return <Activity {...iconProps} />
        }
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>
      case 'pending':
        return <Badge variant="default" className="bg-yellow-100 text-yellow-800">Pending</Badge>
      case 'completed':
        return <Badge variant="default" className="bg-blue-100 text-blue-800">Completed</Badge>
      case 'cancelled':
        return <Badge variant="default" className="bg-red-100 text-red-800">Cancelled</Badge>
      case 'approved':
        return <Badge variant="default" className="bg-green-100 text-green-800">Approved</Badge>
      case 'rejected':
        return <Badge variant="default" className="bg-red-100 text-red-800">Rejected</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getActivityColor = (color: string, action: string) => {
    switch (color) {
      case 'green':
        return 'bg-green-100 text-green-600'
      case 'blue':
        return 'bg-blue-100 text-blue-600'
      case 'yellow':
        return 'bg-yellow-100 text-yellow-600'
      case 'red':
        return 'bg-red-100 text-red-600'
      case 'purple':
        return 'bg-purple-100 text-purple-600'
      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const getActionText = (action: string) => {
    switch (action) {
      case 'created':
        return 'was created'
      case 'updated':
        return 'was updated'
      case 'deleted':
        return 'was deleted'
      case 'approved':
        return 'was approved'
      case 'rejected':
        return 'was rejected'
      case 'registered':
        return 'was registered'
      default:
        return 'was modified'
    }
  }

  return (
    <Card className="h-full hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Recent Activities
          </CardTitle>
          <CardDescription>
            Latest system activities and updates
          </CardDescription>
        </div>
        {onRefresh && (
          <Button variant="outline" size="sm" onClick={onRefresh}>
            Refresh
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="relative mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-3xl flex items-center justify-center shadow-lg">
                <Activity className="h-10 w-10 text-blue-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center shadow-lg">
                <Plus className="h-4 w-4 text-white" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">No recent activities</h3>
            <p className="text-slate-600 max-w-md leading-relaxed mb-8 font-medium">
              Activities will appear here as they happen. Create a contract or add a promoter to get started and see your system come to life.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/generate-contract">
                <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Plus className="h-4 w-4 mr-2" />
                  Create First Contract
                </Button>
              </Link>
              <Link href="/manage-promoters/new">
                <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 shadow-sm hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <Users className="h-4 w-4 mr-2" />
                  Add Promoter
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="h-[400px] overflow-y-auto pr-4">
            <div className="space-y-4">
              {activities.map((activity, index) => (
                <div
                  key={activity.id}
                  className="relative flex items-start gap-4 p-3 rounded-lg hover:bg-accent/50 transition-colors"
                >
                  {/* Timeline line */}
                  {index < activities.length - 1 && (
                    <div className="absolute left-6 top-12 w-px h-8 bg-border" />
                  )}

                  {/* Icon */}
                  <div className={cn(
                    "flex items-center justify-center w-8 h-8 rounded-full flex-shrink-0",
                    getActivityColor(activity.color, activity.action)
                  )}>
                    {getActivityIcon(activity.icon, activity.action)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h4 className="text-sm font-medium truncate">
                        {activity.title}
                      </h4>
                      {getStatusBadge(activity.status)}
                    </div>
                    
                    <p className="text-sm text-muted-foreground mb-2">
                      {activity.description}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{activity.entity}</span>
                        <span>•</span>
                        <span>{getActionText(activity.action)}</span>
                      </div>
                      <span>
                        {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {activities.length > 10 && (
                <div className="text-center pt-4">
                  <Link href="/activities">
                    <Button variant="outline" size="sm">
                      View All Activities
                      <Eye className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
