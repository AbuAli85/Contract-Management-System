'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { NotificationsCenter } from '@/components/notifications/notifications-center'
import { DashboardNotifications } from '@/components/dashboard/dashboard-notifications-enhanced'
import { Bell, Sparkles, ArrowRight } from 'lucide-react'

export default function NotificationDemo() {
  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-2">
          <Sparkles className="h-8 w-8 text-purple-600" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Enhanced Notifications System
          </h1>
          <Sparkles className="h-8 w-8 text-purple-600" />
        </div>
        <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
          A comprehensive notification center with real-time updates, smart filtering, priority management, and full CRUD operations
        </p>
        
        <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
          <Badge variant="secondary">🔔 Real-time Updates</Badge>
          <Badge variant="secondary">📊 Priority Management</Badge>
          <Badge variant="secondary">🎯 Smart Filtering</Badge>
          <Badge variant="secondary">✅ Mark as Read/Unread</Badge>
          <Badge variant="secondary">🗑️ Bulk Actions</Badge>
          <Badge variant="secondary">⚙️ Customizable Settings</Badge>
        </div>
      </div>

      {/* Features Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700">
              <Bell className="h-5 w-5" />
              Smart Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-blue-600">
            <div>• Contract expiration alerts</div>
            <div>• Document renewal reminders</div>
            <div>• System status updates</div>
            <div>• Promoter activity tracking</div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 bg-purple-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-purple-700">
              <ArrowRight className="h-5 w-5" />
              Advanced Features
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-purple-600">
            <div>• Category-based filtering</div>
            <div>• Priority-based sorting</div>
            <div>• Bulk read/unread actions</div>
            <div>• Auto-refresh capabilities</div>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Sparkles className="h-5 w-5" />
              User Experience
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-green-600">
            <div>• Intuitive interface design</div>
            <div>• One-click actions</div>
            <div>• Real-time badge updates</div>
            <div>• Responsive mobile layout</div>
          </CardContent>
        </Card>
      </div>

      {/* Live Demos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Dashboard Widget */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Dashboard Widget</h2>
          <p className="text-muted-foreground">
            Compact notifications widget for the main dashboard with quick actions
          </p>
          <DashboardNotifications maxItems={5} compact={false} />
        </div>

        {/* Full Notifications Center */}
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">Full Notifications Center</h2>
          <p className="text-muted-foreground">
            Complete notification management with filtering, bulk actions, and settings
          </p>
          <NotificationsCenter 
            maxHeight="500px" 
            showFilters={true}
            compact={false}
          />
        </div>
      </div>

      {/* Technical Features */}
      <Card>
        <CardHeader>
          <CardTitle>Technical Implementation Features</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h3 className="font-semibold text-blue-700">Backend API</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• RESTful notification endpoints</li>
                <li>• Query parameter filtering</li>
                <li>• Real-time data aggregation</li>
                <li>• Automatic priority calculation</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-purple-700">Frontend Features</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• React hooks for state management</li>
                <li>• TypeScript type safety</li>
                <li>• Optimistic UI updates</li>
                <li>• Auto-refresh polling</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h3 className="font-semibold text-green-700">User Interface</h3>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Shadcn/ui component library</li>
                <li>• Responsive design</li>
                <li>• Accessibility features</li>
                <li>• Smooth animations</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Links */}
      <div className="flex justify-center gap-4">
        <Button asChild>
          <a href="/notifications">
            <Bell className="h-4 w-4 mr-2" />
            View Full Notifications Page
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href="/dashboard">
            Go to Dashboard
          </a>
        </Button>
      </div>
    </div>
  )
}
