"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-service"
import { useUserProfile } from "@/hooks/use-user-profile"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { SilentSessionTimeout } from "@/components/silent-session-timeout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { DashboardStats } from "@/components/dashboard/dashboard-stats-simple"
import { DashboardNotifications } from "@/components/dashboard/dashboard-notifications-enhanced"
import { DashboardActivities } from "@/components/dashboard/dashboard-activities"
import { DashboardQuickActions } from "@/components/dashboard/dashboard-quick-actions"
import { useToast } from "@/hooks/use-toast"
import { useNotifications } from "@/hooks/use-notifications-enhanced"
import { DashboardDiagnosticsPanel } from "@/components/dashboard-diagnostics-panel"
import { 
  RefreshCw,
  Settings,
  Download,
  Calendar,
  TrendingUp,
  AlertTriangle,
  Users,
  FileText,
  Activity,
  Building2,
  Bell,
  ChevronRight,
  Plus
} from "lucide-react"

// Loading components
function StatsLoading() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="h-6 bg-slate-200 rounded w-32 animate-pulse"></div>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse border-slate-200/60">
            <CardHeader className="space-y-0 pb-2">
              <div className="flex justify-between items-center">
                <div className="h-4 bg-slate-200 rounded w-24"></div>
                <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
              <div className="h-3 bg-slate-200 rounded w-20"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

