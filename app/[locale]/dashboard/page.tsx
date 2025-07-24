'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthProvider'
import AdminDashboard from '@/components/dashboard/AdminDashboard'
import PromoterDashboard from '@/components/dashboard/PromoterDashboard'
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
  Star
} from 'lucide-react'

export default function DashboardPage() {
  const { user, role, loading } = useAuth()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showDemo, setShowDemo] = useState(false)

  useEffect(() => {
    // Simple authentication check
    if (user && role) {
      setIsAuthenticated(true)
    } else if (!loading) {
      setIsAuthenticated(false)
    }
  }, [user, role, loading])

  // Show loading state
  if (loading && !showDemo) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">Loading dashboard...</p>
          <p className="text-sm text-gray-500">This may take a few moments</p>
          
          {/* Bypass option for testing */}
          <div className="pt-4">
            <Button 
              variant="outline" 
              onClick={() => setShowDemo(true)}
              className="text-sm"
            >
              <Eye className="mr-2 h-4 w-4" />
              Show Demo UI (Skip Auth)
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // Show demo UI if bypass is enabled
  if (showDemo) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="p-4 bg-blue-50 border-b border-blue-200">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Star className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-800">Demo Mode - Beautiful New UI</span>
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowDemo(false)}
            >
              Exit Demo
            </Button>
          </div>
        </div>
        <AdminDashboard />
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
            
            {/* Demo option */}
            <div className="pt-4 border-t">
              <p className="text-sm text-center text-gray-600 mb-3">
                Want to see the beautiful new UI?
              </p>
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
        <AdminDashboard />
      ) : (
        <PromoterDashboard />
      )}
    </div>
  )
} 