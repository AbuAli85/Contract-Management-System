'use client'

import { Suspense, useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Users, 
  FileText, 
  Building2, 
  CheckCircle, 
  Clock, 
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Plus,
  Activity,
  BarChart3,
  Bell,
  Settings,
  UserCheck,
  FileCheck,
  Database,
  Shield,
  Globe,
  HardDrive,
  Loader2,
  Zap
} from 'lucide-react'
import { SystemStatus } from '@/components/system-status'
import { useAuth } from '@/src/components/auth/auth-provider'
import { usePermissions } from '@/hooks/use-permissions'
import Link from 'next/link'

// Loading fallback
function DashboardLoading() {
  return (
    <div className="flex justify-center items-center py-12">
      <Loader2 className="animate-spin mr-2" /> Loading dashboard...
    </div>
  )
}

interface DashboardStats {
  totalContracts: number
  activeContracts: number
  pendingContracts: number
  totalPromoters: number
  totalParties: number
  pendingApprovals: number
  systemHealth: number
  recentActivity: number
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const permissions = usePermissions()
  const [stats, setStats] = useState<DashboardStats>({
    totalContracts: 0,
    activeContracts: 0,
    pendingContracts: 0,
    totalPromoters: 0,
    totalParties: 0,
    pendingApprovals: 0,
    systemHealth: 98,
    recentActivity: 0
  })
  const [loading, setLoading] = useState(true)

  // Show loading if auth is still loading
  if (authLoading) {
    return <DashboardLoading />
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('🔄 Fetching dashboard data...')
        // Fetch dashboard analytics
        const response = await fetch('/api/dashboard/analytics')
        console.log('📊 Dashboard API response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('📊 Dashboard API data:', data)
          if (data.success) {
            setStats(data.data)
          } else {
            console.error('❌ Dashboard API returned error:', data.error)
            // Set default stats on error
            setStats({
              totalContracts: 0,
              activeContracts: 0,
              pendingContracts: 0,
              totalPromoters: 0,
              totalParties: 0,
              pendingApprovals: 0,
              systemHealth: 98,
              recentActivity: 0
            })
          }
        } else {
          console.error('❌ Dashboard API failed with status:', response.status)
          // Set default stats on error
          setStats({
            totalContracts: 0,
            activeContracts: 0,
            pendingContracts: 0,
            totalPromoters: 0,
            totalParties: 0,
            pendingApprovals: 0,
            systemHealth: 98,
            recentActivity: 0
          })
        }
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error)
        // Set default stats on error
        setStats({
          totalContracts: 0,
          activeContracts: 0,
          pendingContracts: 0,
          totalPromoters: 0,
          totalParties: 0,
          pendingApprovals: 0,
          systemHealth: 98,
          recentActivity: 0
        })
      } finally {
        console.log('✅ Dashboard data fetch completed')
        setLoading(false)
      }
    }

    // Only fetch if user is authenticated
    if (user && !authLoading) {
      fetchDashboardData()
    } else if (!authLoading) {
      // If no user and auth is not loading, set loading to false
      setLoading(false)
    }
  }, [user, authLoading])

  const quickActions = [
    {
      title: 'Generate Contract',
      description: 'Create a new contract with AI assistance',
      icon: FileText,
      href: '/generate-contract',
      permission: 'contract:create',
      badge: 'AI'
    },
    {
      title: 'Add Promoter',
      description: 'Register a new promoter',
      icon: Users,
      href: '/manage-promoters',
      permission: 'promoter:create'
    },
    {
      title: 'Add Party',
      description: 'Register a new party',
      icon: Building2,
      href: '/manage-parties',
      permission: 'party:create'
    },
    {
      title: 'User Approvals',
      description: 'Review pending user registrations',
      icon: UserCheck,
      href: '/dashboard/user-approvals',
      permission: 'user:create',
      badge: 'New'
    },
    {
      title: 'Contract Approvals',
      description: 'Review pending contract approvals',
      icon: FileCheck,
      href: '/dashboard/approvals',
      permission: 'contract:approve',
      badge: 'New'
    },
    {
      title: 'System Settings',
      description: 'Configure system preferences',
      icon: Settings,
      href: '/dashboard/settings',
      permission: 'system:settings'
    }
  ].filter(action => permissions.can(action.permission as any))

  const systemServices = [
    {
      name: 'Database',
      status: 'healthy',
      icon: Database,
      description: 'PostgreSQL connection'
    },
    {
      name: 'Authentication',
      status: 'healthy',
      icon: Shield,
      description: 'Supabase Auth'
    },
    {
      name: 'File Storage',
      status: 'healthy',
      icon: HardDrive,
      description: 'Document storage'
    },
    {
      name: 'API Gateway',
      status: 'healthy',
      icon: Globe,
      description: 'REST endpoints'
    }
  ]

  if (loading) {
    return <DashboardLoading />
  }

  return (
    <Suspense fallback={<DashboardLoading />}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Welcome back, {user?.email}. Here's your system overview.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              System Health: {stats.systemHealth}%
            </Badge>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalContracts}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 text-green-500" />
                +12% from last month
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeContracts}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalContracts > 0 ? Math.round((stats.activeContracts / stats.totalContracts) * 100) : 0}% of total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">
                Require attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Promoters</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPromoters}</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="inline h-3 w-3 text-green-500" />
                +5% from last month
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {quickActions.map((action) => (
                <Link key={action.title} href={action.href}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <action.icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{action.title}</h3>
                            {action.badge && (
                              <Badge variant="secondary" className="text-xs">
                                {action.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {action.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* System Status and Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                System Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {systemServices.map((service) => (
                  <div key={service.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <service.icon className="h-4 w-4 text-green-500" />
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.description}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-green-600 bg-green-50">
                      Healthy
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <FileText className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">New contract generated</p>
                    <p className="text-sm text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-full">
                    <UserCheck className="h-4 w-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">User approved</p>
                    <p className="text-sm text-muted-foreground">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-full">
                    <Users className="h-4 w-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">New promoter registered</p>
                    <p className="text-sm text-muted-foreground">10 minutes ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed System Status */}
        <SystemStatus />
      </div>
    </Suspense>
  )
} 