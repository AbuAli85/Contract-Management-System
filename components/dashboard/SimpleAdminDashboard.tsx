"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { BarChart3, DollarSign,  } from 'lucide-react'

interface DashboardMetrics {
  totalPromoters: number
  activePromoters: number
  totalContracts: number
  activeContracts: number
  totalRevenue: number
  monthlyGrowth: number
  attendanceRate: number
  completionRate: number
  averageRating: number
  totalTasks: number
  completedTasks: number
  pendingTasks: number
  overdueTasks: number
}

interface AttendanceData {
  date: string
  present: number
  absent: number
  late: number
  total: number
  attendanceRate: number
}

export default function SimpleAdminDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [attendance, setAttendance] = useState<AttendanceData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch metrics
        const metricsResponse = await fetch("/api/dashboard/metrics?period=today")
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json()
          setMetrics(metricsData)
        }

        // Fetch attendance
        const attendanceResponse = await fetch("/api/dashboard/attendance?period=today")
        if (attendanceResponse.ok) {
          const attendanceData = await attendanceResponse.json()
          setAttendance(attendanceData)
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err)
        setError("Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const KpiCard = ({
    title,
    value,
    change,
    icon: Icon,
    color = "blue",
    subtitle,
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
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 text-${color}-600`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-green-600" />
            {change}
          </p>
        )}
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </CardContent>
    </Card>
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-lg">Loading beautiful dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <p className="text-lg text-red-600">{error}</p>
          <Button
            onClick={() => {
              if (typeof window !== "undefined") {
                window.location.reload()
              }
            }}
            className="mt-4"
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Admin Dashboard</h2>
            <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard
            title="Total Promoters"
            value={metrics?.totalPromoters || 0}
            change="+12% from last month"
            icon={Users}
            color="blue"
          />
          <KpiCard
            title="Active Contracts"
            value={metrics?.activeContracts || 0}
            change="+8% from last month"
            icon={FileText}
            color="green"
          />
          <KpiCard
            title="Total Revenue"
            value={`$${(metrics?.totalRevenue || 0).toLocaleString()}`}
            change="+15% from last month"
            icon={DollarSign}
            color="purple"
          />
          <KpiCard
            title="Attendance Rate"
            value={`${metrics?.attendanceRate || 0}%`}
            change="+3% from last week"
            icon={Activity}
            color="orange"
          />
        </div>

        {/* Performance Overview */}
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Task Completion
              </CardTitle>
              <CardDescription>Current task completion status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completed Tasks</span>
                <span className="text-sm text-green-600">{metrics?.completedTasks || 0}</span>
              </div>
              <Progress value={metrics ? (metrics.completedTasks / metrics.totalTasks) * 100 : 0} />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>Pending: {metrics?.pendingTasks || 0}</span>
                <span>Overdue: {metrics?.overdueTasks || 0}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Performance Metrics
              </CardTitle>
              <CardDescription>Key performance indicators</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Completion Rate</span>
                <span className="text-sm text-green-600">{metrics?.completionRate || 0}%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Average Rating</span>
                <span className="text-sm text-blue-600">{metrics?.averageRating || 0}/5.0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Monthly Growth</span>
                <span className="text-sm text-green-600">+{metrics?.monthlyGrowth || 0}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common administrative tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Button className="h-20 flex-col gap-2">
                <Plus className="h-6 w-6" />
                <span className="text-sm">Add Promoter</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <FileText className="h-6 w-6" />
                <span className="text-sm">Create Contract</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span className="text-sm">Schedule Event</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest system activities</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50">
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <div className="flex-1">
                  <p className="font-medium">New contract signed with ABC Corp</p>
                  <p className="text-sm text-muted-foreground">2 hours ago</p>
                </div>
                <Badge variant="secondary">Contract</Badge>
              </div>
              <div className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50">
                <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                <div className="flex-1">
                  <p className="font-medium">Sarah Johnson completed task</p>
                  <p className="text-sm text-muted-foreground">4 hours ago</p>
                </div>
                <Badge variant="secondary">Task</Badge>
              </div>
              <div className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50">
                <div className="h-2 w-2 rounded-full bg-purple-500"></div>
                <div className="flex-1">
                  <p className="font-medium">Payment received from XYZ Inc</p>
                  <p className="text-sm text-muted-foreground">6 hours ago</p>
                </div>
                <Badge variant="secondary">Payment</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
