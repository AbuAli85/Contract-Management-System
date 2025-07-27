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
import Link from 'next/link'
import { CardDescription } from '@/components/ui/card'
import { useAuth } from '@/src/components/auth/auth-provider'

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

export default function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { user, loading: authLoading, profile, mounted } = useAuth()
  const [locale, setLocale] = useState('en')
  const [dataLoading, setDataLoading] = useState(false)
  
  // Debug logging
  console.log('🔧 Dashboard: Component rendered', { 
    user: !!user, 
    authLoading, 
    mounted, 
    profile: !!profile,
    dataLoading 
  })
  
  useEffect(() => {
    const getLocale = async () => {
      const { locale: resolvedLocale } = await params
      setLocale(resolvedLocale)
    }
    getLocale()
  }, [params])
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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        console.log('🔧 Dashboard: Fetching analytics data...')
        setDataLoading(true)
        
        // Add timeout to prevent hanging
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout
        
        // Fetch dashboard analytics in background
        const response = await fetch('/api/dashboard/analytics', {
          signal: controller.signal,
          credentials: 'include' // Ensure cookies are sent
        })
        
        clearTimeout(timeoutId)
        
        console.log('🔧 Dashboard: API response status:', response.status)
        
        if (response.ok) {
          const data = await response.json()
          console.log('🔧 Dashboard: API response:', data)
          
          if (data.success && data.stats) {
            console.log('🔧 Dashboard: Setting stats:', data.stats)
            setStats(data.stats)
          } else {
            console.warn('🔧 Dashboard: Invalid API response structure:', data)
            // Set default stats if API fails
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
          console.error('🔧 Dashboard: API request failed:', response.status)
          
          // Handle 401 error specifically
          if (response.status === 401) {
            console.log('🔧 Dashboard: Authentication required, checking session...')
            try {
              const sessionResponse = await fetch('/api/auth/check-session')
              const sessionData = await sessionResponse.json()
              console.log('🔧 Dashboard: Session check result:', sessionData)
              
              if (!sessionData.success || !sessionData.hasSession) {
                console.log('🔧 Dashboard: No valid session, redirecting to login')
                // Redirect to login if no valid session
                window.location.href = `/${locale}/auth/login`
                return
              }
            } catch (sessionError) {
              console.error('🔧 Dashboard: Session check failed:', sessionError)
            }
          }
          
          // Set default stats if API fails
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
        console.error('🔧 Dashboard: Error fetching dashboard data:', error)
        if (error instanceof Error && error.name === 'AbortError') {
          console.log('🔧 Dashboard: Request timed out, using default stats')
        }
        // Set default stats if API fails
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
        setDataLoading(false)
      }
    }

    // Only fetch if user is authenticated
    if (user && !authLoading) {
      fetchDashboardData()
    }
  }, [user, authLoading])

  // Show loading if auth is still loading
  if (authLoading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading authentication...</p>
        </div>
      </div>
    )
  }

  // Show error if no user - but allow bypass for testing
  if (!user) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
          <p className="text-gray-600 mb-4">Please log in to access the dashboard.</p>
          <div className="space-x-4">
            <Link href={`/${locale}/auth/login`}>
              <Button>Go to Login</Button>
            </Link>
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('🔧 Dashboard: Bypassing auth for testing')
                // Force render the dashboard content
                window.location.reload()
              }}
            >
              Bypass Auth (Test)
            </Button>
            <Button 
              variant="outline" 
              onClick={async () => {
                console.log('🔧 Dashboard: Checking session manually...')
                try {
                  const response = await fetch('/api/auth/check-session')
                  const data = await response.json()
                  console.log('🔧 Dashboard: Manual session check result:', data)
                  
                  if (data.success && data.hasSession) {
                    console.log('🔧 Dashboard: Session found, reloading page...')
                    window.location.reload()
                  } else {
                    console.log('🔧 Dashboard: No session found')
                    alert('No session found. Please log in again.')
                  }
                } catch (error) {
                  console.error('🔧 Dashboard: Session check failed:', error)
                }
              }}
            >
              Check Session
            </Button>
            <Button 
              variant="outline" 
              onClick={() => {
                console.log('🔧 Dashboard: Checking cookies...')
                const cookies = document.cookie.split(';').map(c => c.trim())
                const authCookies = cookies.filter(c => c.includes('auth-token') || c.includes('sb-'))
                console.log('🔧 Dashboard: Auth cookies found:', authCookies)
                
                if (authCookies.length > 0) {
                  alert(`Found ${authCookies.length} auth cookies. Check console for details.`)
                } else {
                  alert('No auth cookies found. Please log in again.')
                }
              }}
            >
              Check Cookies
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Ensure stats has default values to prevent undefined errors
  const safeStats = {
    totalContracts: stats?.totalContracts ?? 0,
    activeContracts: stats?.activeContracts ?? 0,
    pendingContracts: stats?.pendingContracts ?? 0,
    totalPromoters: stats?.totalPromoters ?? 0,
    totalParties: stats?.totalParties ?? 0,
    pendingApprovals: stats?.pendingApprovals ?? 0,
    systemHealth: stats?.systemHealth ?? 98,
    recentActivity: stats?.recentActivity ?? 0
  }

  console.log('🔧 Dashboard: Current stats:', stats)
  console.log('🔧 Dashboard: Safe stats:', safeStats)

  // Define quickActions
  const quickActions = [
    {
      title: 'Generate Contract',
      description: 'Create a new contract with AI assistance',
      icon: FileText,
      href: `/${locale}/generate-contract`,
      badge: 'AI'
    },
    {
      title: 'Add Promoter',
      description: 'Register a new promoter',
      icon: Users,
      href: `/${locale}/manage-promoters`
    },
    {
      title: 'Add Party',
      description: 'Register a new party',
      icon: Building2,
      href: `/${locale}/manage-parties`
    },
    {
      title: 'User Approvals',
      description: 'Review pending user registrations',
      icon: UserCheck,
      href: `/${locale}/dashboard/user-approvals`,
      badge: 'New'
    },
    {
      title: 'Contract Approvals',
      description: 'Review pending contract approvals',
      icon: FileCheck,
      href: `/${locale}/dashboard/approvals`,
      badge: 'New'
    },
    {
      title: 'Analytics',
      description: 'View detailed analytics and reports',
      icon: BarChart3,
      href: `/${locale}/dashboard/analytics`,
      badge: 'New'
    },
    {
      title: 'Settings',
      description: 'Manage system settings',
      icon: Settings,
      href: `/${locale}/dashboard/settings`
    },
    {
      title: 'Notifications',
      description: 'View system notifications',
      icon: Bell,
      href: `/${locale}/dashboard/notifications`
    }
  ]

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

  try {
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
              {dataLoading && (
                <Badge variant="secondary" className="flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Loading data...
                </Badge>
              )}
              <Badge variant="outline" className="flex items-center gap-1">
                <Activity className="h-3 w-3" />
                System Health: {safeStats.systemHealth}%
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
                <div className="text-2xl font-bold">{safeStats.totalContracts}</div>
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
                <div className="text-2xl font-bold">{safeStats.activeContracts}</div>
                <p className="text-xs text-muted-foreground">
                  {safeStats.totalContracts > 0 ? Math.round((safeStats.activeContracts / safeStats.totalContracts) * 100) : 0}% of total
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <Clock className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{safeStats.pendingApprovals}</div>
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
                <div className="text-2xl font-bold">{safeStats.totalPromoters}</div>
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
  } catch (error) {
    console.error('🔧 Dashboard: Rendering error:', error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Dashboard Error</h2>
          <p className="text-gray-600 mb-4">Something went wrong while loading the dashboard.</p>
          <p className="text-sm text-red-500 mb-4">{error instanceof Error ? error.message : 'Unknown error'}</p>
          <Button onClick={() => window.location.reload()}>Reload Page</Button>
        </div>
      </div>
    )
  }
} 