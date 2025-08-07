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
import { ClientManagementDashboard } from "@/components/client-management/client-management-dashboard"
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
  BarChart3
} from "lucide-react"

// Client-specific quick actions
function ClientQuickActions() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
          <Building2 className="w-4 h-4 text-blue-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Quick Actions</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link href="/generate-contract" className="group">
          <Card className="hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-blue-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Plus className="w-8 h-8 text-blue-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">New Contract</h3>
                  <p className="text-sm text-slate-600">Create new contract</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/contracts" className="group">
          <Card className="hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-green-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <FileText className="w-8 h-8 text-green-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">My Contracts</h3>
                  <p className="text-sm text-slate-600">View all contracts</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/promoters" className="group">
          <Card className="hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-purple-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-purple-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">Find Promoters</h3>
                  <p className="text-sm text-slate-600">Browse available talent</p>
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
                  <p className="text-sm text-slate-600">View analytics</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/notifications" className="group">
          <Card className="hover:shadow-md transition-all duration-200 border-slate-200/60 group-hover:border-indigo-300">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <Bell className="w-8 h-8 text-indigo-600" />
                <div>
                  <h3 className="font-semibold text-slate-900">Notifications</h3>
                  <p className="text-sm text-slate-600">Messages & alerts</p>
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
                  <h3 className="font-semibold text-slate-900">Profile</h3>
                  <p className="text-sm text-slate-600">Manage account</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}

// Client stats overview
function ClientStatsOverview() {
  const [stats, setStats] = useState({
    activeContracts: 0,
    totalSpent: 0,
    savedAmount: 0,
    completedProjects: 0,
    averageRating: 0,
    pendingPayments: 0
  })

  useEffect(() => {
    // Fetch client-specific stats
    const fetchStats = async () => {
      try {
        // This would be replaced with actual API calls
        setStats({
          activeContracts: 8,
          totalSpent: 145000,
          savedAmount: 23000,
          completedProjects: 24,
          averageRating: 4.7,
          pendingPayments: 2
        })
      } catch (error) {
        console.error('Error fetching client stats:', error)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-green-600" />
        </div>
        <h2 className="text-xl font-semibold text-slate-900">Your Overview</h2>
      </div>
      
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
              <CardDescription className="text-sm font-medium">Total Investment</CardDescription>
              <DollarSign className="w-8 h-8 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.totalSpent.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Lifetime spending</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardHeader className="space-y-0 pb-2">
            <div className="flex justify-between items-center">
              <CardDescription className="text-sm font-medium">Cost Savings</CardDescription>
              <TrendingUp className="w-8 h-8 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{stats.savedAmount.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">vs market rates</p>
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
              <CardDescription className="text-sm font-medium">Average Rating</CardDescription>
              <Activity className="w-8 h-8 text-orange-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}/5.0</div>
            <p className="text-xs text-muted-foreground">Service satisfaction</p>
          </CardContent>
        </Card>

        <Card className="border-slate-200/60">
          <CardHeader className="space-y-0 pb-2">
            <div className="flex justify-between items-center">
              <CardDescription className="text-sm font-medium">Pending Payments</CardDescription>
              <Clock className="w-8 h-8 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingPayments}</div>
            <p className="text-xs text-muted-foreground">Needs attention</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function ClientDashboard({ params }: { params: { locale: string } }) {
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
    <DashboardAuthGuard locale={locale} requiredRole="client">
      <SilentSessionTimeout />
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Header */}
          <div className="flex flex-col gap-6 mb-8">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Client Dashboard</h1>
                  <p className="text-slate-600">
                    Manage your contracts and service providers
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  Client
                </Badge>
                <Badge variant="outline" className="text-slate-600">
                  Active Account
                </Badge>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center">
              <div className="text-sm text-slate-600">
                Welcome back, {profile?.full_name || profile?.display_name || user?.email || 'Client'}
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
                
                <Link href="/generate-contract">
                  <Button size="sm" className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    New Contract
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Dashboard Content */}
          <div className="space-y-8">
            {/* Client Overview Stats */}
            <Suspense fallback={<div className="h-64 bg-slate-100 rounded-lg animate-pulse" />}>
              <ClientStatsOverview />
            </Suspense>

            {/* Client Quick Actions */}
            <Suspense fallback={<div className="h-64 bg-slate-100 rounded-lg animate-pulse" />}>
              <ClientQuickActions />
            </Suspense>

            {/* Full Client Management Dashboard */}
            <Suspense fallback={<div className="h-96 bg-slate-100 rounded-lg animate-pulse" />}>
              <ClientManagementDashboard />
            </Suspense>
          </div>
        </div>
      </div>
    </DashboardAuthGuard>
  )
}
