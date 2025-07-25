'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { AuthenticatedLayout } from '@/components/authenticated-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToastHelpers } from '@/components/toast-notifications'
import { usePermissions } from '@/hooks/use-permissions'
import { 
  Activity, 
  Users, 
  Calendar, 
  Search, 
  Filter,
  Download,
  RefreshCw,
  Eye,
  Clock,
  User,
  Loader2
} from 'lucide-react'

interface UserActivity {
  id: string
  user_id: string
  user_email: string
  user_name: string
  action: string
  resource_type: string
  resource_id: string
  details: any
  ip_address: string
  user_agent: string
  created_at: string
}

export default function UserActivityPage() {
  const pathname = usePathname()
  const locale = pathname ? pathname.split('/')[1] || 'en' : 'en'
  const { canManageUsers } = usePermissions()
  const { success, error } = useToastHelpers()

  const [activities, setActivities] = useState<UserActivity[]>([])
  const [loading, setLoading] = useState(true)
  const [filteredActivities, setFilteredActivities] = useState<UserActivity[]>([])
  const [filters, setFilters] = useState({
    search: '',
    action: '',
    resourceType: '',
    dateRange: '7d'
  })

  // Check permissions
  if (!canManageUsers()) {
    return (
      <AuthenticatedLayout locale={locale}>
        <div className="container mx-auto p-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-center">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Access Denied</h3>
                <p className="text-gray-600">You don't have permission to view user activity logs.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthenticatedLayout>
    )
  }

  // Fetch user activities
  const fetchUserActivities = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/users/activity')
      const data = await response.json()

      if (data.success) {
        setActivities(data.activities || [])
        setFilteredActivities(data.activities || [])
      } else {
        error('Failed to fetch user activities', data.error)
      }
    } catch (err) {
      error('Error fetching user activities', 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUserActivities()
  }, [])

  // Apply filters
  useEffect(() => {
    let filtered = activities

    // Search filter
    if (filters.search) {
      filtered = filtered.filter(activity =>
        activity.user_name?.toLowerCase().includes(filters.search.toLowerCase()) ||
        activity.user_email?.toLowerCase().includes(filters.search.toLowerCase()) ||
        activity.action?.toLowerCase().includes(filters.search.toLowerCase()) ||
        activity.resource_type?.toLowerCase().includes(filters.search.toLowerCase())
      )
    }

    // Action filter
    if (filters.action) {
      filtered = filtered.filter(activity => activity.action === filters.action)
    }

    // Resource type filter
    if (filters.resourceType) {
      filtered = filtered.filter(activity => activity.resource_type === filters.resourceType)
    }

    // Date range filter
    if (filters.dateRange) {
      const now = new Date()
      let cutoffDate: Date

      switch (filters.dateRange) {
        case '1d':
          cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
          break
        case '7d':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case '30d':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case '90d':
          cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          cutoffDate = new Date(0)
      }

      filtered = filtered.filter(activity => new Date(activity.created_at) >= cutoffDate)
    }

    setFilteredActivities(filtered)
  }, [activities, filters])

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      'login': 'bg-green-100 text-green-800',
      'logout': 'bg-gray-100 text-gray-800',
      'create': 'bg-blue-100 text-blue-800',
      'update': 'bg-yellow-100 text-yellow-800',
      'delete': 'bg-red-100 text-red-800',
      'approve': 'bg-green-100 text-green-800',
      'reject': 'bg-red-100 text-red-800',
      'view': 'bg-purple-100 text-purple-800'
    }

    return (
      <Badge className={actionColors[action] || 'bg-gray-100 text-gray-800'}>
        {action}
      </Badge>
    )
  }

  const getResourceTypeIcon = (resourceType: string) => {
    const icons: Record<string, any> = {
      'user': User,
      'contract': Activity,
      'promoter': Users,
      'party': Users
    }

    const IconComponent = icons[resourceType] || Activity
    return <IconComponent className="h-4 w-4" />
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const exportActivities = () => {
    const csvContent = [
      ['User', 'Action', 'Resource Type', 'Resource ID', 'IP Address', 'Date'],
      ...filteredActivities.map(activity => [
        activity.user_name || activity.user_email,
        activity.action,
        activity.resource_type,
        activity.resource_id,
        activity.ip_address,
        formatDate(activity.created_at)
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `user-activity-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const uniqueActions = [...new Set(activities.map(a => a.action))].sort()
  const uniqueResourceTypes = [...new Set(activities.map(a => a.resource_type))].sort()

  return (
    <AuthenticatedLayout locale={locale}>
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">User Activity Logs</h1>
            <p className="text-gray-600 mt-2">
              Monitor and track user activities across the system
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Activity className="h-8 w-8 text-blue-600" />
            <Badge variant="outline" className="text-lg px-3 py-1">
              {filteredActivities.length} Activities
            </Badge>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="search"
                    placeholder="Search activities..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="action">Action</Label>
                <Select value={filters.action} onValueChange={(value) => setFilters(prev => ({ ...prev, action: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All actions</SelectItem>
                    {uniqueActions.map(action => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="resourceType">Resource Type</Label>
                <Select value={filters.resourceType} onValueChange={(value) => setFilters(prev => ({ ...prev, resourceType: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="All resources" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All resources</SelectItem>
                    {uniqueResourceTypes.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateRange">Date Range</Label>
                <Select value={filters.dateRange} onValueChange={(value) => setFilters(prev => ({ ...prev, dateRange: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1d">Last 24 hours</SelectItem>
                    <SelectItem value="7d">Last 7 days</SelectItem>
                    <SelectItem value="30d">Last 30 days</SelectItem>
                    <SelectItem value="90d">Last 90 days</SelectItem>
                    <SelectItem value="all">All time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button onClick={fetchUserActivities} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportActivities} variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
          <div className="text-sm text-gray-600">
            Showing {filteredActivities.length} of {activities.length} activities
          </div>
        </div>

        {/* Activity List */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                <span className="ml-2 text-gray-600">Loading activities...</span>
              </div>
            ) : filteredActivities.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Activities Found</h3>
                <p className="text-gray-600">No user activities match your current filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredActivities.map((activity) => (
                  <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            {getResourceTypeIcon(activity.resource_type)}
                          </div>
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold text-gray-900">
                              {activity.user_name || activity.user_email}
                            </h3>
                            {getActionBadge(activity.action)}
                          </div>
                          
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Activity className="w-4 h-4" />
                              {activity.resource_type} {activity.resource_id}
                            </div>
                            {activity.ip_address && (
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                {activity.ip_address}
                              </div>
                            )}
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(activity.created_at)}
                            </div>
                          </div>
                          
                          {activity.details && (
                            <div className="mt-2 text-sm text-gray-500">
                              <pre className="whitespace-pre-wrap">{JSON.stringify(activity.details, null, 2)}</pre>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AuthenticatedLayout>
  )
} 