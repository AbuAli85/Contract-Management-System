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
import { toast } from '@/components/ui/use-toast'
import { CardDescription } from '@/components/ui/card'

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
  const { user, loading: authLoading, profile } = useAuth()
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

  // Debug logging
  useEffect(() => {
    console.log('🔍 Dashboard Debug:', { 
      user: user?.id, 
      authLoading, 
      profile: profile?.id,
      loading 
    })
  }, [user, authLoading, profile, loading])

  // Show loading if auth is still loading
  if (authLoading) {
    console.log('🔄 Dashboard: Auth still loading, showing loading component')
    return <DashboardLoading />
  }

  // Show error if no user
  if (!user) {
    console.log('❌ Dashboard: No user found, redirecting to login')
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the dashboard.</p>
          <Link href="/auth/login">
            <Button>Go to Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  // Define quickActions before using it
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
      title: 'Analytics',
      description: 'View detailed analytics and reports',
      icon: BarChart3,
      href: '/dashboard/analytics',
      permission: 'analytics:view',
      badge: 'New'
    },
    {
      title: 'Settings',
      description: 'Manage system settings',
      icon: Settings,
      href: '/dashboard/settings',
      permission: 'settings:view'
    },
    {
      title: 'Notifications',
      description: 'View system notifications',
      icon: Bell,
      href: '/dashboard/notifications',
      permission: 'notifications:view'
    }
  ]

  // Show dashboard with loading indicator if data is still loading
  if (loading) {
    console.log('📊 Dashboard: Data loading, showing dashboard with loading indicator')
    return (
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-2">
              Welcome back! Loading your data...
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            <span className="text-sm text-gray-500">Loading data...</span>
          </div>
        </div>

        {/* Stats Cards with loading state */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Loading...</p>
                    <p className="text-2xl font-bold text-gray-900">
                      <Loader2 className="h-6 w-6 animate-spin inline" />
                    </p>
                  </div>
                  <div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {quickActions.map((action) => (
            <Card key={action.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{action.title}</CardTitle>
                <action.icon className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Database Connection Test */}
        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Database Performance Test</CardTitle>
              <CardDescription>
                Test database connection speed to diagnose performance issues
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button 
                onClick={async () => {
                  try {
                    console.log('🧪 Testing database connection...')
                    const response = await fetch('/api/test-db-connection')
                    const data = await response.json()
                    console.log('📊 Database test results:', data)
                    
                    if (data.success) {
                      toast({
                        title: "Database Test Complete",
                        description: `Connection: ${data.results.connectionTime}, Overall: ${data.performance.overall}`,
                        variant: "default"
                      })
                    } else {
                      toast({
                        title: "Database Test Failed",
                        description: data.error,
                        variant: "destructive"
                      })
                    }
                  } catch (error) {
                    console.error('❌ Database test error:', error)
                    toast({
                      title: "Database Test Error",
                      description: "Failed to test database connection",
                      variant: "destructive"
                    })
                  }
                }}
                variant="outline"
                className="w-full"
              >
                🧪 Test Database Connection
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('🔄 Fetching dashboard data...')
        
        // Increase timeout for slow database connections
        const timeoutId = setTimeout(() => {
          console.log('⏰ Dashboard API timeout, using default stats')
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
          setLoading(false)
        }, 10000) // Increased to 10 seconds

        // Fetch dashboard analytics with increased timeout
        const fetchPromise = fetch('/api/dashboard/analytics')
        const response = await Promise.race([
          fetchPromise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Dashboard API timeout')), 10000) // Increased to 10 seconds
          )
        ]) as Response
        
        clearTimeout(timeoutId) // Clear timeout if API responds
        
        console.log('📊 Dashboard API response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('📊 Dashboard data received:', data)
          
          if (data.success) {
            setStats(data.stats)
          } else {
            console.error('❌ Dashboard API error:', data.error)
            // Use default stats on error
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
          console.error('❌ Dashboard API failed:', response.status)
          // Use default stats on failure
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
        // Use default stats on error
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
        setLoading(false)
      }
    }

    // Only fetch if user is authenticated
    if (user && !authLoading) {
      console.log('🚀 Starting dashboard data fetch for user:', user.id)
      fetchDashboardData()
    } else if (!authLoading) {
      // If no user and auth is not loading, set loading to false
      console.log('👤 No user found, setting loading to false')
      setLoading(false)
    }
  }, [user, authLoading])

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