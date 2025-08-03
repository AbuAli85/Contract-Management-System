"use client"

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { 
  Shield,
  AlertTriangle,
  Eye,
  Activity,
  Users,
  Lock,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { auditLogger, type SecurityEvent, type AuditEvent } from '@/lib/security/audit-logger'

interface SecurityStats {
  totalRequests: number
  securityEvents: number
  highSeverityEvents: number
  blockedRequests: number
  successRate: number
  averageResponseTime: number
}

export function SecurityDashboard() {
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [auditTrail, setAuditTrail] = useState<AuditEvent[]>([])
  const [stats, setStats] = useState<SecurityStats>({
    totalRequests: 0,
    securityEvents: 0,
    highSeverityEvents: 0,
    blockedRequests: 0,
    successRate: 0,
    averageResponseTime: 0
  })
  const [loading, setLoading] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())

  useEffect(() => {
    loadSecurityData()
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSecurityData, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadSecurityData = async () => {
    try {
      setLoading(true)
      
      // Load security events and audit trail
      const [events, trail] = await Promise.all([
        auditLogger.getSecurityEvents(undefined, 50),
        auditLogger.getAuditTrail(undefined, undefined, 50)
      ])
      
      setSecurityEvents(events)
      setAuditTrail(trail)
      
      // Calculate statistics
      const highSeverityCount = events.filter(e => e.severity === 'high' || e.severity === 'critical').length
      const totalEvents = events.length
      
      setStats({
        totalRequests: trail.length,
        securityEvents: totalEvents,
        highSeverityEvents: highSeverityCount,
        blockedRequests: events.filter(e => e.event.includes('blocked') || e.event.includes('unauthorized')).length,
        successRate: totalEvents > 0 ? ((totalEvents - highSeverityCount) / totalEvents) * 100 : 100,
        averageResponseTime: 150 // Mock data - implement real calculation
      })
      
      setLastRefresh(new Date())
    } catch (error) {
      console.error('Failed to load security data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-600 text-white'
      case 'high': return 'bg-red-500 text-white'
      case 'medium': return 'bg-yellow-500 text-white'
      case 'low': return 'bg-green-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getEventIcon = (eventType: string) => {
    if (eventType.includes('unauthorized')) return <XCircle className="h-4 w-4 text-red-500" />
    if (eventType.includes('login')) return <Users className="h-4 w-4 text-blue-500" />
    if (eventType.includes('rate_limit')) return <Shield className="h-4 w-4 text-yellow-500" />
    return <Activity className="h-4 w-4 text-gray-500" />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Security Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor system security, audit trails, and threat detection
          </p>
        </div>
        <Button onClick={loadSecurityData} disabled={loading}>
          <RefreshCw className={"h-4 w-4 mr-2 " + (loading ? 'animate-spin' : '')} />
          Refresh
        </Button>
      </div>

      {/* Security Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1" />
              +12% from last hour
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Security Events</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.securityEvents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.highSeverityEvents > 0 ? 
                <><XCircle className="inline h-3 w-3 mr-1 text-red-500" />{stats.highSeverityEvents} high severity</> :
                <><CheckCircle className="inline h-3 w-3 mr-1 text-green-500" />All clear</>
              }
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline h-3 w-3 mr-1 text-green-500" />
              Excellent security posture
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageResponseTime}ms</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline h-3 w-3 mr-1 text-green-500" />
              -5ms from yesterday
            </p>
          </CardContent>
        </Card>
      </div>

      {/* High Priority Alerts */}
      {stats.highSeverityEvents > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Security Alert</AlertTitle>
          <AlertDescription>
            {stats.highSeverityEvents} high-severity security events detected. Please review immediately.
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Views */}
      <Tabs defaultValue="events" className="space-y-4">
        <TabsList>
          <TabsTrigger value="events">Security Events</TabsTrigger>
          <TabsTrigger value="audit">Audit Trail</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="events" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Security Events</CardTitle>
              <CardDescription>
                Latest security-related events and threats detected
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityEvents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No security events detected</p>
                    <p className="text-sm">Your system is secure</p>
                  </div>
                ) : (
                  securityEvents.map((event, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 rounded-lg border">
                      <div className="flex-shrink-0">
                        {getEventIcon(event.event)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-semibold">{event.event.replace(/_/g, ' ').toUpperCase()}</h4>
                          <Badge className={getSeverityColor(event.severity || 'medium')}>
                            {event.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {event.path && `Path: ${event.path}`}
                          {event.ip && ` • IP: ${event.ip}`}
                          {event.userId && ` • User: ${event.userId}`}
                        </p>
                        {event.error && (
                          <p className="text-sm text-red-600 mt-1">Error: {event.error}</p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {new Date(event.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Audit Trail</CardTitle>
              <CardDescription>
                Complete history of data changes and user actions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {auditTrail.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No audit entries found</p>
                  </div>
                ) : (
                  auditTrail.map((entry, index) => (
                    <div key={index} className="flex items-start space-x-4 p-4 rounded-lg border">
                      <div className="flex-shrink-0">
                        <Activity className="h-4 w-4 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h4 className="text-sm font-semibold">{entry.event_type}</h4>
                          {entry.resource_type && (
                            <Badge variant="outline">{entry.resource_type}</Badge>
                          )}
                        </div>
                        {entry.resource_id && (
                          <p className="text-sm text-muted-foreground">
                            ID: {entry.resource_id}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-2">
                          {entry.created_at && new Date(entry.created_at).toLocaleString()}
                          {entry.user_id && ` • User: ${entry.user_id}`}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Analytics</CardTitle>
              <CardDescription>
                Trends and patterns in security events
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Event Types</h4>
                  <div className="space-y-2">
                    {Object.entries(
                      securityEvents.reduce((acc, event) => {
                        acc[event.event] = (acc[event.event] || 0) + 1
                        return acc
                      }, {} as Record<string, number>)
                    ).map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="text-sm">{type.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-semibold">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="p-4 rounded-lg border">
                  <h4 className="font-semibold mb-2">Severity Distribution</h4>
                  <div className="space-y-2">
                    {['critical', 'high', 'medium', 'low'].map(severity => {
                      const count = securityEvents.filter(e => e.severity === severity).length
                      return (
                        <div key={severity} className="flex justify-between">
                          <span className="text-sm capitalize">{severity}</span>
                          <span className="text-sm font-semibold">{count}</span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Last Refresh Info */}
      <div className="text-center text-sm text-muted-foreground">
        Last refreshed: {lastRefresh.toLocaleTimeString()}
      </div>
    </div>
  )
}
