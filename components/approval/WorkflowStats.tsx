"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react'

interface WorkflowStatsProps {
  stats: {
    pending: number
    overdue: number
    completed: number
    highPriority: number
  }
}

export function WorkflowStats({ stats }: WorkflowStatsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Pending Reviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
          <Clock className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.pending}</div>
          <p className="text-xs text-muted-foreground">
            Awaiting your review
          </p>
        </CardContent>
      </Card>

      {/* Overdue Reviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Overdue</CardTitle>
          <AlertTriangle className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{stats.overdue}</div>
          <p className="text-xs text-muted-foreground">
            Require immediate attention
          </p>
        </CardContent>
      </Card>

      {/* High Priority */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">High Priority</CardTitle>
          <TrendingUp className="h-4 w-4 text-orange-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">{stats.highPriority}</div>
          <p className="text-xs text-muted-foreground">
            Urgent reviews
          </p>
        </CardContent>
      </Card>

      {/* Completed Reviews */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Completed</CardTitle>
          <CheckCircle className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
          <p className="text-xs text-muted-foreground">
            This week
          </p>
        </CardContent>
      </Card>
    </div>
  )
} 