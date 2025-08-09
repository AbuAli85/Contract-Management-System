"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, Calendar, Star, DollarSign, Users, TrendingUp, 
  CheckCircle, Clock, MessageCircle, Eye, Edit, Settings,
  Award, Target, BarChart3, Package, Activity, Zap,
  FileText, Download, Upload, Heart, Share2, Bell,
  Search, Filter, Archive, RefreshCw, AlertCircle,
  Play, Pause
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider'

interface ProviderService {
  id: string
  title: string
  description: string
  price: number
  category: string
  service_type: 'seo_audit' | 'google_ads' | 'social_media' | 'content_marketing' | 'ppc_management' | 'email_marketing' | 'web_analytics' | 'conversion_optimization'
  status: 'active' | 'paused' | 'draft'
  orders_count: number
  rating: number
  views_count: number
  featured: boolean
  created_at: string
  updated_at: string
  delivery_time: string
  provider_id: string
}

interface ProviderOrder {
  id: string
  title: string
  description: string
  client: {
    id: string
    name: string
    avatar_url: string
    email: string
  }
  status: 'pending' | 'active' | 'delivered' | 'completed' | 'cancelled' | 'revision_requested'
  budget: number
  deadline: string
  progress: number
  service_type: string
  created_at: string
  updated_at: string
  service_id: string
}

interface ProviderStats {
  active_orders: number
  completed_orders: number
  total_earnings: number
  avg_rating: number
  response_rate: number
  completion_rate: number
  pending_reviews: number
  this_month_earnings: number
  total_services: number
  active_services: number
}

interface ProviderEarnings {
  available_balance: number
  pending_balance: number
  total_earned: number
  this_month: number
  last_month: number
  transactions: {
    id: string
    amount: number
    type: 'earned' | 'withdrawn' | 'pending'
    description: string
    created_at: string
    order_id?: string
  }[]
}

interface RealTimeProviderDashboardProps {
  providerId: string
}

