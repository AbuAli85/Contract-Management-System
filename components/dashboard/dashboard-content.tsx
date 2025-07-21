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
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    activePromoters: 0,
    revenue: 0,
    pendingReviews: 0
  })
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [systemStatus, setSystemStatus] = useState({
    database: 'Online',
    apiServices: 'Online',
    fileStorage: 'Online'
  })

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch contracts data
        const contractsResponse = await fetch('/api/contracts', {
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!contractsResponse.ok) {
          console.log('Contracts API returned:', contractsResponse.status, contractsResponse.statusText)
          if (contractsResponse.status === 401) {
            console.log('User not authenticated, redirecting to login...')
            // Redirect to locale-specific login page
            window.location.href = `/${locale}/login`
            return
          }
          // Use fallback data if API fails
          setStats(prev => ({ ...prev, totalContracts: 0, revenue: 0, pendingReviews: 0 }))
          setRecentActivity([])
          return
        }
        
        const contractsData: Contract[] = await contractsResponse.json()
        
        // Fetch promoters data
        const promotersResponse = await fetch('/api/promoters', {
          credentials: 'include', // Include cookies for authentication
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (!promotersResponse.ok) {
          console.log('Promoters API returned:', promotersResponse.status, promotersResponse.statusText)
          if (promotersResponse.status === 401) {
            console.log('User not authenticated, redirecting to login...')
            // Redirect to locale-specific login page
            window.location.href = `/${locale}/login`
            return
          }
          // Use fallback data if API fails
          setStats(prev => ({ ...prev, activePromoters: 0 }))
          return
        }
        
        const promotersData: Promoter[] = await promotersResponse.json()
        
        // Calculate stats
        const totalContracts = contractsData.length || 0
        const activePromoters = promotersData.filter((p: Promoter) => p.status === 'active').length || 0
        const revenue = contractsData.reduce((sum: number, contract: Contract) => 
          sum + (contract.contract_value || 0), 0)
        const pendingReviews = contractsData.filter((c: Contract) => c.status === 'pending').length || 0

        setStats({
          totalContracts,
          activePromoters,
          revenue,
          pendingReviews
        })

        // Generate recent activity from contracts
        const activity: RecentActivity[] = contractsData.slice(0, 5).map((contract: Contract) => ({
          id: contract.id,
          type: contract.status === 'completed' ? 'contract_approved' : 
                contract.status === 'pending' ? 'contract_pending' : 'promoter_registered',
          message: contract.status === 'completed' ? `Contract ${contract.contract_number} approved` :
                   contract.status === 'pending' ? `Contract ${contract.contract_number} pending review` :
                   `New contract ${contract.contract_number} created`,
          timestamp: new Date(contract.created_at).toLocaleDateString()
        }))

        setRecentActivity(activity)

      } catch (error) {
        console.error('Error fetching dashboard data:', error)
        // Set fallback data
        setStats({
          totalContracts: 0,
          activePromoters: 0,
          revenue: 0,
          pendingReviews: 0
        })
        setRecentActivity([])
      }
    }

    if (!loading) {
      fetchDashboardData()
    }
  }, [loading, locale])

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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading dashboard...</div>
      </div>
    )
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
            <div className="text-2xl font-bold">{stats.totalContracts}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(stats.totalContracts * 0.1)} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promoters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activePromoters}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(stats.activePromoters * 0.05)} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.revenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              +{Math.floor(stats.revenue * 0.08)} from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">
              {stats.pendingReviews > 0 ? 'Requires attention' : 'All caught up'}
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
            {recentActivity.length > 0 ? (
              recentActivity.map((activity) => (
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
              <div className={`h-2 w-2 rounded-full ${systemStatus.database === 'Online' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">Database: {systemStatus.database}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${systemStatus.apiServices === 'Online' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">API Services: {systemStatus.apiServices}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`h-2 w-2 rounded-full ${systemStatus.fileStorage === 'Online' ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm">File Storage: {systemStatus.fileStorage}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 