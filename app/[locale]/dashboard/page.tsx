"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Users, 
  UserCheck, 
  TrendingUp, 
  Activity, 
  Clock, 
  CheckCircle,
  ArrowRight,
  Shield,
  LogOut,
  Loader2
} from "lucide-react"
import { useAuth } from "@/app/providers"
import { getDashboardAnalytics } from "@/lib/dashboard-data.client"
import { createClient } from "@/lib/supabase/client"
import type { DashboardAnalytics } from "@/lib/dashboard-types"
import Link from "next/link"

interface DashboardData {
  analytics: DashboardAnalytics | null
  recentActivity: any[]
  loading: boolean
  error: string | null
}

export default function DashboardPage() {
  const { user, session } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    analytics: null,
    recentActivity: [],
    loading: true,
    error: null
  })

  useEffect(() => {
    setMounted(true)
    fetchDashboardData()
    
    // Set up real-time subscriptions for data updates
    const supabase = createClient()
    if (supabase) {
      // Subscribe to contract changes
      const contractsChannel = supabase
        .channel('dashboard-contracts')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'contracts' }, 
          () => {
            fetchDashboardData()
          }
        )
        .subscribe()
      
      // Subscribe to promoter changes
      const promotersChannel = supabase
        .channel('dashboard-promoters')
        .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'promoters' }, 
          () => {
            fetchDashboardData()
          }
        )
        .subscribe()
      
      // Subscribe to audit log changes for recent activity
      const auditChannel = supabase
        .channel('dashboard-audit')
        .on('postgres_changes', 
          { event: 'INSERT', schema: 'public', table: 'audit_logs' }, 
          () => {
            fetchDashboardData()
          }
        )
        .subscribe()
      
      // Cleanup subscriptions on unmount
      return () => {
        supabase.removeChannel(contractsChannel)
        supabase.removeChannel(promotersChannel)
        supabase.removeChannel(auditChannel)
      }
    }
  }, [])

  const fetchDashboardData = async () => {
    try {
      setDashboardData(prev => ({ ...prev, loading: true, error: null }))
      
      // Fetch analytics data
      const analytics = await getDashboardAnalytics()
      
      // Fetch recent activity from audit logs
      const supabase = createClient()
      let auditLogs: any[] = []
      let auditError = null
      
      if (supabase) {
        const { data, error } = await supabase
          .from('audit_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5)
        auditLogs = data || []
        auditError = error
      }
      
      if (auditError) {
        console.error('Error fetching audit logs:', auditError)
      }
      
      setDashboardData({
        analytics,
        recentActivity: auditLogs,
        loading: false,
        error: null
      })
    } catch (error) {
      console.error('Error fetching dashboard data:', error)
      setDashboardData(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load dashboard data'
      }))
    }
  }

  if (!mounted || dashboardData.loading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your contract management system.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (dashboardData.error) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's an overview of your contract management system.
          </p>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <p className="text-red-500 mb-4">{dashboardData.error}</p>
            <Button onClick={fetchDashboardData}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  const { analytics, recentActivity } = dashboardData
  
  // Calculate percentage changes (mock for now, you can implement based on your needs)
  const formatPercentageChange = (current: number, previous: number) => {
    if (previous === 0) return "+0%"
    const change = ((current - previous) / previous) * 100
    return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's an overview of your contract management system.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.total_contracts?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {formatPercentageChange(analytics?.contracts_this_month || 0, analytics?.contracts_last_month || 0)} from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promoters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.active_promoters?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.total_promoters ? `${analytics.active_promoters}/${analytics.total_promoters} total` : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Contracts</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.pending_contracts?.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.total_contracts ? `${((analytics.pending_contracts || 0) / analytics.total_contracts * 100).toFixed(1)}% of total` : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics?.success_rate?.toFixed(1) || 0}%</div>
            <p className="text-xs text-muted-foreground">
              {analytics?.completed_contracts || 0} completed contracts
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Contract
            </CardTitle>
            <CardDescription>
              Create a new contract with our intelligent templates
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/generate-contract">
              <Button className="w-full">
                Create Contract
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Promoters
            </CardTitle>
            <CardDescription>
              View and manage promoter profiles and performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/manage-promoters">
              <Button variant="outline" className="w-full">
                View Promoters
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              View Analytics
            </CardTitle>
            <CardDescription>
              Access detailed analytics and performance insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/contracts/analytics">
              <Button variant="outline" className="w-full">
                View Analytics
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
          <CardDescription>
            Latest system activities and updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => {
                const getActivityColor = (action: string) => {
                  if (action.includes('create')) return 'bg-green-500'
                  if (action.includes('update')) return 'bg-blue-500'
                  if (action.includes('delete')) return 'bg-red-500'
                  return 'bg-gray-500'
                }
                
                const formatTimeAgo = (dateString: string) => {
                  const date = new Date(dateString)
                  const now = new Date()
                  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))
                  
                  if (diffInMinutes < 1) return 'Just now'
                  if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`
                  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`
                  return `${Math.floor(diffInMinutes / 1440)} days ago`
                }
                
                return (
                  <div key={activity.id} className="flex items-center space-x-4">
                    <div className={`w-2 h-2 rounded-full ${getActivityColor(activity.action)}`}></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.action} {activity.table_name}</p>
                      <p className="text-xs text-muted-foreground">{formatTimeAgo(activity.created_at)}</p>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-muted-foreground">No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
