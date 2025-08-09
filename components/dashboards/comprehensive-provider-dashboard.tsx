"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Plus, Calendar, Star, DollarSign, Users, TrendingUp, 
  CheckCircle, Clock, MessageCircle, Eye, Edit, Settings,
  Award, Target, BarChart3, Package, Activity, Zap,
  FileText, Download, Upload, Heart, Share2, Bell,
  Search, Filter, Archive, RefreshCw, AlertCircle
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
import Link from 'next/link'

interface ProviderDashboardData {
  overview: {
    activeOrders: number
    completedOrders: number
    totalEarnings: number
    avgRating: number
    responseRate: number
    completionRate: number
    pendingReviews: number
    thisMonthEarnings: number
  }
  
  recentOrders: {
    id: string
    title: string
    client: {
      id: string
      name: string
      avatar: string
      rating: number
    }
    status: 'new' | 'in_progress' | 'delivered' | 'completed' | 'cancelled' | 'revision'
    budget: number
    deadline: string
    progress: number
    category: string
    createdAt: string
    lastUpdate: string
  }[]
  
  services: {
    id: string
    title: string
    description: string
    price: number
    category: string
    status: 'active' | 'paused' | 'draft'
    orders: number
    rating: number
    views: number
    featured: boolean
    createdAt: string
  }[]
  
  earnings: {
    thisMonth: number
    lastMonth: number
    pending: number
    available: number
    totalEarned: number
    breakdown: {
      date: string
      amount: number
      client: string
      service: string
      status: 'completed' | 'pending' | 'processing'
    }[]
  }
  
  messages: {
    id: string
    clientId: string
    clientName: string
    clientAvatar: string
    lastMessage: string
    timestamp: string
    unread: boolean
    orderId: string
    orderTitle: string
  }[]
  
  analytics: {
    views: { date: string; count: number }[]
    orders: { date: string; count: number }[]
    earnings: { date: string; amount: number }[]
    rating: { date: string; rating: number }[]
  }
}

