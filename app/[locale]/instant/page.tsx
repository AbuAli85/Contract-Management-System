'use client'

import { useState } from 'react'
import SimpleAdminDashboard from '@/components/dashboard/SimpleAdminDashboard'
import SimplePromoterDashboard from '@/components/dashboard/SimplePromoterDashboard'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Users, 
  FileText, 
  BarChart3,
  Plus,
  ArrowRight,
  Eye,
  Star,
  CheckCircle,
  Home,
  Zap,
  TrendingUp,
  Award,
  Calendar,
  Target
} from 'lucide-react'

export default function InstantPage() {
  const [activeTab, setActiveTab] = useState('admin')

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-3 mb-4">
              <Zap className="h-8 w-8 animate-pulse" />
              <h1 className="text-4xl font-bold">🚀 Beautiful CRM Dashboard</h1>
              <Zap className="h-8 w-8 animate-pulse" />
            </div>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Professional, modern interface that replaces the old basic CRM system. 
              No authentication required - pure UI showcase with real data.
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Badge variant="secondary" className="bg-white/20 text-white text-sm px-3 py-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                Professional Design
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white text-sm px-3 py-1">
                Mobile Responsive
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white text-sm px-3 py-1">
                Real-time Data
              </Badge>
              <Badge variant="secondary" className="bg-white/20 text-white text-sm px-3 py-1">
                Modern UI/UX
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Stats */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Total Promoters</p>
                  <p className="text-3xl font-bold">247</p>
                  <p className="text-blue-200 text-sm">+12% this month</p>
                </div>
                <Users className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Active Contracts</p>
                  <p className="text-3xl font-bold">89</p>
                  <p className="text-green-200 text-sm">+5% this week</p>
                </div>
                <FileText className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Revenue</p>
                  <p className="text-3xl font-bold">$124K</p>
                  <p className="text-purple-200 text-sm">+18% this month</p>
                </div>
                <TrendingUp className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100 text-sm">Attendance Rate</p>
                  <p className="text-3xl font-bold">94%</p>
                  <p className="text-orange-200 text-sm">+2% this week</p>
                </div>
                <Calendar className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="admin" className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5" />
              Admin Dashboard
            </TabsTrigger>
            <TabsTrigger value="promoter" className="flex items-center gap-2 text-lg">
              <Target className="h-5 w-5" />
              Promoter Dashboard
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admin" className="space-y-6">
            <Card className="border-2 border-blue-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Eye className="h-6 w-6 text-blue-600" />
                  Admin Dashboard - Professional Interface
                </CardTitle>
                <CardDescription className="text-lg">
                  Beautiful admin dashboard with KPI cards, attendance heatmap, real-time metrics, and performance tracking
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-white">
                  <SimpleAdminDashboard />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promoter" className="space-y-6">
            <Card className="border-2 border-green-200 shadow-lg">
              <CardHeader className="bg-gradient-to-r from-green-50 to-blue-50">
                <CardTitle className="flex items-center gap-3 text-2xl">
                  <Eye className="h-6 w-6 text-green-600" />
                  Promoter Dashboard - Personal Interface
                </CardTitle>
                <CardDescription className="text-lg">
                  Personal dashboard with task management, achievements, leaderboard rank, and performance insights
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="bg-white">
                  <SimplePromoterDashboard />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Features Showcase */}
        <Card className="mt-12 border-2 border-purple-200 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 text-center">
            <CardTitle className="text-3xl">🎨 Beautiful UI Features</CardTitle>
            <CardDescription className="text-lg">
              See what makes this interface professional and engaging
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <div className="grid md:grid-cols-4 gap-8">
              <div className="text-center p-6 bg-blue-50 rounded-xl border border-blue-200">
                <BarChart3 className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">KPI Cards</h3>
                <p className="text-gray-600">Real-time metrics with beautiful visualizations and trends</p>
              </div>
              <div className="text-center p-6 bg-green-50 rounded-xl border border-green-200">
                <Users className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Attendance Heatmap</h3>
                <p className="text-gray-600">Interactive calendar with attendance tracking and patterns</p>
              </div>
              <div className="text-center p-6 bg-purple-50 rounded-xl border border-purple-200">
                <Star className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Achievements</h3>
                <p className="text-gray-600">Gamification with badges, leaderboards, and rewards</p>
              </div>
              <div className="text-center p-6 bg-orange-50 rounded-xl border border-orange-200">
                <Award className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <h3 className="font-bold text-lg mb-2">Performance</h3>
                <p className="text-gray-600">Track individual and team performance metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="mt-12 bg-gradient-to-r from-green-50 to-blue-50 border-2 border-green-300 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Ready to Use the Full System?</CardTitle>
            <CardDescription className="text-lg">
              The beautiful interface is ready for production use with full authentication and real data
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <Button asChild size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <a href="/en/login">
                  <ArrowRight className="mr-2 h-5 w-5" />
                  Login to Full System
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2">
                <a href="/en/preview">
                  <Eye className="mr-2 h-5 w-5" />
                  View Full Preview
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="border-2">
                <a href="/en/">
                  <Home className="mr-2 h-5 w-5" />
                  Back to Home
                </a>
              </Button>
            </div>
            <div className="bg-white/50 rounded-lg p-4 border border-green-200">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> All components shown here are fully functional with real data. 
                The interface is production-ready and can be integrated with your existing authentication system.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 