export function RealTimeProviderDashboard({ providerId }: RealTimeProviderDashboardProps) {
  const { user, hasPermission } = useEnhancedRBAC()
  const [stats, setStats] = useState<ProviderStats | null>(null)
  const [services, setServices] = useState<ProviderService[]>([])
  const [orders, setOrders] = useState<ProviderOrder[]>([])
  const [earnings, setEarnings] = useState<ProviderEarnings | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showServiceModal, setShowServiceModal] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  const supabase = createClient()

  useEffect(() => {
    if (providerId && hasPermission('dashboard.view')) {
      loadProviderData()
      setupRealtimeSubscriptions()
    }
  }, [providerId])

  const loadProviderData = async () => {
    try {
      setLoading(true)
      await Promise.all([
        loadProviderStats(),
        loadProviderServices(),
        loadProviderOrders(),
        loadProviderEarnings()
      ])
    } catch (error) {
      console.error('Error loading provider data:', error)
      toast.error('Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const loadProviderStats = async () => {
    try {
      const response = await fetch('/api/provider/stats')
      if (!response.ok) {
        throw new Error('Failed to fetch provider stats')
      }
      
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error('Error loading provider stats:', error)
      toast.error('Failed to load provider statistics')
    }
  }

  const loadProviderServices = async () => {
    try {
      const response = await fetch('/api/provider/services')
      if (!response.ok) {
        throw new Error('Failed to fetch provider services')
      }
      
      const data = await response.json()
      setServices(data.services)
    } catch (error) {
      console.error('Error loading provider services:', error)
      toast.error('Failed to load services')
    }
  }

  const loadProviderOrders = async () => {
    try {
      const response = await fetch('/api/provider/orders')
      if (!response.ok) {
        throw new Error('Failed to fetch provider orders')
      }
      
      const data = await response.json()
      setOrders(data.orders)
    } catch (error) {
      console.error('Error loading provider orders:', error)
      toast.error('Failed to load orders')
    }
  }

  const loadProviderEarnings = async () => {
    try {
      // This would be calculated from completed bookings and transactions
      const { data: completedBookings, error } = await supabase
        .from('bookings')
        .select('total_amount, created_at')
        .eq('provider_id', providerId)
        .eq('status', 'completed')

      if (error) throw error

      const totalEarned = (completedBookings || []).reduce((sum, booking) => 
        sum + (booking.total_amount || 0), 0
      )

      const thisMonth = new Date()
      const firstDayThisMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1)
      const firstDayLastMonth = new Date(thisMonth.getFullYear(), thisMonth.getMonth() - 1, 1)
      
      const thisMonthEarnings = (completedBookings || [])
        .filter(booking => new Date(booking.created_at) >= firstDayThisMonth)
        .reduce((sum, booking) => sum + (booking.total_amount || 0), 0)
      
      const lastMonthEarnings = (completedBookings || [])
        .filter(booking => {
          const bookingDate = new Date(booking.created_at)
          return bookingDate >= firstDayLastMonth && bookingDate < firstDayThisMonth
        })
        .reduce((sum, booking) => sum + (booking.total_amount || 0), 0)

      const earningsData: ProviderEarnings = {
        available_balance: totalEarned * 0.8, // 80% available
        pending_balance: totalEarned * 0.2, // 20% pending
        total_earned: totalEarned,
        this_month: thisMonthEarnings,
        last_month: lastMonthEarnings,
        transactions: [] // This would come from a transactions table
      }

      setEarnings(earningsData)
    } catch (error) {
      console.error('Error loading provider earnings:', error)
    }
  }

  const calculateOrderProgress = (status: string): number => {
    switch (status) {
      case 'pending': return 0
      case 'active': return 50
      case 'delivered': return 90
      case 'completed': return 100
      case 'revision_requested': return 75
      default: return 0
    }
  }

  const setupRealtimeSubscriptions = () => {
    // Subscribe to provider services changes
    const servicesSubscription = supabase
      .channel('provider-services')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'provider_services',
          filter: `provider_id=eq.${providerId}`
        },
        () => {
          loadProviderServices()
        }
      )
      .subscribe()

    // Subscribe to bookings changes
    const bookingsSubscription = supabase
      .channel('provider-bookings')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings',
          filter: `provider_id=eq.${providerId}`
        },
        () => {
          loadProviderOrders()
          loadProviderStats()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(servicesSubscription)
      supabase.removeChannel(bookingsSubscription)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadProviderData()
    setRefreshing(false)
    toast.success('Dashboard refreshed!')
  }

  const handleCreateService = async () => {
    setShowServiceModal(true)
  }

  const handleServiceAction = async (action: string, serviceId: string) => {
    try {
      let updateData: any = {}
      
      switch (action) {
        case 'activate':
          updateData = { status: 'active' }
          break
        case 'pause':
          updateData = { status: 'paused' }
          break
        case 'delete':
          const deleteResponse = await fetch('/api/provider/services', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: serviceId })
          })
          if (!deleteResponse.ok) {
            throw new Error('Failed to delete service')
          }
          await loadProviderServices()
          toast.success('Service deleted successfully!')
          return
      }
      
      if (Object.keys(updateData).length > 0) {
        const response = await fetch('/api/provider/services', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: serviceId, ...updateData })
        })
        
        if (!response.ok) {
          throw new Error(`Failed to ${action} service`)
        }
        
        await loadProviderServices()
        toast.success(`Service ${action} completed!`)
      }
    } catch (error) {
      console.error(`Error ${action} service:`, error)
      toast.error(`Failed to ${action} service`)
    }
  }

  const handleOrderAction = async (action: string, orderId: string) => {
    try {
      let newStatus = ''
      switch (action) {
        case 'accept':
          newStatus = 'active'
          break
        case 'deliver':
          newStatus = 'delivered'
          break
        case 'complete':
          newStatus = 'completed'
          break
      }

      if (newStatus) {
        const response = await fetch('/api/provider/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId, status: newStatus })
        })
        
        if (!response.ok) {
          throw new Error(`Failed to ${action} order`)
        }
        
        await loadProviderOrders()
        await loadProviderStats()
        toast.success(`Order ${action} completed!`)
      }
    } catch (error) {
      console.error(`Error ${action} order:`, error)
      toast.error(`Failed to ${action} order`)
    }
  }

  const getServiceTypeLabel = (serviceType: string): string => {
    const labels: Record<string, string> = {
      'seo_audit': 'SEO Audit',
      'google_ads': 'Google Ads',
      'social_media': 'Social Media',
      'content_marketing': 'Content Marketing',
      'ppc_management': 'PPC Management',
      'email_marketing': 'Email Marketing',
      'web_analytics': 'Web Analytics',
      'conversion_optimization': 'Conversion Optimization'
    }
    return labels[serviceType] || serviceType
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'pending': return 'bg-yellow-100 text-yellow-700'
      case 'delivered': return 'bg-purple-100 text-purple-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      case 'paused': return 'bg-gray-100 text-gray-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="h-4 w-4" />
      case 'completed': return <CheckCircle className="h-4 w-4" />
      case 'pending': return <Clock className="h-4 w-4" />
      case 'delivered': return <Package className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      default: return <Package className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!hasPermission('dashboard.view')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="p-12 text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
            <p className="text-gray-600">You don't have permission to access the provider dashboard.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Provider Dashboard</h1>
          <p className="text-gray-600">Manage your services, orders, and grow your business</p>
        </div>
        
        <div className="flex space-x-3">
          <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleCreateService} className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            Create Service
          </Button>
          <Button variant="outline">
            <BarChart3 className="h-4 w-4 mr-2" />
            Analytics
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Activity className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Active Orders</p>
                <p className="text-xl font-bold">{stats?.active_orders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-xl font-bold">{stats?.completed_orders || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Earnings</p>
                <p className="text-xl font-bold">${stats?.total_earnings.toLocaleString() || '0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Star className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Avg Rating</p>
                <p className="text-xl font-bold">{stats?.avg_rating || '0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <TrendingUp className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Response Rate</p>
                <p className="text-xl font-bold">{stats?.response_rate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <Target className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Completion Rate</p>
                <p className="text-xl font-bold">{stats?.completion_rate || 0}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Package className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Total Services</p>
                <p className="text-xl font-bold">{stats?.total_services || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-pink-100 rounded-lg">
                <DollarSign className="h-5 w-5 text-pink-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-xl font-bold">${stats?.this_month_earnings.toLocaleString() || '0'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">My Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="services">My Services ({services.length})</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders" className="space-y-6">
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Orders</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {orders
              .filter(order => 
                filterStatus === 'all' || order.status === filterStatus
              )
              .filter(order => 
                order.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                order.client.name.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={order.client.avatar_url} />
                        <AvatarFallback>{order.client.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{order.title}</h3>
                        <p className="text-gray-600">Client: {order.client.name}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Budget: ${order.budget.toLocaleString()}</span>
                          <span>Due: {new Date(order.deadline).toLocaleDateString()}</span>
                          <span>Type: {getServiceTypeLabel(order.service_type)}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getStatusColor(order.status)}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span>Progress</span>
                        <span>{order.progress}%</span>
                      </div>
                      <Progress value={order.progress} className="h-2" />
                    </div>
                    
                    <div className="flex space-x-3">
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        Message Client
                      </Button>
                      {order.status === 'pending' && (
                        <Button size="sm" onClick={() => handleOrderAction('accept', order.id)}>
                          Accept Order
                        </Button>
                      )}
                      {order.status === 'active' && (
                        <Button size="sm" onClick={() => handleOrderAction('deliver', order.id)}>
                          Deliver Work
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Services Tab */}
        <TabsContent value="services" className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">My Services</h2>
            <Button onClick={handleCreateService}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Service
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline">{getServiceTypeLabel(service.service_type)}</Badge>
                    <div className="flex items-center space-x-2">
                      {service.featured && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      <Badge className={getStatusColor(service.status)}>
                        {service.status}
                      </Badge>
                    </div>
                  </div>
                  <h3 className="font-semibold text-lg">{service.title}</h3>
                  <p className="text-sm text-gray-600 line-clamp-2">{service.description}</p>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-bold">{service.orders_count}</div>
                        <div className="text-xs text-gray-500">Orders</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{service.rating}</div>
                        <div className="text-xs text-gray-500">Rating</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{service.views_count}</div>
                        <div className="text-xs text-gray-500">Views</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">${service.price}</span>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleServiceAction('edit', service.id)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleServiceAction('view', service.id)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                        {service.status === 'active' ? (
                          <Button variant="outline" size="sm" onClick={() => handleServiceAction('pause', service.id)}>
                            <Pause className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button variant="outline" size="sm" onClick={() => handleServiceAction('activate', service.id)}>
                            <Play className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Earnings Tab */}
        <TabsContent value="earnings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    ${earnings?.available_balance.toLocaleString() || '0'}
                  </div>
                  <p className="text-sm text-gray-600">Available for Withdrawal</p>
                  <Button size="sm" className="mt-3 w-full">
                    Withdraw
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    ${earnings?.pending_balance.toLocaleString() || '0'}
                  </div>
                  <p className="text-sm text-gray-600">Pending Clearance</p>
                  <p className="text-xs text-gray-500 mt-2">Available in 5-7 days</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    ${earnings?.this_month.toLocaleString() || '0'}
                  </div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <div className="flex items-center justify-center mt-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500">
                      {earnings && earnings.last_month > 0 ? 
                        `+${Math.round(((earnings.this_month - earnings.last_month) / earnings.last_month) * 100)}%` 
                        : '+0%'
                      }
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    ${earnings?.total_earned.toLocaleString() || '0'}
                  </div>
                  <p className="text-sm text-gray-600">Total Earned</p>
                  <p className="text-xs text-gray-500 mt-2">Since joining</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Analytics</CardTitle>
              <CardDescription>
                Track your business growth and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {stats?.completion_rate || 0}%
                  </div>
                  <p className="text-sm text-gray-600">Order Completion Rate</p>
                  <Progress value={stats?.completion_rate || 0} className="mt-2" />
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {stats?.response_rate || 0}%
                  </div>
                  <p className="text-sm text-gray-600">Response Rate</p>
                  <Progress value={stats?.response_rate || 0} className="mt-2" />
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {stats?.avg_rating || 0}
                  </div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <div className="flex justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(stats?.avg_rating || 0)
                            ? 'fill-yellow-400 text-yellow-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Orders
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab('orders')}>
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                      <Avatar>
                        <AvatarImage src={order.client.avatar_url} />
                        <AvatarFallback>{order.client.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{order.title}</h4>
                        <p className="text-sm text-gray-600">{order.client.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getStatusColor(order.status)}>
                            {getStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                          </Badge>
                          <span className="text-xs text-gray-500">${order.budget.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium">{order.progress}%</div>
                        <Progress value={order.progress} className="w-16 h-2 mt-1" />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <Button variant="outline" className="h-16 flex-col" onClick={handleCreateService}>
                    <Plus className="h-6 w-6 mb-2" />
                    Create Service
                  </Button>
                  <Button variant="outline" className="h-16 flex-col">
                    <MessageCircle className="h-6 w-6 mb-2" />
                    Message Client
                  </Button>
                  <Button variant="outline" className="h-16 flex-col">
                    <Calendar className="h-6 w-6 mb-2" />
                    Update Availability
                  </Button>
                  <Button variant="outline" className="h-16 flex-col" onClick={() => setActiveTab('analytics')}>
                    <BarChart3 className="h-6 w-6 mb-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Create Service Modal */}
      <Dialog open={showServiceModal} onOpenChange={setShowServiceModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create New Service</DialogTitle>
            <DialogDescription>
              Create a new service offering to attract more clients
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Title</label>
                <Input placeholder="e.g. SEO Audit & Strategy" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Service Type</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="seo_audit">SEO Audit</SelectItem>
                    <SelectItem value="google_ads">Google Ads</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="content_marketing">Content Marketing</SelectItem>
                    <SelectItem value="ppc_management">PPC Management</SelectItem>
                    <SelectItem value="email_marketing">Email Marketing</SelectItem>
                    <SelectItem value="web_analytics">Web Analytics</SelectItem>
                    <SelectItem value="conversion_optimization">Conversion Optimization</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Description</label>
              <textarea 
                className="w-full h-24 px-3 py-2 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe your service in detail..."
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Price ($)</label>
                <Input placeholder="299" type="number" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Delivery Time</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select delivery time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-day">1 Day</SelectItem>
                    <SelectItem value="3-days">3 Days</SelectItem>
                    <SelectItem value="5-days">5 Days</SelectItem>
                    <SelectItem value="7-days">7 Days</SelectItem>
                    <SelectItem value="14-days">14 Days</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <Button onClick={() => setShowServiceModal(false)} variant="outline" className="flex-1">
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  setShowServiceModal(false)
                  toast.success('Service created successfully!')
                }}
                className="flex-1"
              >
                Create Service
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}