"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { BarChart3, DollarSign, CalendarDays,  } from 'lucide-react'

interface PromoterMetrics {
  personalStats: {
    totalTasks: number
    completedTasks: number
    pendingTasks: number
    overdueTasks: number
    completionRate: number
    averageRating: number
    totalEarnings: number
    thisMonthEarnings: number
    attendanceRate: number
    performanceScore: number
  }
  achievements: Array<{
    id: number
    name: string
    icon: string
    description: string
    date: string
    points: number
  }>
  recentActivity: Array<{
    id: number
    type: string
    title: string
    description: string
    timestamp: string
    points: number
  }>
}

interface Task {
  id: number
  title: string
  description: string
  dueDate: string
  priority: string
  status: string
  progress: number
  category: string
}

export default function SimplePromoterDashboard() {
  const [metrics, setMetrics] = useState<PromoterMetrics | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch metrics
        const metricsResponse = await fetch("/api/promoter/metrics?period=week")
        if (metricsResponse.ok) {
          const metricsData = await metricsResponse.json()
          setMetrics(metricsData)
        }

        // Fetch tasks
        const tasksResponse = await fetch("/api/promoter/tasks")
        if (tasksResponse.ok) {
          const tasksData = await tasksResponse.json()
          setTasks(tasksData.tasks || [])
        }
      } catch (err) {
        console.error("Error fetching promoter data:", err)
        setError("Failed to load promoter dashboard data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-50"
      case "medium":
        return "text-yellow-600 bg-yellow-50"
      case "low":
        return "text-green-600 bg-green-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "text-green-600 bg-green-50"
      case "in_progress":
        return "text-blue-600 bg-blue-50"
      case "pending":
        return "text-yellow-600 bg-yellow-50"
      default:
        return "text-gray-600 bg-gray-50"
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-lg">Loading your dashboard...</p>
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
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src="https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face" />
              <AvatarFallback>SJ</AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Welcome back, Sarah!</h1>
              <p className="text-gray-600">Here's your performance overview for this week.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Performance Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completion Rate
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.personalStats.completionRate || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {metrics?.personalStats.completedTasks || 0} of{" "}
                {metrics?.personalStats.totalTasks || 0} tasks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Average Rating
              </CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.personalStats.averageRating || 0}/5.0
              </div>
              <p className="text-xs text-muted-foreground">Client satisfaction score</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                This Month Earnings
              </CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ${(metrics?.personalStats.thisMonthEarnings || 0).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">+12% from last month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Performance Score
              </CardTitle>
              <Trophy className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {metrics?.personalStats.performanceScore || 0}/100
              </div>
              <p className="text-xs text-muted-foreground">#1 in team ranking</p>
            </CardContent>
          </Card>
        </div>

        {/* Tasks and Achievements */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Current Tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Current Tasks
              </CardTitle>
              <CardDescription>Your active and pending tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {tasks.slice(0, 3).map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{task.title}</h4>
                      <p className="text-xs text-muted-foreground">{task.description}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <Badge className={`text-xs ${getPriorityColor(task.priority)}`}>
                          {task.priority}
                        </Badge>
                        <Badge className={`text-xs ${getStatusColor(task.status)}`}>
                          {task.status.replace("_", " ")}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{task.progress}%</div>
                      <Progress value={task.progress} className="mt-1 w-16" />
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <Eye className="mr-2 h-4 w-4" />
                  View All Tasks
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Recent Achievements
              </CardTitle>
              <CardDescription>Your latest accomplishments</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {metrics?.achievements.slice(0, 3).map((achievement) => (
                  <div
                    key={achievement.id}
                    className="flex items-center gap-3 rounded-lg border border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50 p-3"
                  >
                    <div className="text-2xl">{achievement.icon}</div>
                    <div className="flex-1">
                      <h4 className="text-sm font-medium">{achievement.name}</h4>
                      <p className="text-xs text-muted-foreground">{achievement.description}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="text-xs text-green-600">+{achievement.points} points</span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(achievement.date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">
                  <Trophy className="mr-2 h-4 w-4" />
                  View All Achievements
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Your latest activities and updates</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics?.recentActivity.slice(0, 4).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center gap-3 rounded-lg p-3 hover:bg-gray-50"
                >
                  <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground">{activity.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(activity.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {activity.points > 0 && (
                    <Badge variant="secondary" className="text-xs">
                      +{activity.points} pts
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <Button className="h-20 flex-col gap-2">
                <Plus className="h-6 w-6" />
                <span className="text-sm">New Task</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span className="text-sm">Schedule</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <BarChart3 className="h-6 w-6" />
                <span className="text-sm">Reports</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Zap className="h-6 w-6" />
                <span className="text-sm">Quick Start</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
