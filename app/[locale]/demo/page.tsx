"use client"

import AdminDashboard from "@/components/dashboard/AdminDashboard"
import PromoterDashboard from "@/components/dashboard/PromoterDashboard"
import PromoterOnboardingForm from "@/components/onboarding/PromoterOnboardingForm"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Users as UsersIcon, FileText, BarChart3, Plus, ArrowRight, Eye, Star } from "lucide-react"

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="space-y-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            🚀 Contract Management System - UI Demo
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-gray-600">
            Experience the beautiful new UI/UX transformation. This demo showcases the professional,
            modern interface that replaces the old basic CRM system.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Badge variant="default" className="text-sm">
              <Star className="mr-1 h-3 w-3" />
              New Design
            </Badge>
            <Badge variant="secondary" className="text-sm">
              Professional UI
            </Badge>
            <Badge variant="outline" className="text-sm">
              Mobile Responsive
            </Badge>
          </div>
        </div>

        {/* Demo Tabs */}
        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="admin" className="flex items-center gap-2">
              <UsersIcon className="h-4 w-4" />
              Admin Dashboard
            </TabsTrigger>
            <TabsTrigger value="promoter" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Promoter Dashboard
            </TabsTrigger>
            <TabsTrigger value="onboarding" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Onboarding Form
            </TabsTrigger>
          </TabsList>

          <TabsContent value="admin" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Admin Dashboard Preview
                </CardTitle>
                <CardDescription>
                  Beautiful admin dashboard with KPI cards, attendance heatmap, and real-time
                  metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border">
                  <AdminDashboard />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="promoter" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Promoter Dashboard Preview
                </CardTitle>
                <CardDescription>
                  Personal dashboard with task management, achievements, and performance tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border">
                  <PromoterDashboard />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="onboarding" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Onboarding Form Preview
                </CardTitle>
                <CardDescription>
                  Multi-step onboarding wizard with file upload, requirements checklist, and
                  progress tracking
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-hidden rounded-lg border">
                  <PromoterOnboardingForm />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Features Comparison */}
        <Card>
          <CardHeader>
            <CardTitle>🎨 UI/UX Improvements</CardTitle>
            <CardDescription>
              See how we transformed the boring old interface into a modern, professional system
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-red-600">❌ Old Interface Problems</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    Basic dropdown and simple tabs
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    Empty state with "No communications logged yet"
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    No data visualization or analytics
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    Poor user experience and engagement
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-500">•</span>
                    Not mobile-responsive
                  </li>
                </ul>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-green-600">✅ New Interface Solutions</h3>
                <ul className="space-y-2 text-sm text-gray-600">
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    Beautiful KPI cards with real-time metrics
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    Interactive attendance heatmap visualization
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    Professional data visualization and charts
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    Gamification with achievements and leaderboards
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-500">•</span>
                    Mobile-first responsive design
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Ready to Experience the Full System?</CardTitle>
            <CardDescription>
              Log in to access the complete Contract Management System with all features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div className="flex items-center justify-center gap-4">
              <Button asChild size="lg">
                <a href="/en/login">
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Go to Login
                </a>
              </Button>
              <Button asChild variant="outline" size="lg">
                <a href="/en/dashboard">
                  <Eye className="mr-2 h-4 w-4" />
                  View Dashboard
                </a>
              </Button>
            </div>
            <p className="text-sm text-gray-600">Demo credentials available for testing</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
