'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Clock, 
  RefreshCw, 
  Database, 
  Server, 
  Shield, 
  Wifi,
  Activity
} from 'lucide-react'
import { useToastHelpers } from '@/components/toast-notifications'

interface SystemStatus {
  database: 'online' | 'offline' | 'degraded'
  authentication: 'online' | 'offline' | 'degraded'
  api: 'online' | 'offline' | 'degraded'
  storage: 'online' | 'offline' | 'degraded'
  lastChecked: string
}

interface ServiceStatus {
  name: string
  status: 'online' | 'offline' | 'degraded'
  responseTime?: number
  lastError?: string
  icon: React.ComponentType<{ className?: string }>
}

export function SystemStatus() {
  const [status, setStatus] = useState<SystemStatus>({
    database: 'online',
    authentication: 'online',
    api: 'online',
    storage: 'online',
    lastChecked: new Date().toISOString()
  })
  const [isChecking, setIsChecking] = useState(false)
  const { success, error, warning } = useToastHelpers()

  const services: ServiceStatus[] = [
    {
      name: 'Database',
      status: status.database,
      responseTime: 45,
      icon: Database
    },
    {
      name: 'Authentication',
      status: status.authentication,
      responseTime: 23,
      icon: Shield
    },
    {
      name: 'API Services',
      status: status.api,
      responseTime: 67,
      icon: Server
    },
    {
      name: 'File Storage',
      status: status.storage,
      responseTime: 89,
      icon: Activity
    }
  ]

  const checkSystemStatus = async () => {
    setIsChecking(true)
    
    try {
      // Simulate API calls to check system status
      const checks = await Promise.allSettled([
        checkDatabase(),
        checkAuthentication(),
        checkAPI(),
        checkStorage()
      ])

      const newStatus: SystemStatus = {
        database: checks[0].status === 'fulfilled' ? 'online' : 'offline',
        authentication: checks[1].status === 'fulfilled' ? 'online' : 'offline',
        api: checks[2].status === 'fulfilled' ? 'online' : 'offline',
        storage: checks[3].status === 'fulfilled' ? 'online' : 'offline',
        lastChecked: new Date().toISOString()
      }

      setStatus(newStatus)

      // Show appropriate toast based on overall status
      const allOnline = Object.values(newStatus).every(s => s === 'online')
      const anyOffline = Object.values(newStatus).some(s => s === 'offline')

      if (allOnline) {
        success('System Status', 'All systems are operational')
      } else if (anyOffline) {
        error('System Status', 'Some services are experiencing issues')
      } else {
        warning('System Status', 'Some services are degraded')
      }

    } catch (err) {
      error('System Check Failed', 'Unable to verify system status')
    } finally {
      setIsChecking(false)
    }
  }

  // Simulated health checks
  const checkDatabase = async () => {
    await new Promise(resolve => setTimeout(resolve, 500))
    return { status: 'ok' }
  }

  const checkAuthentication = async () => {
    await new Promise(resolve => setTimeout(resolve, 300))
    return { status: 'ok' }
  }

  const checkAPI = async () => {
    await new Promise(resolve => setTimeout(resolve, 400))
    return { status: 'ok' }
  }

  const checkStorage = async () => {
    await new Promise(resolve => setTimeout(resolve, 600))
    return { status: 'ok' }
  }

  useEffect(() => {
    checkSystemStatus()
    
    // Check status every 5 minutes
    const interval = setInterval(checkSystemStatus, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'offline':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-100 text-green-800">Online</Badge>
      case 'offline':
        return <Badge variant="destructive">Offline</Badge>
      case 'degraded':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Degraded</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const overallStatus = Object.values(status).every(s => s === 'online') 
    ? 'All Systems Operational' 
    : 'System Issues Detected'

  const hasIssues = Object.values(status).some(s => s !== 'online')

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wifi className="h-5 w-5" />
              System Status
            </CardTitle>
            <CardDescription>
              {overallStatus} • Last checked: {new Date(status.lastChecked).toLocaleTimeString()}
            </CardDescription>
          </div>
          <Button 
            onClick={checkSystemStatus} 
            disabled={isChecking}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
            {isChecking ? 'Checking...' : 'Refresh'}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasIssues && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Some system services are experiencing issues. Please check the status below.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-3">
          {services.map((service) => (
            <div key={service.name} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <service.icon className="h-5 w-5 text-gray-600" />
                <div>
                  <p className="font-medium text-sm">{service.name}</p>
                  {service.responseTime && (
                    <p className="text-xs text-gray-500">
                      Response time: {service.responseTime}ms
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getStatusIcon(service.status)}
                {getStatusBadge(service.status)}
              </div>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Uptime</span>
            <span className="font-medium">99.9%</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Average Response</span>
            <span className="font-medium">56ms</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 