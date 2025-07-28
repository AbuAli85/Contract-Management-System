'use client'

import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import SimpleAdminDashboard from '@/components/dashboard/SimpleAdminDashboard'
import SimplePromoterDashboard from '@/components/dashboard/SimplePromoterDashboard'

// Dynamically import the form to prevent SSR issues
const PromoterOnboardingForm = dynamic(
  () => import('@/components/onboarding/PromoterOnboardingForm'),
  { 
    ssr: false,
    loading: () => (
      <div className="p-8 text-center">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
        </div>
      </div>
    )
  }
)
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
  CheckCircle
} from 'lucide-react'

export default function PreviewPage() {
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  // Don't render the form during SSR to avoid Supabase errors
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Star className="h-6 w-6" />
              <div>
                <h1 className="text-xl font-bold">🚀 Beautiful New UI Preview</h1>
                <p className="text-blue-100 text-sm">No authentication required - Pure UI showcase</p>
              </div>
            </div>
            <Badge variant="secondary" className="bg-white/20 text-white">
              Demo Mode
            </Badge>
          </div>
        </div>

        <div className="p-6">
          <div className="max-w-7xl mx-auto text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-1/3 mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mx-auto"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Star className="h-6 w-6" />
            <div>
              <h1 className="text-xl font-bold">🚀 Beautiful New UI Preview</h1>
              <p className="text-blue-100 text-sm">No authentication required - Pure UI showcase</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-white/20 text-white">
            Demo Mode
          </Badge>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h2 className="text-3xl font-bold text-gray-900">
              Experience the Transformation
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              From boring basic interface to professional, engaging, and beautiful UI/UX. 
              See how we transformed the Contract Management System.
            </p>
            <div className="flex items-center justify-center gap-4">
              <Badge variant="default" className="text-sm">
                <CheckCircle className="h-3 w-3 mr-1" />
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

          {/* UI Components Tabs */}
          <Tabs defaultValue="admin" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Users className="h-4 w-4" />
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
                    Admin Dashboard - Beautiful KPI Cards & Analytics
                  </CardTitle>
                  <CardDescription>
                    Professional admin interface with real-time metrics, attendance heatmap, and performance tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden bg-white">
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
                    Promoter Dashboard - Personal Performance & Tasks
                  </CardTitle>
                  <CardDescription>
                    Personal dashboard with task management, achievements, leaderboard rank, and performance insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <SimplePromoterDashboard />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="onboarding" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Onboarding Form - Multi-Step Wizard
                  </CardTitle>
                  <CardDescription>
                    Professional onboarding experience with file upload, requirements checklist, and progress tracking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden bg-white">
                    <PromoterOnboardingForm />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Before/After Comparison */}
          <Card>
            <CardHeader>
              <CardTitle>🎨 UI/UX Transformation</CardTitle>
              <CardDescription>
                See the dramatic improvement from the old basic interface to the new professional system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-red-600 flex items-center gap-2">
                    ❌ Old Interface Problems
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>Basic dropdown menus and simple tabs</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>Empty states with "No communications logged yet"</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>No data visualization or analytics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>Poor user experience and low engagement</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">•</span>
                      <span>Not mobile-responsive</span>
                    </li>
                  </ul>
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-green-600 flex items-center gap-2">
                    ✅ New Interface Solutions
                  </h3>
                  <ul className="space-y-3 text-sm text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Beautiful KPI cards with real-time metrics</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Interactive attendance heatmap visualization</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Professional data visualization and charts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Gamification with achievements and leaderboards</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-green-500 mt-1">•</span>
                      <span>Mobile-first responsive design</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action */}
          <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Ready to Use the Full System?</CardTitle>
              <CardDescription>
                The beautiful new interface is ready for production use
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex items-center justify-center gap-4">
                <Button asChild size="lg">
                  <a href="/en/login">
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Login to Full System
                  </a>
                </Button>
                <Button asChild variant="outline" size="lg">
                  <a href="/en/dashboard">
                    <Eye className="mr-2 h-4 w-4" />
                    Try Dashboard
                  </a>
                </Button>
              </div>
              <p className="text-sm text-gray-600">
                All the beautiful UI components you see here are fully functional
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
} 