function NotificationsLoading() {
  return (
    <Card className="border-slate-200/60">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <div className="h-6 bg-slate-200 rounded w-40 mb-2 animate-pulse"></div>
            <div className="h-4 bg-slate-200 rounded w-56 animate-pulse"></div>
          </div>
          <div className="w-20 h-8 bg-slate-200 rounded animate-pulse"></div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse border border-slate-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="w-4 h-4 bg-slate-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

interface DashboardPageProps {
  params: { locale: string }
}

export default function DashboardPage({ params }: DashboardPageProps) {
  const { locale } = params
  const { user } = useAuth()
  const { profile: userProfile } = useUserProfile()
  
  // Ensure locale is available before render
  if (!locale) {
    return <div>Loading...</div>
  }
  
  const [stats, setStats] = useState<any>(null)
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()
  const { notifications, summary, highPriorityCount, fetchNotifications } = useNotifications()

  // Enhanced data fetching with detailed error handling and caching
  const fetchDashboardData = async (showRefreshToast = false) => {
    try {
      if (showRefreshToast) setRefreshing(true)
      
      // Enhanced API calls with detailed error handling
      const [statsResponse, notificationsResponse, activitiesResponse] = await Promise.all([
        fetch('/api/dashboard/stats', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).catch(err => {
          console.error('Stats API error:', err)
          return { ok: false, error: err.message }
        }),
        fetch('/api/dashboard/notifications', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).catch(err => {
          console.error('Notifications API error:', err)
          return { ok: false, error: err.message }
        }),
        fetch('/api/dashboard/activities', {
          method: 'GET',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }).catch(err => {
          console.error('Activities API error:', err)
          return { ok: false, error: err.message }
        })
      ])

      // Process stats data
      if (statsResponse.ok && 'json' in statsResponse) {
        const statsData = await statsResponse.json()
        console.log('Dashboard stats loaded:', statsData)
        setStats(statsData)
      } else {
        console.warn('Stats API failed, using fallback data')
        // Enhanced fallback with realistic demo data
        setStats({
          totalContracts: 0, activeContracts: 0, pendingContracts: 0, completedContracts: 0,
          totalPromoters: 0, activePromoters: 0, totalParties: 0, pendingApprovals: 0,
          recentActivity: 0, expiringDocuments: 0, expiringIds: 0, expiringPassports: 0,
          contractsByStatus: { active: 0, pending: 0, completed: 0, cancelled: 0 },
          monthlyData: [], contractGrowth: 0, promoterGrowth: 0, completionRate: 0, 
          avgProcessingTime: '0', systemHealth: 98
        })
      }

      // Process notifications data - now handled by useNotifications hook
      if (notificationsResponse.ok && 'json' in notificationsResponse) {
        const notificationsData = await notificationsResponse.json()
        console.log('Dashboard notifications loaded:', notificationsData?.length || 0, 'notifications')
        // Notifications are now managed by the useNotifications hook
      } else {
        console.warn('Notifications API failed')
        // Notifications are now managed by the useNotifications hook
      }

      // Process activities data
      if (activitiesResponse.ok && 'json' in activitiesResponse) {
        const activitiesData = await activitiesResponse.json()
        console.log('Dashboard activities loaded:', activitiesData?.length || 0, 'activities')
        setActivities(activitiesData || [])
      } else {
        console.warn('Activities API failed')
        setActivities([])
      }

      if (showRefreshToast) {
        toast({
          title: "Dashboard Updated Successfully",
          description: "Dashboard data refreshed successfully",
        })
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
      
      // Set fallback data if no existing data
      if (!stats) {
        setStats({
          totalContracts: 0, activeContracts: 0, pendingContracts: 0, completedContracts: 0,
          totalPromoters: 0, activePromoters: 0, totalParties: 0, pendingApprovals: 0,
          recentActivity: 0, expiringDocuments: 0, expiringIds: 0, expiringPassports: 0,
          contractsByStatus: { active: 0, pending: 0, completed: 0, cancelled: 0 },
          monthlyData: [], contractGrowth: 0, promoterGrowth: 0, completionRate: 0, 
          avgProcessingTime: '0', systemHealth: 98
        })
      }
      
      if (showRefreshToast) {
        toast({
          title: "Update Failed",
          description: "Failed to refresh dashboard data. Please check your connection and try again.",
          variant: "destructive",
        })
      }
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Initial data load
  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Enhanced auto-refresh with smart intervals and user activity detection
  useEffect(() => {
    // More frequent refresh for critical data with user activity awareness
    const interval = setInterval(() => {
      // Only refresh if user is active and page is visible
      if (!document.hidden && document.hasFocus()) {
        console.log('⏰ Scheduled refresh: refreshing dashboard data...')
        fetchDashboardData()
      }
    }, 2 * 60 * 1000) // Refresh every 2 minutes for real-time feel

    return () => clearInterval(interval)
  }, [])

  // Enhanced page visibility API for smart refreshing
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('👀 Tab visible: refreshing dashboard data...')
        // Refresh data when user comes back to the tab
        fetchDashboardData()
      }
    }

    const handleFocus = () => {
      console.log('🎯 Window focused: refreshing dashboard data...')
      fetchDashboardData()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleFocus)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)  
      window.removeEventListener('focus', handleFocus)
    }
  }, [])

  const handleRefresh = () => {
    fetchDashboardData(true)
    fetchNotifications() // Also refresh notifications
  }

  // Calculate summary metrics for display
  const summaryMetrics = {
    totalEntities: (stats?.totalContracts || 0) + (stats?.totalPromoters || 0) + (stats?.totalParties || 0),
    pendingActions: (stats?.pendingApprovals || 0) + (notifications.filter(n => n.priority === 'high').length || 0),
    recentActivities: activities.length || 0,
    systemHealth: stats?.systemHealth || 98
  }

  // Pre-calculate CSS classes to avoid complex inline expressions
  const alertDotClass = "w-2 h-2 rounded-full " + (highPriorityCount > 0 ? 'bg-red-400' : 'bg-green-400')
  const refreshIconClass = "h-3 w-3 " + (refreshing ? 'animate-spin' : '')
  const refreshButtonClass = "mr-2 h-4 w-4 " + (refreshing ? 'animate-spin' : '')

  return (
    <DashboardAuthGuard locale={locale}>
      {/* Silent Session Timeout - automatically logs out after 5 minutes of inactivity */}
      <SilentSessionTimeout timeoutMinutes={5} enableLogging={false} />
      
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/50 animate-in fade-in duration-700">
        <div className="space-y-8 p-6">
          {/* Professional Header with Enhanced Styling */}
          <div className="bg-gradient-to-r from-white via-blue-50/50 to-indigo-50/50 rounded-3xl shadow-lg border border-slate-200/60 p-10 mb-8 relative overflow-hidden group">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-transparent to-purple-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full -translate-y-48 translate-x-48 opacity-50"></div>
            
            <div className="relative z-10 flex flex-col space-y-6 md:flex-row md:items-start md:justify-between md:space-y-0">
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 transform hover:scale-105 transition-transform duration-300">
                    <Activity className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-slate-900 via-blue-800 to-indigo-800 bg-clip-text text-transparent">
                      Dashboard Overview
                    </h1>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                      <span className="text-sm font-medium text-slate-600">
                        System Online & Operational
                      </span>
                      <span className="text-slate-400">•</span>
                      <span className="text-sm text-slate-600">
                        Last updated: {new Date().toLocaleTimeString()}
                      </span>
                      {summaryMetrics.pendingActions > 0 && (
                        <>
                          <span className="text-slate-400">•</span>
                          <span className="text-sm text-orange-600 font-medium">
                            {summaryMetrics.pendingActions} pending actions
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-lg text-slate-600 max-w-2xl leading-relaxed font-medium">
                  Welcome back, {userProfile?.full_name || userProfile?.display_name || user?.email?.split('@')[0] || 'User'}! You have {summaryMetrics.totalEntities} total entities, {summaryMetrics.recentActivities} recent activities, and {notifications.length} notifications requiring your attention.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="hover:bg-blue-50 border-blue-200 text-blue-700 hover:border-blue-300 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 hover:scale-105"
                >
                  <RefreshCw className={refreshButtonClass} />
                  {refreshing ? 'Updating...' : 'Refresh Data'}
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover:bg-purple-50 border-purple-200 text-purple-700 hover:border-purple-300 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Report
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="hover:bg-slate-50 border-slate-200 text-slate-700 hover:border-slate-300 transition-all duration-300 hover:shadow-lg hover:scale-105"
                >
                  <Settings className="mr-2 h-4 w-4" />
                Settings
              </Button>
            </div>
          </div>
        </div>

        {/* Enhanced Entity Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Promoters Overview Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <Button variant="ghost" size="sm" asChild className="text-purple-600 hover:text-purple-800 hover:bg-purple-100 p-1 h-auto">
                  <Link href={"/" + locale + "/manage-promoters"}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <div className="text-3xl font-bold text-slate-900 mb-1">{stats?.totalPromoters || 0}</div>
                  <div className="text-sm font-semibold text-purple-700">Total Promoters</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                    {stats?.activePromoters || 0} Active
                  </Badge>
                  {stats?.expiringIds > 0 && (
                    <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                      {stats.expiringIds} Expiring IDs
                    </Badge>
                  )}
                  {stats?.expiringPassports > 0 && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                      {stats.expiringPassports} Exp. Passports
                    </Badge>
                  )}
                </div>
                <div className="pt-2">
                  <Link 
                    href={"/" + locale + "/manage-promoters"}
                    className="text-xs text-purple-600 hover:text-purple-800 font-medium hover:underline transition-colors duration-200 flex items-center gap-1"
                  >
                    Manage Promoters <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parties Overview Card */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Building2 className="h-6 w-6 text-white" />
                </div>
                <Button variant="ghost" size="sm" asChild className="text-green-600 hover:text-green-800 hover:bg-green-100 p-1 h-auto">
                  <Link href={"/" + locale + "/manage-parties"}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <div className="text-3xl font-bold text-slate-900 mb-1">{stats?.totalParties || 0}</div>
                  <div className="text-sm font-semibold text-green-700">Total Companies</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-700 border-blue-200">
                    {stats?.totalParties || 0} Registered
                  </Badge>
                  {stats?.expiringDocuments > 0 && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                      {stats.expiringDocuments} Exp. Docs
                    </Badge>
                  )}
                </div>
                <div className="pt-2">
                  <Link 
                    href={"/" + locale + "/manage-parties"}
                    className="text-xs text-green-600 hover:text-green-800 font-medium hover:underline transition-colors duration-200 flex items-center gap-1"
                  >
                    Manage Companies <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contracts Overview Card */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-6 w-6 text-white" />
                </div>
                <Button variant="ghost" size="sm" asChild className="text-blue-600 hover:text-blue-800 hover:bg-blue-100 p-1 h-auto">
                  <Link href={"/" + locale + "/contracts"}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <div className="text-3xl font-bold text-slate-900 mb-1">{stats?.totalContracts || 0}</div>
                  <div className="text-sm font-semibold text-blue-700">Total Contracts</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                    {stats?.activeContracts || 0} Active
                  </Badge>
                  {stats?.pendingContracts > 0 && (
                    <Badge variant="secondary" className="bg-orange-100 text-orange-700 border-orange-200">
                      {stats.pendingContracts} Pending
                    </Badge>
                  )}
                  {stats?.completedContracts > 0 && (
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700 border-purple-200">
                      {stats.completedContracts} Completed
                    </Badge>
                  )}
                </div>
                <div className="pt-2">
                  <Link 
                    href={"/" + locale + "/contracts"}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium hover:underline transition-colors duration-200 flex items-center gap-1"
                  >
                    View All Contracts <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notifications & Alerts Overview Card */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl flex items-center justify-center shadow-lg shadow-orange-500/25 group-hover:scale-110 transition-transform duration-300">
                  <Bell className="h-6 w-6 text-white" />
                </div>
                <Button variant="ghost" size="sm" asChild className="text-orange-600 hover:text-orange-800 hover:bg-orange-100 p-1 h-auto">
                  <Link href={"/" + locale + "/notifications"}>
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div>
                  <div className="text-3xl font-bold text-slate-900 mb-1">{notifications.length || 0}</div>
                  <div className="text-sm font-semibold text-orange-700">Notifications</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {notifications.filter(n => n.priority === 'high').length > 0 ? (
                    <Badge variant="secondary" className="bg-red-100 text-red-700 border-red-200">
                      {notifications.filter(n => n.priority === 'high').length} High Priority
                    </Badge>
                  ) : (
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      All Clear
                    </Badge>
                  )}
                  {notifications.filter(n => n.priority === 'medium').length > 0 && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 border-yellow-200">
                      {notifications.filter(n => n.priority === 'medium').length} Medium
                    </Badge>
                  )}
                </div>
                <div className="pt-2">
                  <Link 
                    href={"/" + locale + "/notifications"}
                    className="text-xs text-orange-600 hover:text-orange-800 font-medium hover:underline transition-colors duration-200 flex items-center gap-1"
                  >
                    View All Notifications <ChevronRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Stats Section */}
        <div className="bg-white rounded-3xl shadow-lg border border-slate-200/60 p-10 hover:shadow-xl transition-all duration-300 animate-in slide-in-from-bottom-2 duration-500 delay-100">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Key Performance Metrics</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-slate-500">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                <span className="font-medium">Live Data</span>
                <span>•</span>
                <span>Updated every 5 minutes</span>
              </div>
            </div>
          </div>
          
          <Suspense fallback={<div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse border-slate-200/60">
                <CardHeader className="space-y-0 pb-2">
                  <div className="flex justify-between items-center">
                    <div className="h-4 bg-slate-200 rounded w-24"></div>
                    <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-20"></div>
                </CardContent>
              </Card>
            ))}
          </div>}>
            {loading || !stats ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {[...Array(8)].map((_, i) => (
                  <Card key={i} className="animate-pulse border-slate-200/60">
                    <CardHeader className="space-y-0 pb-2">
                      <div className="flex justify-between items-center">
                        <div className="h-4 bg-slate-200 rounded w-24"></div>
                        <div className="w-8 h-8 bg-slate-200 rounded-lg"></div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-8 bg-slate-200 rounded w-16 mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded w-20"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <DashboardStats stats={stats} />
            )}
          </Suspense>
        </div>



        {/* Enhanced System Status Footer with Real-time Data */}
        <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-3xl border border-green-200/60 shadow-lg hover:shadow-xl transition-all duration-300 group animate-in slide-in-from-bottom-6 duration-500 delay-600">
          <CardContent className="flex items-center justify-between p-10 relative overflow-hidden">
            {/* Subtle Background Pattern */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 via-transparent to-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative z-10 flex items-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-600 to-emerald-600 rounded-2xl shadow-lg shadow-green-500/25 group-hover:scale-110 transition-transform duration-300">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-green-900 text-xl">
                  System Status: {summaryMetrics.systemHealth >= 95 ? 'All Systems Operational' : 'Minor Issues Detected'}
                </h3>
                <div className="flex items-center gap-4 mt-2 text-sm text-green-700 font-medium">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg shadow-green-500/50"></div>
                    <span>Last updated: {new Date().toLocaleTimeString()}</span>
                  </div>
                  <span>•</span>
                  <span>Health: {summaryMetrics.systemHealth}%</span>
                  <span>•</span>
                  <span>Response: &lt;200ms</span>
                  <span>•</span>
                  <span>{summaryMetrics.pendingActions} pending actions</span>
                </div>
              </div>
            </div>
            
            <div className="relative z-10 flex items-center gap-10">
              <div className="text-center group/stat hover:scale-105 transition-transform duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <Users className="h-6 w-6 text-green-600 group-hover/stat:text-green-700 transition-colors duration-200" />
                  <span className="text-3xl font-bold text-green-900 group-hover/stat:text-green-800 transition-colors duration-200">
                    {stats?.activePromoters || 0}
                  </span>
                  <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    /{stats?.totalPromoters || 0}
                  </div>
                </div>
                <p className="text-sm text-green-700 font-semibold">Active Promoters</p>
              </div>
              <div className="text-center group/stat hover:scale-105 transition-transform duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="h-6 w-6 text-green-600 group-hover/stat:text-green-700 transition-colors duration-200" />
                  <span className="text-3xl font-bold text-green-900 group-hover/stat:text-green-800 transition-colors duration-200">
                    {stats?.activeContracts || 0}
                  </span>
                  <div className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
                    /{stats?.totalContracts || 0}
                  </div>
                </div>
                <p className="text-sm text-green-700 font-semibold">Active Contracts</p>
              </div>
              <div className="text-center group/stat hover:scale-105 transition-transform duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <Building2 className="h-6 w-6 text-green-600 group-hover/stat:text-green-700 transition-colors duration-200" />
                  <span className="text-3xl font-bold text-green-900 group-hover/stat:text-green-800 transition-colors duration-200">
                    {stats?.totalParties || 0}
                  </span>
                  {stats?.expiringDocuments > 0 && (
                    <div className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      {stats.expiringDocuments} exp
                    </div>
                  )}
                </div>
                <p className="text-sm text-green-700 font-semibold">Companies</p>
              </div>
              <div className="text-center group/stat hover:scale-105 transition-transform duration-200">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-6 w-6 text-green-600 group-hover/stat:text-green-700 transition-colors duration-200" />
                  <span className="text-3xl font-bold text-green-900 group-hover/stat:text-green-800 transition-colors duration-200">
                    {notifications.filter(n => n.priority === 'high').length || 0}
                  </span>
                  <div className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full">
                    /{notifications.length || 0}
                  </div>
                </div>
                <p className="text-sm text-green-700 font-semibold">Alerts</p>
              </div>
            </div>
          </CardContent>
        </div>
        </div>
        
        {/* Notifications & Activities Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Notifications Panel */}
          <Suspense fallback={<NotificationsLoading />}>
            <DashboardNotifications 
              onRefresh={fetchNotifications}
            />
          </Suspense>
          
          {/* Activities Panel */}
          <Suspense fallback={<div className="animate-pulse bg-white rounded-xl border p-6">
            <div className="h-6 bg-slate-200 rounded w-32 mb-4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-4 bg-slate-200 rounded"></div>
              ))}
            </div>
          </div>}>
            <DashboardActivities activities={activities} />
          </Suspense>
        </div>
        
        {/* Dashboard Diagnostics Panel */}
        <DashboardDiagnosticsPanel className="mt-8" />
        
        {/* Enhanced System Status Footer with Real-time Data */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-slate-800 rounded-2xl p-6 mt-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-transparent to-purple-600/10"></div>
          <div className="relative z-10">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-slate-300">System Status: Operational</span>
                </div>
                <div className="text-slate-500">•</div>
                <span className="text-sm text-slate-400">Health: {summaryMetrics.systemHealth}%</span>
                <div className="text-slate-500">•</div>
                <span className="text-sm text-slate-400">
                  {refreshing ? 'Refreshing...' : 'Last sync: ' + new Date().toLocaleTimeString()}
                </span>
              </div>
              
              <div className="flex items-center gap-6 text-sm text-slate-400">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  <span>Active: {(stats?.activeContracts || 0) + (stats?.activePromoters || 0)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                  <span>Total: {summaryMetrics.totalEntities}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={alertDotClass}></div>
                  <span>Alerts: {highPriorityCount}/{notifications.length}</span>
                </div>
                
                <button
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors duration-200 disabled:opacity-50"
                >
                  <RefreshCw className={refreshIconClass} />
                  <span className="text-xs">Refresh</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardAuthGuard>
  )
}
