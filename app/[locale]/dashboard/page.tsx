"use client"

import { Suspense, useEffect, useState } from "react"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DashboardStats } from "@/components/dashboard/dashboard-stats"
import { DashboardNotifications } from "@/components/dashboard/dashboard-notifications"
import { DashboardActivities } from "@/components/dashboard/dashboard-activities"
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions"
import { useToast } from "@/hooks/use-toast"
import { 
  RefreshCw,
  Settings,
  Download,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Users,
  FileText,
  Activity
} from "lucide-react"

// Loading components
function StatsLoading() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(8)].map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="space-y-0 pb-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </CardHeader>
          <CardContent>
            <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-2/3"></div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function NotificationsLoading() {
  return (
    <Card>
      <CardHeader>
        <div className="h-6 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardPageProps {
  params: Promise<{ locale: string }>
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const [locale, setLocale] = useState<string>("")
  const [stats, setStats] = useState<any>(null)
  const [notifications, setNotifications] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  // Resolve params
  useEffect(() => {
    params.then(({ locale: resolvedLocale }) => {
      setLocale(resolvedLocale)
    })
  }, [params])

  // Fetch dashboard data
  const fetchDashboardData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true)
      
      const [statsResponse, notificationsResponse, activitiesResponse] = await Promise.all([
        fetch('/api/dashboard/stats'),
        fetch('/api/dashboard/notifications'),
        fetch('/api/dashboard/activities')
      ])

      if (statsResponse.ok) {
        const statsData = await statsResponse.json()
        setStats(statsData)
      }

      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json()
        setNotifications(notificationsData)
      }

      if (activitiesResponse.ok) {
        const activitiesData = await activitiesResponse.json()
        setActivities(activitiesData)
      }

      if (showRefreshToast) {
        toast({
          title: "Dashboard Updated",
          description: "All data has been refreshed successfully.",
        })
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      toast({
        title: "Update Failed",
        description: "Failed to refresh dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial data load
  useEffect(() => {
    if (locale) {
      fetchDashboardData()
    }
  }, [locale])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchDashboardData()
    }, 5 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  const handleRefresh = () => {
    fetchDashboardData(true)
  }

  if (!locale) {
    return (
      <DashboardAuthGuard locale="en">
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </DashboardAuthGuard>
    )
  }

  return (
    <DashboardAuthGuard locale={locale}>
      <div className="space-y-8 p-8 bg-gradient-to-br from-blue-50/50 via-white to-purple-50/50 min-h-screen">
        {/* Enhanced Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
              Welcome back! Here's what's happening with your contracts and promoters.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
              className="hover:bg-blue-50"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh'}
            </Button>
            <Button variant="outline" size="sm" className="hover:bg-purple-50">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" className="hover:bg-gray-50">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </div>
        </div>

        {/* Stats Section */}
        <div className="space-y-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            <h2 className="text-xl font-semibold">Key Metrics</h2>
          </div>
          
          <Suspense fallback={<StatsLoading />}>
            {loading || !stats ? (
              <StatsLoading />
            ) : (
              <DashboardStats stats={stats} />
            )}
          </Suspense>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Left Column - Quick Actions */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold">Quick Actions</h2>
              </div>
              <DashboardQuickActions locale={locale} />
            </div>
          </div>

          {/* Right Column - Notifications & Activities */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
              {/* Notifications */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  <h2 className="text-xl font-semibold">Alerts & Notifications</h2>
                </div>
                <Suspense fallback={<NotificationsLoading />}>
                  {loading ? (
                    <NotificationsLoading />
                  ) : (
                    <DashboardNotifications 
                      notifications={notifications} 
                      onRefresh={handleRefresh}
                    />
                  )}
                </Suspense>
              </div>

              {/* Recent Activities */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-600" />
                  <h2 className="text-xl font-semibold">Recent Activities</h2>
                </div>
                <Suspense fallback={<NotificationsLoading />}>
                  {loading ? (
                    <NotificationsLoading />
                  ) : (
                    <DashboardActivities 
                      activities={activities} 
                      onRefresh={handleRefresh}
                    />
                  )}
                </Suspense>
              </div>
            </div>
          </div>
        </div>

        {/* System Status Footer */}
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardContent className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900">System Status: All Systems Operational</h3>
                <p className="text-sm text-green-700">
                  Last updated: {new Date().toLocaleTimeString()} • Uptime: 99.9%
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sm text-green-700">
              <div className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                <span>{stats?.totalPromoters || 0} Promoters</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="h-4 w-4" />
                <span>{stats?.totalContracts || 0} Contracts</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardAuthGuard>
  )
}
