"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/src/components/auth/auth-provider"
import { 
  FileText, 
  Users, 
  TrendingUp, 
  Settings,
  Plus,
  Search,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock
} from "lucide-react"
import { getDashboardAnalytics } from "@/lib/dashboard-data.client"

interface DashboardStats {
  totalContracts: number
  activePromoters: number
  revenue: number
  pendingReviews: number
}

interface RecentActivity {
  id: string
  type: 'contract_approved' | 'promoter_registered' | 'contract_pending'
  message: string
  timestamp: string
}

interface Contract {
  id: string
  contract_number: string
  status: string
  contract_value: number
  created_at: string
}

interface Promoter {
  id: string
  status: string
}

export default function DashboardContent({ locale }: { locale: string }) {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [analytics, setAnalytics] = useState(null)

  // Fetch dashboard data
  useEffect(() => {
    getDashboardAnalytics().then(setAnalytics)
  }, [locale])

  if (!analytics) return <div>Loading...</div>

  const handleNewContract = () => {
    router.push(`/${locale}/generate-contract`)
  }

  const handleSearchContracts = () => {
    router.push(`/${locale}/contracts`)
  }

  const handleManagePromoters = () => {
    router.push(`/${locale}/manage-promoters`)
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'contract_approved':
        return <CheckCircle className="h-2 w-2 text-green-500" />
      case 'contract_pending':
        return <Clock className="h-2 w-2 text-yellow-500" />
      case 'promoter_registered':
        return <Users className="h-2 w-2 text-blue-500" />
      default:
        return <AlertCircle className="h-2 w-2 text-gray-500" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back, {user?.email || 'User'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleNewContract} className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Contract
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalContracts}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(analytics.totalContracts * 0.1)} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promoters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.activePromoters}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(analytics.activePromoters * 0.05)} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(analytics.revenue * 0.08)} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.pendingReviews > 0 ? 'Requires attention' : 'All caught up'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleSearchContracts}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Find and manage existing contracts
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={handleManagePromoters}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Promoters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              View and manage promoter profiles
            </p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Configure system preferences
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.recentActivity.length > 0 ? (
              analytics.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3">
                  {getActivityIcon(activity.type)}
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.timestamp}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground">No recent activity</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <Card>
        <CardHeader>
          <CardTitle>System Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${analytics.systemStatus.database === 'Online' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Database: {analytics.systemStatus.database}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${analytics.systemStatus.apiServices === 'Online' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">API Services: {analytics.systemStatus.apiServices}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${analytics.systemStatus.fileStorage === 'Online' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">File Storage: {analytics.systemStatus.fileStorage}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 