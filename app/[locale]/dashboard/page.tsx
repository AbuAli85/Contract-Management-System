'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthProvider'
import SimpleAdminDashboard from '@/components/dashboard/SimpleAdminDashboard'
import SimplePromoterDashboard from '@/components/dashboard/SimplePromoterDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  FileText, 
  BarChart3,
  Plus,
  ArrowRight,
  CheckCircle,
  Clock,
  TrendingUp,
  Eye,
  Star,
  AlertTriangle,
  Zap,
  CheckCircle2
} from 'lucide-react'

export default function DashboardPage() {
  const { user, role, loading } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showDemo, setShowDemo] = useState(false)
  const [authTimeout, setAuthTimeout] = useState(false)
  const [authSuccess, setAuthSuccess] = useState(false)

  useEffect(() => {
    // Set a timeout to show demo if authentication takes too long
    const timeout = setTimeout(() => {
      setAuthTimeout(true)
    }, 3000) // Reduced to 3 seconds

    return () => clearTimeout(timeout)
  }, [])

  useEffect(() => {
    // Simple authentication check
    if (user && role) {
      setIsAuthenticated(true)
      setAuthSuccess(true)
    } else if (!loading) {
      setIsAuthenticated(false)
    }
  }, [user, role, loading])

  // Show success message briefly
  useEffect(() => {
    if (authSuccess) {
      const timer = setTimeout(() => {
        setAuthSuccess(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [authSuccess])

  // Show demo UI if bypass is enabled or timeout reached
  if (showDemo || authTimeout) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">
                {authTimeout ? 'Demo Mode (Auth Timeout)' : 'Demo Mode - Beautiful New UI'}
              </span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => {
                setShowDemo(false)
                setAuthTimeout(false)
                window.location.reload()
              }}
            >
              Exit Demo
            </Button>
          </div>
        </div>
        <SimpleAdminDashboard />
      </div>
    )
  }

  // Show loading state with prominent instant access button
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center space-y-6 max-w-md">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900">Loading Dashboard...</h2>
          <p className="text-gray-600">This may take a few moments</p>
          
          {/* Prominent Instant Access Button */}
          <div className="pt-6 space-y-4">
            <div className="bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-200 rounded-lg p-4">
              <h3 className="font-semibold text-red-800 mb-2">🚀 Want to See the Beautiful UI Now?</h3>
              <p className="text-sm text-red-700 mb-4">
                Skip authentication and see the professional dashboard immediately
              </p>
              <Button 
                asChild
                size="lg"
                className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
              >
                <a href="/en/instant">
                  <Zap className="mr-2 h-5 w-5" />
                  INSTANT BEAUTIFUL UI
                </a>
              </Button>
            </div>
            
            {/* Alternative options */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowDemo(true)}
                className="flex-1"
              >
                <Eye className="mr-2 h-4 w-4" />
                Show Demo
              </Button>
              <Button 
                variant="outline" 
                asChild
                className="flex-1"
              >
                <a href="/en/bypass">
                  <Star className="mr-2 h-4 w-4" />
                  Bypass
                </a>
              </Button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Show success message briefly
  if (authSuccess && isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 bg-green-50 border-b border-green-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span className="font-medium text-green-800">
                ✅ Authentication Successful! Loading dashboard...
              </span>
            </div>
          </div>
        </div>
        <div className="p-8">
          <div className="max-w-4xl mx-auto">
            <SimpleAdminDashboard />
          </div>
        </div>
      </div>
    )
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Welcome to Contract Management System</CardTitle>
            <CardDescription>
              Please log in to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center space-y-2">
              <p className="text-sm text-muted-foreground">
                You need to be logged in to view the dashboard
              </p>
              <Button asChild className="w-full">
                <a href="/en/login">
                  Go to Login
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              </Button>
            </div>
            
            {/* Prominent Instant Access */}
            <div className="pt-4 border-t">
              <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4 mb-3">
                <h3 className="font-semibold text-red-800 mb-2">🚀 See Beautiful UI Now!</h3>
                <p className="text-sm text-red-700 mb-3">
                  No authentication required - instant access to professional dashboard
                </p>
                <Button 
                  asChild
                  className="w-full bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                >
                  <a href="/en/instant">
                    <Zap className="mr-2 h-4 w-4" />
                    INSTANT BEAUTIFUL UI
                  </a>
                </Button>
              </div>
              
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => setShowDemo(true)}
              >
                <Eye className="mr-2 h-4 w-4" />
                View Demo Interface
              </Button>
            </div>
            
            {/* Quick Stats Preview */}
            <div className="pt-6 border-t">
              <h3 className="text-sm font-medium mb-3">System Overview</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <Users className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                  <p className="text-sm font-medium">Promoters</p>
                  <p className="text-xs text-muted-foreground">Manage team</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <FileText className="h-6 w-6 text-green-600 mx-auto mb-1" />
                  <p className="text-sm font-medium">Contracts</p>
                  <p className="text-xs text-muted-foreground">Track agreements</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Show appropriate dashboard based on role
  return (
    <div className="min-h-screen bg-gray-50">
      {role === 'admin' ? (
        <SimpleAdminDashboard />
      ) : (
        <SimplePromoterDashboard />
      )}
    </div>
  )
} 