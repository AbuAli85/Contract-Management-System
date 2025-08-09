"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { 
  Activity, Play, Pause, Settings, Webhook, 
  Database, TestTube, CheckCircle, XCircle,
  Clock, Users, Bell, Code, Zap
} from 'lucide-react'
import { RealTimeBookingEvents, BookingEventMonitor, UserEventMonitor } from '@/components/booking/real-time-booking-events'
import { useEnhancedRBAC, RoleRedirect } from '@/components/auth/enhanced-rbac-provider'
import { useAuth } from '@/app/providers'
import { bookingSubscriptionManager } from '@/lib/realtime/booking-subscriptions'
import { testMakeWebhook, validateMakeWebhookConfig, getWebhookStats } from '@/lib/webhooks/make-integration'
import { toast } from 'sonner'

export default function RealTimeBookingsDemoPage() {
  const { user } = useAuth()
  const { userRole, hasPermission } = useEnhancedRBAC()
  const [selectedBookingId, setSelectedBookingId] = useState('')
  const [webhookStats, setWebhookStats] = useState<any>(null)
  const [webhookConfig, setWebhookConfig] = useState<any>(null)
  const [isTestingWebhook, setIsTestingWebhook] = useState(false)
  const [subscriptionStats, setSubscriptionStats] = useState({
    activeCount: 0,
    activeSubscriptions: [] as string[]
  })

  // Update subscription stats periodically
  useEffect(() => {
    const updateStats = () => {
      setSubscriptionStats({
        activeCount: bookingSubscriptionManager.getActiveSubscriptionCount(),
        activeSubscriptions: bookingSubscriptionManager.getActiveSubscriptions()
      })
    }

    updateStats()
    const interval = setInterval(updateStats, 2000)
    return () => clearInterval(interval)
  }, [])

  // Load webhook configuration and stats
  useEffect(() => {
    const loadWebhookInfo = async () => {
      try {
        const config = validateMakeWebhookConfig()
        const stats = getWebhookStats()
        setWebhookConfig(config)
        setWebhookStats(stats)
      } catch (error) {
        console.error('Error loading webhook info:', error)
      }
    }

    loadWebhookInfo()
    const interval = setInterval(loadWebhookInfo, 10000) // Update every 10 seconds
    return () => clearInterval(interval)
  }, [])

  const handleTestWebhook = async () => {
    setIsTestingWebhook(true)
    try {
      const result = await testMakeWebhook()
      
      if (result.success) {
        toast.success(`Webhook test successful! Response time: ${result.responseTime}ms`)
      } else {
        toast.error(`Webhook test failed: ${result.error}`)
      }
      
      // Refresh stats
      setWebhookStats(getWebhookStats())
    } catch (error: any) {
      toast.error(`Test error: ${error.message}`)
    } finally {
      setIsTestingWebhook(false)
    }
  }

  const handleCreateTestEvent = async () => {
    if (!selectedBookingId) {
      toast.error('Please enter a booking ID')
      return
    }

    try {
      const response = await fetch('/api/webhooks/booking-events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          record: {
            id: `demo_${Date.now()}`,
            booking_id: selectedBookingId,
            event_type: 'demo_event',
            description: 'Demo event created from real-time demo page',
            created_at: new Date().toISOString()
          }
        })
      })

      if (response.ok) {
        toast.success('Demo event created and sent to webhook!')
      } else {
        const error = await response.json()
        toast.error(`Failed to create event: ${error.error}`)
      }
    } catch (error: any) {
      toast.error(`Error: ${error.message}`)
    }
  }

  return (
    <RoleRedirect allowedRoles={['admin', 'super_admin', 'manager', 'provider']}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Real-time Booking Events Demo</h1>
            <p className="text-gray-600">
              Comprehensive demonstration of real-time subscriptions and Make.com webhook integration
            </p>
          </div>
          
          <div className="flex items-center gap-4">
            <Badge variant={subscriptionStats.activeCount > 0 ? "default" : "secondary"}>
              <Activity className="h-3 w-3 mr-1" />
              {subscriptionStats.activeCount} active subscriptions
            </Badge>
            <Badge variant={user ? "default" : "secondary"}>
              <Users className="h-3 w-3 mr-1" />
              {user ? 'Authenticated' : 'Not authenticated'}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="live-events" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="live-events">Live Events</TabsTrigger>
            <TabsTrigger value="webhook-test">Webhook Test</TabsTrigger>
            <TabsTrigger value="subscription-manager">Subscriptions</TabsTrigger>
            <TabsTrigger value="integration-guide">Integration</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
          </TabsList>

          {/* Live Events Tab */}
          <TabsContent value="live-events" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Specific Booking Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Specific Booking Events
                  </CardTitle>
                  <CardDescription>
                    Monitor real-time events for a specific booking
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="booking-id">Booking ID</Label>
                    <Input
                      id="booking-id"
                      placeholder="Enter booking ID to monitor"
                      value={selectedBookingId}
                      onChange={(e) => setSelectedBookingId(e.target.value)}
                    />
                  </div>
                  
                  {selectedBookingId && (
                    <BookingEventMonitor 
                      bookingId={selectedBookingId}
                      className="mt-4"
                    />
                  )}
                  
                  {!selectedBookingId && (
                    <Alert>
                      <Activity className="h-4 w-4" />
                      <AlertDescription>
                        Enter a booking ID above to start monitoring real-time events for that specific booking.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              {/* User Events */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Your Booking Events
                  </CardTitle>
                  <CardDescription>
                    Real-time events for all your bookings
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {user ? (
                    <UserEventMonitor />
                  ) : (
                    <Alert>
                      <Users className="h-4 w-4" />
                      <AlertDescription>
                        Please log in to see your booking events.
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Webhook Test Tab */}
          <TabsContent value="webhook-test" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Webhook Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Webhook Configuration
                  </CardTitle>
                  <CardDescription>
                    Make.com webhook setup and validation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {webhookConfig && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span>Configuration Status:</span>
                        <Badge variant={webhookConfig.isValid ? "default" : "destructive"}>
                          {webhookConfig.isValid ? 'Valid' : 'Invalid'}
                        </Badge>
                      </div>
                      
                      {webhookConfig.errors.length > 0 && (
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              {webhookConfig.errors.map((error: string, index: number) => (
                                <div key={index}>• {error}</div>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {webhookConfig.warnings.length > 0 && (
                        <Alert>
                          <Clock className="h-4 w-4" />
                          <AlertDescription>
                            <div className="space-y-1">
                              {webhookConfig.warnings.map((warning: string, index: number) => (
                                <div key={index}>• {warning}</div>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  )}
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Button 
                      onClick={handleTestWebhook}
                      disabled={isTestingWebhook}
                      className="w-full"
                    >
                      {isTestingWebhook ? (
                        <>
                          <Activity className="h-4 w-4 mr-2 animate-spin" />
                          Testing Webhook...
                        </>
                      ) : (
                        <>
                          <TestTube className="h-4 w-4 mr-2" />
                          Test Make.com Webhook
                        </>
                      )}
                    </Button>
                    
                    <Button 
                      onClick={handleCreateTestEvent}
                      variant="outline"
                      className="w-full"
                      disabled={!selectedBookingId}
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Create Demo Event
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Webhook Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Webhook className="h-5 w-5" />
                    Webhook Statistics
                  </CardTitle>
                  <CardDescription>
                    Real-time webhook performance metrics
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {webhookStats ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <div className="text-2xl font-bold text-blue-600">
                            {webhookStats.totalSent}
                          </div>
                          <div className="text-sm text-blue-600">Total Sent</div>
                        </div>
                        
                        <div className="text-center p-3 bg-green-50 rounded">
                          <div className="text-2xl font-bold text-green-600">
                            {webhookStats.successfulSent}
                          </div>
                          <div className="text-sm text-green-600">Successful</div>
                        </div>
                        
                        <div className="text-center p-3 bg-red-50 rounded">
                          <div className="text-2xl font-bold text-red-600">
                            {webhookStats.failedSent}
                          </div>
                          <div className="text-sm text-red-600">Failed</div>
                        </div>
                        
                        <div className="text-center p-3 bg-purple-50 rounded">
                          <div className="text-2xl font-bold text-purple-600">
                            {Math.round(webhookStats.averageResponseTime)}ms
                          </div>
                          <div className="text-sm text-purple-600">Avg Response</div>
                        </div>
                      </div>
                      
                      {webhookStats.lastSentAt && (
                        <div className="text-sm text-gray-500">
                          Last sent: {new Date(webhookStats.lastSentAt).toLocaleString()}
                        </div>
                      )}
                      
                      {webhookStats.lastError && (
                        <Alert variant="destructive">
                          <XCircle className="h-4 w-4" />
                          <AlertDescription>
                            Last error: {webhookStats.lastError}
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-8 w-8 mx-auto mb-2 text-gray-400 animate-spin" />
                      <p className="text-gray-500">Loading webhook statistics...</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Subscription Manager Tab */}
          <TabsContent value="subscription-manager" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Active Subscriptions
                </CardTitle>
                <CardDescription>
                  Manage real-time subscription connections
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center p-4 bg-green-50 rounded">
                      <div className="text-3xl font-bold text-green-600">
                        {subscriptionStats.activeCount}
                      </div>
                      <div className="text-sm text-green-600">Active Connections</div>
                    </div>
                    
                    <div className="text-center p-4 bg-blue-50 rounded">
                      <div className="text-3xl font-bold text-blue-600">
                        {subscriptionStats.activeSubscriptions.filter(s => s.startsWith('booking_events:')).length}
                      </div>
                      <div className="text-sm text-blue-600">Booking Subscriptions</div>
                    </div>
                    
                    <div className="text-center p-4 bg-purple-50 rounded">
                      <div className="text-3xl font-bold text-purple-600">
                        {subscriptionStats.activeSubscriptions.filter(s => s.startsWith('user_bookings:')).length}
                      </div>
                      <div className="text-sm text-purple-600">User Subscriptions</div>
                    </div>
                  </div>
                  
                  {subscriptionStats.activeSubscriptions.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-2">Active Subscription IDs:</h4>
                      <div className="space-y-1">
                        {subscriptionStats.activeSubscriptions.map((id) => (
                          <div key={id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <code className="text-xs">{id}</code>
                            <Badge variant="outline">Active</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        bookingSubscriptionManager.unsubscribeAll()
                        toast.success('All subscriptions cleared')
                      }}
                    >
                      Clear All Subscriptions
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integration Guide */}
          <TabsContent value="integration-guide" className="space-y-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Integration Examples
                  </CardTitle>
                  <CardDescription>
                    Code examples for implementing real-time booking events
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>
                    <h4 className="font-medium mb-2">Basic Subscription:</h4>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import { subscribeToBookingEvents } from '@/lib/realtime/booking-subscriptions'

const unsubscribe = subscribeToBookingEvents('booking-id', (event) => {
  console.log('Booking event received:', event)
  // Handle the event
})

// Cleanup when component unmounts
return () => unsubscribe()`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">React Hook Usage:</h4>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`import { useBookingEvents } from '@/lib/realtime/booking-subscriptions'

function BookingComponent({ bookingId }) {
  const { events, isConnected, error } = useBookingEvents(bookingId)
  
  return (
    <div>
      <p>Status: {isConnected ? 'Connected' : 'Disconnected'}</p>
      {events.map(event => (
        <div key={event.id}>{event.description}</div>
      ))}
    </div>
  )
}`}
                    </pre>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Make.com Environment Variables:</h4>
                    <pre className="bg-gray-100 p-4 rounded text-sm overflow-x-auto">
{`# Required for Make.com webhook integration
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/your-webhook-url
MAKE_WEBHOOK_SECRET=your-webhook-secret

# Optional for Supabase webhook security  
SUPABASE_WEBHOOK_SECRET=your-supabase-webhook-secret
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app`}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>System Health</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Supabase Connection:</span>
                      <Badge variant="default">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Connected
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Real-time Subscriptions:</span>
                      <Badge variant={subscriptionStats.activeCount > 0 ? "default" : "secondary"}>
                        <Activity className="h-3 w-3 mr-1" />
                        {subscriptionStats.activeCount} Active
                      </Badge>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span>Webhook Integration:</span>
                      <Badge variant={webhookConfig?.isValid ? "default" : "secondary"}>
                        <Webhook className="h-3 w-3 mr-1" />
                        {webhookConfig?.isValid ? 'Configured' : 'Not Configured'}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button variant="outline" className="w-full justify-start">
                      <Bell className="h-4 w-4 mr-2" />
                      View System Logs
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start">
                      <Settings className="h-4 w-4 mr-2" />
                      Configure Webhooks
                    </Button>
                    
                    <Button variant="outline" className="w-full justify-start">
                      <Activity className="h-4 w-4 mr-2" />
                      Monitor Performance
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </RoleRedirect>
  )
}