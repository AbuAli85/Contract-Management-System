"use client"

import React, { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { useAuth } from "@/src/components/auth/simple-auth-provider"
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
  Clock,
} from "lucide-react"
import { getDashboardAnalytics } from "@/lib/dashboard-data.client"
import type { DashboardAnalytics } from "@/lib/dashboard-types"

interface DashboardStats {
  totalContracts: number
  activePromoters: number
  revenue: number
  pendingReviews: number
}

interface RecentActivity {
  id: string
  type: "contract_approved" | "promoter_registered" | "contract_pending"
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
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null)

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
      case "contract_approved":
        return <CheckCircle className="h-2 w-2 text-green-500" />
      case "contract_pending":
        return <Clock className="h-2 w-2 text-yellow-500" />
      case "promoter_registered":
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
          <p className="text-muted-foreground">Welcome back, {user?.email || "User"}</p>
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
            <div className="text-2xl font-bold">{analytics.total_contracts}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(analytics.total_contracts * 0.1)} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promoters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.active_contracts}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(analytics.active_contracts * 0.05)} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${analytics.revenue_this_month.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(analytics.revenue_this_month * 0.08)} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.pending_contracts}</div>
            <p className="text-xs text-muted-foreground">
              {analytics.pending_contracts > 0 ? "Requires attention" : "All caught up"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={handleSearchContracts}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Search Contracts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Find and manage existing contracts</p>
          </CardContent>
        </Card>
        <Card
          className="cursor-pointer transition-shadow hover:shadow-md"
          onClick={handleManagePromoters}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Manage Promoters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">View and manage promoter profiles</p>
          </CardContent>
        </Card>
        <Card className="cursor-pointer transition-shadow hover:shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              System Settings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Configure system preferences</p>
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
            {analytics.recent_activity.length > 0 ? (
              analytics.recent_activity.map((activity: any, index: number) => (
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
    </div>
  )
}
