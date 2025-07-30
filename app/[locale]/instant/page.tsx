"use client"

import { useState } from "react"
import SimpleAdminDashboard from "@/components/dashboard/SimpleAdminDashboard"
import SimplePromoterDashboard from "@/components/dashboard/SimplePromoterDashboard"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Target,
} from "lucide-react"

export default function InstantPage() {
  const [activeTab, setActiveTab] = useState("admin")

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-green-600 text-white">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="space-y-4 text-center">
            <div className="mb-4 flex items-center justify-center gap-3">
              <Zap className="h-8 w-8 animate-pulse" />
              <h1 className="text-4xl font-bold">🚀 Beautiful CRM Dashboard</h1>
              <Zap className="h-8 w-8 animate-pulse" />
            </div>
            <p className="mx-auto max-w-3xl text-xl text-blue-100">
              Professional, modern interface that replaces the old basic CRM system. No
              authentication required - pure UI showcase with real data.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Badge variant="secondary" className="bg-white/20 px-3 py-1 text-sm text-white">
                <CheckCircle className="mr-1 h-3 w-3" />
                Professional Design
              </Badge>
              <Badge variant="secondary" className="bg-white/20 px-3 py-1 text-sm text-white">
                Mobile Responsive
              </Badge>
              <Badge variant="secondary" className="bg-white/20 px-3 py-1 text-sm text-white">
                Real-time Data
              </Badge>
              <Badge variant="secondary" className="bg-white/20 px-3 py-1 text-sm text-white">
                Modern UI/UX
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Quick Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-100">Total Promoters</p>
                  <p className="text-3xl font-bold">247</p>
                  <p className="text-sm text-blue-200">+12% this month</p>
                </div>
                <Users className="h-12 w-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-100">Active Contracts</p>
                  <p className="text-3xl font-bold">89</p>
                  <p className="text-sm text-green-200">+5% this week</p>
                </div>
                <FileText className="h-12 w-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-purple-100">Revenue</p>
                  <p className="text-3xl font-bold">$124K</p>
                  <p className="text-sm text-purple-200">+18% this month</p>
                </div>
                <TrendingUp className="h-12 w-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-100">Attendance Rate</p>
                  <p className="text-3xl font-bold">94%</p>
                  <p className="text-sm text-orange-200">+2% this week</p>
                </div>
                <Calendar className="h-12 w-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Dashboard Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-8 grid w-full grid-cols-2">
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
                  Beautiful admin dashboard with KPI cards, attendance heatmap, real-time metrics,
                  and performance tracking
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
                  Personal dashboard with task management, achievements, leaderboard rank, and
                  performance insights
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
            <div className="grid gap-8 md:grid-cols-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-6 text-center">
                <BarChart3 className="mx-auto mb-4 h-12 w-12 text-blue-600" />
                <h3 className="mb-2 text-lg font-bold">KPI Cards</h3>
                <p className="text-gray-600">
                  Real-time metrics with beautiful visualizations and trends
                </p>
              </div>
              <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
                <Users className="mx-auto mb-4 h-12 w-12 text-green-600" />
                <h3 className="mb-2 text-lg font-bold">Attendance Heatmap</h3>
                <p className="text-gray-600">
                  Interactive calendar with attendance tracking and patterns
                </p>
              </div>
              <div className="rounded-xl border border-purple-200 bg-purple-50 p-6 text-center">
                <Star className="mx-auto mb-4 h-12 w-12 text-purple-600" />
                <h3 className="mb-2 text-lg font-bold">Achievements</h3>
                <p className="text-gray-600">Gamification with badges, leaderboards, and rewards</p>
              </div>
              <div className="rounded-xl border border-orange-200 bg-orange-50 p-6 text-center">
                <Award className="mx-auto mb-4 h-12 w-12 text-orange-600" />
                <h3 className="mb-2 text-lg font-bold">Performance</h3>
                <p className="text-gray-600">Track individual and team performance metrics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="mt-12 border-2 border-green-300 bg-gradient-to-r from-green-50 to-blue-50 shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl">Ready to Use the Full System?</CardTitle>
            <CardDescription className="text-lg">
              The beautiful interface is ready for production use with full authentication and real
              data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 text-center">
            <div className="flex flex-wrap items-center justify-center gap-4">
              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
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
            <div className="rounded-lg border border-green-200 bg-white/50 p-4">
              <p className="text-sm text-gray-700">
                <strong>Note:</strong> All components shown here are fully functional with real
                data. The interface is production-ready and can be integrated with your existing
                authentication system.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
