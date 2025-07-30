"use client"

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
} from "lucide-react"

export default function DirectDashboardPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4 text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">🚀 Direct Dashboard Access</h1>
              <p className="text-sm text-blue-100">
                Beautiful UI without authentication - Pure showcase
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-white/20 text-white">
              Demo Mode
            </Badge>
            <Button
              asChild
              variant="outline"
              size="sm"
              className="border-white/20 bg-white/10 text-white"
            >
              <a href="/en/">
                <Home className="h-4 w-4" />
                Home
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Welcome Section */}
          <div className="space-y-4 text-center">
            <h2 className="text-3xl font-bold text-gray-900">Beautiful Dashboard Interface</h2>
            <p className="mx-auto max-w-3xl text-lg text-gray-600">
              Experience the professional, modern dashboard that replaces the old basic CRM system.
              No authentication required - pure UI showcase.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="default" className="text-sm">
                <CheckCircle className="mr-1 h-3 w-3" />
                Professional Design
              </Badge>
              <Badge variant="secondary" className="text-sm">
                Mobile Responsive
              </Badge>
              <Badge variant="outline" className="text-sm">
                Modern UI/UX
              </Badge>
            </div>
          </div>

          {/* Dashboard Tabs */}
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Admin Dashboard
              </TabsTrigger>
              <TabsTrigger value="promoter" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Promoter Dashboard
              </TabsTrigger>
            </TabsList>

            <TabsContent value="admin" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Admin Dashboard - Professional Interface
                  </CardTitle>
                  <CardDescription>
                    Beautiful admin dashboard with KPI cards, attendance heatmap, real-time metrics,
                    and performance tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-lg border bg-white">
                    <SimpleAdminDashboard />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="promoter" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Promoter Dashboard - Personal Interface
                  </CardTitle>
                  <CardDescription>
                    Personal dashboard with task management, achievements, leaderboard rank, and
                    performance insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-hidden rounded-lg border bg-white">
                    <SimplePromoterDashboard />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Features Showcase */}
          <Card>
            <CardHeader>
              <CardTitle>🎨 Beautiful UI Features</CardTitle>
              <CardDescription>
                See what makes this interface professional and engaging
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-3">
                <div className="rounded-lg bg-blue-50 p-4 text-center">
                  <BarChart3 className="mx-auto mb-3 h-8 w-8 text-blue-600" />
                  <h3 className="mb-2 font-semibold">KPI Cards</h3>
                  <p className="text-sm text-gray-600">
                    Real-time metrics with beautiful visualizations
                  </p>
                </div>
                <div className="rounded-lg bg-green-50 p-4 text-center">
                  <Users className="mx-auto mb-3 h-8 w-8 text-green-600" />
                  <h3 className="mb-2 font-semibold">Attendance Heatmap</h3>
                  <p className="text-sm text-gray-600">
                    Interactive calendar with attendance tracking
                  </p>
                </div>
                <div className="rounded-lg bg-purple-50 p-4 text-center">
                  <Star className="mx-auto mb-3 h-8 w-8 text-purple-600" />
                  <h3 className="mb-2 font-semibold">Achievements</h3>
                  <p className="text-sm text-gray-600">Gamification with badges and leaderboards</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Ready to Use the Full System?</CardTitle>
              <CardDescription>
                The beautiful interface is ready for production use with full authentication
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-center">
              <div className="flex items-center justify-center gap-4">
                <Button asChild size="lg">
                  <a href="/en/login">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Login to Full System
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="/en/preview">
                    <Eye className="mr-2 h-4 w-4" />
                    View Full Preview
                  </a>
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                All components shown here are fully functional with real data
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