export function ComprehensiveProviderDashboard() {
  const [dashboardData, setDashboardData] = useState<ProviderDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showServiceModal, setShowServiceModal] = useState(false)

  // Load dashboard data
  useEffect(() => {
    loadProviderData()
  }, [])

  const loadProviderData = async () => {
    try {
      setLoading(true)
      
      // Mock data - replace with actual API calls
      const mockData: ProviderDashboardData = {
        overview: {
          activeOrders: 12,
          completedOrders: 156,
          totalEarnings: 28750,
          avgRating: 4.8,
          responseRate: 95,
          completionRate: 98,
          pendingReviews: 5,
          thisMonthEarnings: 4250
        },
        
        recentOrders: [
          {
            id: 'order_1',
            title: 'E-commerce SEO Optimization',
            client: {
              id: 'client_1',
              name: 'Michael Chen',
              avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
              rating: 4.9
            },
            status: 'in_progress',
            budget: 1500,
            deadline: '2024-02-15',
            progress: 65,
            category: 'Digital Marketing',
            createdAt: '2024-01-10T09:00:00Z',
            lastUpdate: '2024-01-20T14:30:00Z'
          },
          {
            id: 'order_2',
            title: 'Social Media Strategy Development',
            client: {
              id: 'client_2',
              name: 'Lisa Rodriguez',
              avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
              rating: 4.7
            },
            status: 'delivered',
            budget: 800,
            deadline: '2024-01-25',
            progress: 100,
            category: 'Digital Marketing',
            createdAt: '2024-01-05T11:00:00Z',
            lastUpdate: '2024-01-20T16:45:00Z'
          },
          {
            id: 'order_3',
            title: 'PPC Campaign Setup & Management',
            client: {
              id: 'client_3',
              name: 'David Park',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=40&h=40&fit=crop&crop=face',
              rating: 5.0
            },
            status: 'new',
            budget: 1200,
            deadline: '2024-02-20',
            progress: 0,
            category: 'Digital Marketing',
            createdAt: '2024-01-20T08:00:00Z',
            lastUpdate: '2024-01-20T08:00:00Z'
          }
        ],
        
        services: [
          {
            id: 'service_1',
            title: 'Complete SEO Audit & Strategy',
            description: 'Comprehensive SEO analysis with actionable recommendations',
            price: 299,
            category: 'Digital Marketing',
            status: 'active',
            orders: 45,
            rating: 4.9,
            views: 1240,
            featured: true,
            createdAt: '2023-10-15T10:00:00Z'
          },
          {
            id: 'service_2',
            title: 'Google Ads Campaign Setup',
            description: 'Professional Google Ads campaign creation and optimization',
            price: 499,
            category: 'Digital Marketing',
            status: 'active',
            orders: 32,
            rating: 4.8,
            views: 890,
            featured: false,
            createdAt: '2023-11-20T14:00:00Z'
          },
          {
            id: 'service_3',
            title: 'Social Media Content Calendar',
            description: '30-day social media content strategy and calendar',
            price: 199,
            category: 'Digital Marketing',
            status: 'paused',
            orders: 18,
            rating: 4.6,
            views: 567,
            featured: false,
            createdAt: '2023-12-10T09:00:00Z'
          }
        ],
        
        earnings: {
          thisMonth: 4250,
          lastMonth: 3890,
          pending: 850,
          available: 3400,
          totalEarned: 28750,
          breakdown: [
            {
              date: '2024-01-20',
              amount: 299,
              client: 'TechStart Inc.',
              service: 'SEO Audit',
              status: 'completed'
            },
            {
              date: '2024-01-18',
              amount: 499,
              client: 'Growth Co.',
              service: 'Google Ads Setup',
              status: 'completed'
            },
            {
              date: '2024-01-15',
              amount: 199,
              client: 'Local Business',
              service: 'Social Media Strategy',
              status: 'pending'
            }
          ]
        },
        
        messages: [
          {
            id: 'msg_1',
            clientId: 'client_1',
            clientName: 'Michael Chen',
            clientAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=40&h=40&fit=crop&crop=face',
            lastMessage: 'Great work on the keyword research! Can we schedule a call to discuss next steps?',
            timestamp: '2024-01-20T15:30:00Z',
            unread: true,
            orderId: 'order_1',
            orderTitle: 'E-commerce SEO Optimization'
          },
          {
            id: 'msg_2',
            clientId: 'client_2',
            clientName: 'Lisa Rodriguez',
            clientAvatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=40&h=40&fit=crop&crop=face',
            lastMessage: 'The social media strategy looks perfect! Ready to approve the delivery.',
            timestamp: '2024-01-20T12:15:00Z',
            unread: false,
            orderId: 'order_2',
            orderTitle: 'Social Media Strategy Development'
          }
        ],
        
        analytics: {
          views: [
            { date: '2024-01-15', count: 45 },
            { date: '2024-01-16', count: 52 },
            { date: '2024-01-17', count: 38 },
            { date: '2024-01-18', count: 61 },
            { date: '2024-01-19', count: 47 },
            { date: '2024-01-20', count: 55 }
          ],
          orders: [
            { date: '2024-01-15', count: 2 },
            { date: '2024-01-16', count: 1 },
            { date: '2024-01-17', count: 3 },
            { date: '2024-01-18', count: 2 },
            { date: '2024-01-19', count: 1 },
            { date: '2024-01-20', count: 4 }
          ],
          earnings: [
            { date: '2024-01-15', amount: 299 },
            { date: '2024-01-16', amount: 0 },
            { date: '2024-01-17', amount: 597 },
            { date: '2024-01-18', amount: 499 },
            { date: '2024-01-19', amount: 199 },
            { date: '2024-01-20', amount: 398 }
          ],
          rating: [
            { date: '2024-01-15', rating: 4.8 },
            { date: '2024-01-16', rating: 4.8 },
            { date: '2024-01-17', rating: 4.9 },
            { date: '2024-01-18', rating: 4.8 },
            { date: '2024-01-19', rating: 4.9 },
            { date: '2024-01-20', rating: 4.8 }
          ]
        }
      }
      
      setDashboardData(mockData)
      setLoading(false)
    } catch (error) {
      console.error('Error loading provider data:', error)
      toast.error('Failed to load dashboard data')
      setLoading(false)
    }
  }

  const handleCreateService = () => {
    setShowServiceModal(true)
  }

  const handleServiceAction = (action: string, serviceId: string) => {
    toast.success(`Service ${action} action completed!`)
  }

  const getOrderStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'bg-blue-100 text-blue-700'
      case 'in_progress': return 'bg-yellow-100 text-yellow-700'
      case 'delivered': return 'bg-purple-100 text-purple-700'
      case 'completed': return 'bg-green-100 text-green-700'
      case 'revision': return 'bg-orange-100 text-orange-700'
      case 'cancelled': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getOrderStatusIcon = (status: string) => {
    switch (status) {
      case 'new': return <Package className="h-4 w-4" />
      case 'in_progress': return <Activity className="h-4 w-4" />
      case 'delivered': return <CheckCircle className="h-4 w-4" />
      case 'completed': return <Award className="h-4 w-4" />
      case 'revision': return <RefreshCw className="h-4 w-4" />
      case 'cancelled': return <AlertCircle className="h-4 w-4" />
      default: return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
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
                <p className="text-xl font-bold">{dashboardData?.overview.activeOrders}</p>
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
                <p className="text-xl font-bold">{dashboardData?.overview.completedOrders}</p>
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
                <p className="text-xl font-bold">${dashboardData?.overview.totalEarnings.toLocaleString()}</p>
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
                <p className="text-xl font-bold">{dashboardData?.overview.avgRating}</p>
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
                <p className="text-xl font-bold">{dashboardData?.overview.responseRate}%</p>
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
                <p className="text-xl font-bold">{dashboardData?.overview.completionRate}%</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <MessageCircle className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Pending Reviews</p>
                <p className="text-xl font-bold">{dashboardData?.overview.pendingReviews}</p>
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
                <p className="text-xl font-bold">${dashboardData?.overview.thisMonthEarnings.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="orders">My Orders</TabsTrigger>
          <TabsTrigger value="services">My Services</TabsTrigger>
          <TabsTrigger value="earnings">Earnings</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Orders */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Recent Orders
                  <Link href="#" onClick={() => setActiveTab('orders')}>
                    <Button variant="ghost" size="sm">View All</Button>
                  </Link>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardData?.recentOrders.slice(0, 3).map((order) => (
                    <div key={order.id} className="flex items-center space-x-4 p-3 rounded-lg border">
                      <Avatar>
                        <AvatarImage src={order.client.avatar} />
                        <AvatarFallback>{order.client.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-900 truncate">{order.title}</h4>
                        <p className="text-sm text-gray-600">{order.client.name}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge className={getOrderStatusColor(order.status)}>
                            {getOrderStatusIcon(order.status)}
                            <span className="ml-1 capitalize">{order.status.replace('_', ' ')}</span>
                          </Badge>
                          <span className="text-xs text-gray-500">${order.budget}</span>
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
                  <Button variant="outline" className="h-16 flex-col">
                    <BarChart3 className="h-6 w-6 mb-2" />
                    View Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Performance Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    {dashboardData?.overview.completionRate}%
                  </div>
                  <p className="text-sm text-gray-600">Order Completion Rate</p>
                  <Progress value={dashboardData?.overview.completionRate} className="mt-2" />
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {dashboardData?.overview.responseRate}%
                  </div>
                  <p className="text-sm text-gray-600">Response Rate</p>
                  <Progress value={dashboardData?.overview.responseRate} className="mt-2" />
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600 mb-2">
                    {dashboardData?.overview.avgRating}
                  </div>
                  <p className="text-sm text-gray-600">Average Rating</p>
                  <div className="flex justify-center mt-2">
                    {[...Array(5)].map((_, i) => (
                      <Star 
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(dashboardData?.overview.avgRating || 0)
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
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="revision">Revision</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {dashboardData?.recentOrders.map((order) => (
              <Card key={order.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <Avatar>
                        <AvatarImage src={order.client.avatar} />
                        <AvatarFallback>{order.client.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-lg">{order.title}</h3>
                        <p className="text-gray-600">Client: {order.client.name}</p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Budget: ${order.budget}</span>
                          <span>Due: {new Date(order.deadline).toLocaleDateString()}</span>
                          <span>Category: {order.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Badge className={getOrderStatusColor(order.status)}>
                        {getOrderStatusIcon(order.status)}
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
                      {order.status === 'new' && (
                        <Button size="sm">
                          Accept Order
                        </Button>
                      )}
                      {order.status === 'in_progress' && (
                        <Button size="sm">
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
            {dashboardData?.services.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <Badge variant="outline">{service.category}</Badge>
                    <div className="flex items-center space-x-2">
                      {service.featured && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      )}
                      <Badge className={
                        service.status === 'active' ? 'bg-green-100 text-green-700' :
                        service.status === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }>
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
                        <div className="text-lg font-bold">{service.orders}</div>
                        <div className="text-xs text-gray-500">Orders</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{service.rating}</div>
                        <div className="text-xs text-gray-500">Rating</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{service.views}</div>
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
                        <Button variant="outline" size="sm" onClick={() => handleServiceAction('settings', service.id)}>
                          <Settings className="h-4 w-4" />
                        </Button>
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
                    ${dashboardData?.earnings.available.toLocaleString()}
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
                    ${dashboardData?.earnings.pending.toLocaleString()}
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
                    ${dashboardData?.earnings.thisMonth.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">This Month</p>
                  <div className="flex items-center justify-center mt-2 text-sm">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-green-500">+9.2%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    ${dashboardData?.earnings.totalEarned.toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Total Earned</p>
                  <p className="text-xs text-gray-500 mt-2">Since joining</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Recent Earnings</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead>Service</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dashboardData?.earnings.breakdown.map((earning, index) => (
                    <TableRow key={index}>
                      <TableCell>{new Date(earning.date).toLocaleDateString()}</TableCell>
                      <TableCell>{earning.client}</TableCell>
                      <TableCell>{earning.service}</TableCell>
                      <TableCell className="font-medium">${earning.amount}</TableCell>
                      <TableCell>
                        <Badge className={
                          earning.status === 'completed' ? 'bg-green-100 text-green-700' :
                          earning.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-blue-100 text-blue-700'
                        }>
                          {earning.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Client Messages</CardTitle>
              <CardDescription>
                Communicate with your clients about ongoing projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {dashboardData?.messages.map((message) => (
                  <div key={message.id} className="flex items-start space-x-4 p-4 rounded-lg border hover:bg-gray-50 cursor-pointer">
                    <Avatar>
                      <AvatarImage src={message.clientAvatar} />
                      <AvatarFallback>{message.clientName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium">{message.clientName}</h4>
                        <Badge variant="outline" className="text-xs">{message.orderTitle}</Badge>
                        {message.unread && (
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        )}
                      </div>
                      <p className="text-sm text-gray-700">{message.lastMessage}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(message.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
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
                <label className="text-sm font-medium">Category</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="digital-marketing">Digital Marketing</SelectItem>
                    <SelectItem value="web-development">Web Development</SelectItem>
                    <SelectItem value="graphic-design">Graphic Design</SelectItem>
                    <SelectItem value="writing">Content Writing</SelectItem>
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