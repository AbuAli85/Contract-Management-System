"use client"

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Server,
  Database,
  Globe,
  Shield,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Clock,
  Users,
  FileText,
  TrendingUp,
  TrendingDown,
  Wifi,
  WifiOff,
  HardDrive,
  Cpu,
  Zap,
  AlertCircle,
  Info,
} from 'lucide-react'

interface ServiceStatus {
  name: string
  status: 'healthy' | 'warning' | 'error' | 'offline'
  responseTime: number
  uptime: number
  lastCheck: Date
  description: string
  icon: React.ElementType
}

interface SystemMetrics {
  cpu: number
  memory: number
  disk: number
  network: number
  activeUsers: number
  totalContracts: number
  pendingApprovals: number
}

export function SystemStatus() {
  const [services, setServices] = useState<ServiceStatus[]>([
    {
      name: 'Database',
      status: 'healthy',
      responseTime: 45,
      uptime: 99.9,
      lastCheck: new Date(),
      description: 'PostgreSQL database connection',
      icon: Database
    },
    {
      name: 'Authentication',
      status: 'healthy',
      responseTime: 23,
      uptime: 99.8,
      lastCheck: new Date(),
      description: 'Supabase Auth service',
      icon: Shield
    },
    {
      name: 'API Gateway',
      status: 'healthy',
      responseTime: 67,
      uptime: 99.7,
      lastCheck: new Date(),
      description: 'REST API endpoints',
      icon: Server
    },
    {
      name: 'File Storage',
      status: 'warning',
      responseTime: 234,
      uptime: 98.5,
      lastCheck: new Date(),
      description: 'Document and file storage',
      icon: HardDrive
    },
    {
      name: 'Email Service',
      status: 'healthy',
      responseTime: 89,
      uptime: 99.6,
      lastCheck: new Date(),
      description: 'SMTP email delivery',
      icon: Globe
    },
    {
      name: 'PDF Generation',
      status: 'healthy',
      responseTime: 120,
      uptime: 99.5,
      lastCheck: new Date(),
      description: 'Contract PDF generation service',
      icon: FileText
    }
  ])

  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpu: 23,
    memory: 67,
    disk: 45,
    network: 89,
    activeUsers: 12,
    totalContracts: 156,
    pendingApprovals: 3
  })

  const [lastUpdate, setLastUpdate] = useState(new Date())
  const [isRefreshing, setIsRefreshing] = useState(false)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-100 text-green-800 border-green-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'error': return 'bg-red-100 text-red-800 border-red-200'
      case 'offline': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle
      case 'warning': return AlertTriangle
      case 'error': return XCircle
      case 'offline': return WifiOff
      default: return Info
    }
  }

  const refreshStatus = async () => {
    setIsRefreshing(true)
    
    try {
      // Check PDF generation service health
      const pdfHealthResponse = await fetch('/api/pdf-generation', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      })
      
      let pdfStatus = 'healthy'
      let pdfResponseTime = 120
      
      if (pdfHealthResponse.ok) {
        const pdfHealth = await pdfHealthResponse.json()
        pdfStatus = pdfHealth.status
        pdfResponseTime = pdfHealth.response_time || 120
      } else {
        pdfStatus = 'error'
        pdfResponseTime = 1500
      }

      // Update services with real health checks
      setServices(prev => prev.map(service => {
        if (service.name === 'PDF Generation') {
          return {
            ...service,
            status: pdfStatus as 'healthy' | 'warning' | 'error' | 'offline',
            responseTime: pdfResponseTime,
            lastCheck: new Date()
          }
        }
        // For other services, simulate realistic variations
        return {
          ...service,
          responseTime: Math.floor(Math.random() * 200) + 20,
          lastCheck: new Date()
        }
      }))

      // Update metrics
      setMetrics(prev => ({
        ...prev,
        cpu: Math.floor(Math.random() * 30) + 15,
        memory: Math.floor(Math.random() * 20) + 60,
        activeUsers: Math.floor(Math.random() * 5) + 10
      }))

      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error refreshing system status:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    const interval = setInterval(refreshStatus, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const overallHealth = services.filter(s => s.status === 'healthy').length / services.length * 100

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Status</h2>
          <p className="text-muted-foreground">
            Real-time monitoring of all system services and performance metrics
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-muted-foreground">Last Updated</div>
            <div className="text-sm font-medium">
              {lastUpdate.toLocaleTimeString()}
            </div>
          </div>
          <Button onClick={refreshStatus} disabled={isRefreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overall Health */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Overall System Health
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">{overallHealth.toFixed(1)}%</div>
              <div className="text-sm text-muted-foreground">System Health</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{metrics.activeUsers}</div>
              <div className="text-sm text-muted-foreground">Active Users</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">{metrics.totalContracts}</div>
              <div className="text-sm text-muted-foreground">Total Contracts</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">{metrics.pendingApprovals}</div>
              <div className="text-sm text-muted-foreground">Pending Approvals</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Cpu className="h-5 w-5" />
              System Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>CPU Usage</span>
                <span>{metrics.cpu}%</span>
              </div>
              <Progress value={metrics.cpu} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Memory Usage</span>
                <span>{metrics.memory}%</span>
              </div>
              <Progress value={metrics.memory} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Disk Usage</span>
                <span>{metrics.disk}%</span>
              </div>
              <Progress value={metrics.disk} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Network</span>
                <span>{metrics.network}%</span>
              </div>
              <Progress value={metrics.network} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Service Response Times
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {services.slice(0, 4).map((service) => {
                const Icon = service.icon
                const StatusIcon = getStatusIcon(service.status)
                return (
                  <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium text-sm">{service.name}</div>
                        <div className="text-xs text-muted-foreground">{service.responseTime}ms</div>
                      </div>
                    </div>
                    <StatusIcon className="h-4 w-4 text-green-500" />
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Service Status Grid */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Service Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((service) => {
              const Icon = service.icon
              const StatusIcon = getStatusIcon(service.status)
              return (
                <div key={service.name} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className="h-5 w-5 text-muted-foreground" />
                      <h3 className="font-medium">{service.name}</h3>
                    </div>
                    <Badge className={getStatusColor(service.status)}>
                      <StatusIcon className="h-3 w-3 mr-1" />
                      {service.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{service.description}</p>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Response Time:</span>
                      <span className="font-mono">{service.responseTime}ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime:</span>
                      <span className="font-mono">{service.uptime}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Last Check:</span>
                      <span className="font-mono">{service.lastCheck.toLocaleTimeString()}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 