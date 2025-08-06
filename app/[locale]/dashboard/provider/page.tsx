"use client"

import { Suspense, useEffect, useState, useCallback } from "react"
import Link from "next/link"
import { useAuth } from "@/lib/auth-service"
import { useUserProfile } from "@/hooks/use-user-profile"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"
import { SilentSessionTimeout } from "@/components/silent-session-timeout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/hooks/use-toast"
import { ProviderManagementDashboard } from "@/components/provider-management/provider-management-dashboard"
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
  Plus,
  DollarSign,
  Clock,
  CheckCircle,
  User,
  Target,
  BarChart3,
  Factory,
  UserCheck,
  Briefcase,
  Award
} from "lucide-react"

// Provider-specific quick actions
function ProviderQuickActions() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <Factory className="w-4 h-4 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/manage-promoters" className="group">
          <Card className="hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-green-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <UserCheck className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">My Promoters</h3>
                  <p className="text-sm text-slate-600">Manage your team</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/contracts" className="group">
          <Card className="hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">My Contracts</h3>
                  <p className="text-sm text-slate-600">View all contracts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/promoters/create" className="group">
          <Card className="hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-purple-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Plus className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">Add Promoter</h3>
                  <p className="text-sm text-slate-600">Recruit new talent</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/analytics" className="group">
          <Card className="hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-orange-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-8 h-8 text-orange-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">Performance</h3>
                  <p className="text-sm text-slate-600">Business insights</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/companies" className="group">
          <Card className="hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-indigo-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Building2 className="w-8 h-8 text-indigo-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">Find Clients</h3>
                  <p className="text-sm text-slate-600">Explore opportunities</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/profile" className="group">
          <Card className="hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-gray-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <User className="w-8 h-8 text-gray-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">Company Profile</h3>
                  <p className="text-sm text-slate-600">Manage details</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

// Provider stats overview
function ProviderStatsOverview() {
  const [stats, setStats] = useState({
    activePromoters: 0,
    totalRevenue: 0,
    activeContracts: 0,
    completedProjects: 0,
    averageRating: 0,
    capacityUtilization: 0
  })

  useEffect(() => {
    // Fetch provider-specific stats
    const fetchStats = async () => {
      try {
        // This would be replaced with actual API calls
        setStats({
          activePromoters: 15,
          totalRevenue: 890000,
          activeContracts: 12,
          completedProjects: 45,
          averageRating: 4.8,
          capacityUtilization: 78
        })
      } catch (error) {
        console.error('Error fetching provider stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-purple-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Business Overview</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="border-slate-200/60">
          <CardHeader className="space-y-0 pb-2">
            <div className="flex justify-between items-center">
              <CardDescription className="text-sm font-medium">Active Promoters</CardDescription>
              <UserCheck className="w-8 h-8 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePromoters}</div>
            <p className="text-xs text-muted-foreground">On assignments</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardHeader className="space-y-0 pb-2">
            <div className="flex justify-between items-center">
              <CardDescription className="text-sm font-medium">Total Revenue</CardDescription>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">This year</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardHeader className="space-y-0 pb-2">
            <div className="flex justify-between items-center">
              <CardDescription className="text-sm font-medium">Active Contracts</CardDescription>
              <FileText className="w-8 h-8 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeContracts}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardHeader className="space-y-0 pb-2">
            <div className="flex justify-between items-center">
              <CardDescription className="text-sm font-medium">Completed Projects</CardDescription>
              <CheckCircle className="w-8 h-8 text-indigo-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedProjects}</div>
            <p className="text-xs text-muted-foreground">Successfully delivered</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardHeader className="space-y-0 pb-2">
            <div className="flex justify-between items-center">
              <CardDescription className="text-sm font-medium">Client Rating</CardDescription>
              <Award className="w-8 h-8 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}/5.0</div>
            <p className="text-xs text-muted-foreground">Client satisfaction</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardHeader className="space-y-0 pb-2">
            <div className="flex justify-between items-center">
              <CardDescription className="text-sm font-medium">Capacity Utilization</CardDescription>
              <Activity className="w-8 h-8 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.capacityUtilization}%</div>
            <Progress value={stats.capacityUtilization} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">Resource efficiency</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ProviderDashboard({ params }: { params: { locale: string } }) {
  const { locale } = params
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useUserProfile()
  const { toast } = useToast()
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = useCallback(async () => {
    setRefreshing(true)
    try {
      // Refresh all dashboard data
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      toast({
        title: "Dashboard Refreshed",
        description: "All data has been updated successfully.",
      })
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh dashboard data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }, [toast])

  return (
    <DashboardAuthGuard locale={locale} requiredRole="provider">
      <SilentSessionTimeout />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Factory className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Provider Dashboard</h1>
                  <p className="text-slate-600">
                    Manage your promoters and client relationships
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
                  Provider
                </Badge>
                <Badge variant="outline" className="text-slate-600">
                  Active Account
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="text-sm text-slate-600">
                Welcome back, {profile?.full_name || profile?.display_name || user?.email || 'Provider'}
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefresh}
                  disabled={refreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  {refreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                
                <Link href="/manage-promoters">
                  <Button size="sm" className="flex items-center gap-2">
                    <UserCheck className="w-4 h-4" />
                    Manage Promoters
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="space-y-8">
            {/* Provider Overview Stats */}
            <Suspense fallback={<div className="h-64 bg-slate-100 rounded-lg animate-pulse" />}>
              <ProviderStatsOverview />
            </Suspense>

            {/* Provider Quick Actions */}
            <Suspense fallback={<div className="h-64 bg-slate-100 rounded-lg animate-pulse" />}>
              <ProviderQuickActions />
            </Suspense>

            {/* Full Provider Management Dashboard */}
            <Suspense fallback={<div className="h-96 bg-slate-100 rounded-lg animate-pulse" />}>
              <ProviderManagementDashboard />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardAuthGuard>
  )
}
