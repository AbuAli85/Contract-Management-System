'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Plus,
  Filter,
  Download,
  RefreshCw,
  Eye,
  BarChart3,
  Activity,
  Target,
  Award
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'

interface DashboardMetrics {
  totalPromoters: number
  activePromoters: number
  onLeave: number
  pendingApprovals: number
  todayAttendance: number
  attendanceRate: number
  completedTasks: number
  pendingTasks: number
  performanceScore: number
}

interface AttendanceData {
  date: string
  present: number
  absent: number
  late: number
}

export default function AdminDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState('today')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Fetch dashboard metrics
  const { data: metrics, isLoading } = useQuery({
    queryKey: ['dashboard-metrics', selectedPeriod],
    queryFn: async (): Promise<DashboardMetrics> => {
      const response = await fetch(`/api/dashboard/metrics?period=${selectedPeriod}`)
      if (!response.ok) throw new Error('Failed to fetch metrics')
      return response.json()
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  })

  // Fetch attendance data
  const { data: attendanceData } = useQuery({
    queryKey: ['attendance-data', selectedPeriod],
    queryFn: async (): Promise<AttendanceData[]> => {
      const response = await fetch(`/api/dashboard/attendance?period=${selectedPeriod}`)
      if (!response.ok) throw new Error('Failed to fetch attendance data')
      return response.json()
    },
  })

  const handleRefresh = async () => {
    setIsRefreshing(true)
    // Trigger refetch
    await Promise.all([
      // Refetch queries
    ])
    setIsRefreshing(false)
  }

  const KpiCard = ({ 
    title, 
    value, 
    change, 
    icon: Icon, 
    color = 'blue',
    subtitle 
  }: {
    title: string
    value: string | number
    change?: string
    icon: any
    color?: string
    subtitle?: string
  }) => (
    <Card className="relative overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <Icon className={`h-4 w-4 text-${color}-500`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
        {change && (
          <div className="flex items-center text-xs mt-1">
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
            <span className="text-green-600">{change}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  const AttendanceHeatmap = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Attendance Heatmap
        </CardTitle>
        <CardDescription>
          Real-time attendance tracking for the last 30 days
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1">
          {attendanceData?.slice(-30).map((day, index) => (
            <div
              key={index}
              className={`
                aspect-square rounded-sm text-xs flex items-center justify-center
                ${day.present > day.absent 
                  ? 'bg-green-100 text-green-800 border border-green-200' 
                  : day.absent > day.present 
                  ? 'bg-red-100 text-red-800 border border-red-200'
                  : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                }
              `}
              title={`${format(new Date(day.date), 'MMM dd')}: ${day.present} present, ${day.absent} absent`}
            >
              {day.present}
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div>
              <span>Good</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-100 border border-yellow-200 rounded"></div>
              <span>Mixed</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded"></div>
              <span>Poor</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const QuickActions = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
          <Users className="h-6 w-6" />
          <span className="text-sm">Add Promoter</span>
        </Button>
        <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
          <Calendar className="h-6 w-6" />
          <span className="text-sm">Schedule Shift</span>
        </Button>
        <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
          <Target className="h-6 w-6" />
          <span className="text-sm">Assign Task</span>
        </Button>
        <Button variant="outline" className="h-auto p-4 flex flex-col items-center gap-2">
          <BarChart3 className="h-6 w-6" />
          <span className="text-sm">View Reports</span>
        </Button>
      </CardContent>
    </Card>
  )

  const RecentActivity = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[
            { type: 'task', message: 'Ahmed completed "Customer Survey" task', time: '2 min ago', icon: CheckCircle },
            { type: 'attendance', message: 'Sarah checked in late', time: '15 min ago', icon: Clock },
            { type: 'request', message: 'New leave request from Ali', time: '1 hour ago', icon: AlertTriangle },
            { type: 'achievement', message: 'Fatima earned "Top Performer" badge', time: '2 hours ago', icon: Award },
          ].map((activity, index) => (
            <div key={index} className="flex items-start gap-3">
              <div className="mt-1">
                <activity.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <p className="text-sm">{activity.message}</p>
                <p className="text-xs text-muted-foreground">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your promoters today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex items-center gap-2">
        <Tabs value={selectedPeriod} onValueChange={setSelectedPeriod}>
          <TabsList>
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard
          title="Total Promoters"
          value={metrics?.totalPromoters || 0}
          change="+12% from last month"
          icon={Users}
          color="blue"
        />
        <KpiCard
          title="Active Today"
          value={metrics?.todayAttendance || 0}
          subtitle={`${metrics?.attendanceRate || 0}% attendance rate`}
          icon={CheckCircle}
          color="green"
        />
        <KpiCard
          title="Pending Tasks"
          value={metrics?.pendingTasks || 0}
          icon={Clock}
          color="orange"
        />
        <KpiCard
          title="Performance Score"
          value={`${metrics?.performanceScore || 0}%`}
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          <AttendanceHeatmap />
          <RecentActivity />
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <QuickActions />
          
          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Task Completion</span>
                  <span>{metrics?.completedTasks || 0}/{metrics?.completedTasks + metrics?.pendingTasks || 0}</span>
                </div>
                <Progress value={metrics?.completedTasks / (metrics?.completedTasks + metrics?.pendingTasks) * 100 || 0} />
              </div>
              <div>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span>Attendance Rate</span>
                  <span>{metrics?.attendanceRate || 0}%</span>
                </div>
                <Progress value={metrics?.attendanceRate || 0} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 