"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Network,
  Users,
  Factory,
  ArrowRight,
  Star,
  TrendingUp,
  DollarSign,
  Calendar,
  MapPin,
  Phone,
  Mail,
  Eye,
  Plus,
  Filter,
  Search,
  Download,
  Activity,
  Target,
  Zap,
  Award,
  Clock,
  CheckCircle,
  AlertCircle,
  PieChart,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Link,
  Heart
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

interface Relationship {
  id: string
  client_id: string
  provider_id: string
  client_name: string
  provider_name: string
  relationship_type: 'Active' | 'Potential' | 'Paused' | 'Completed'
  start_date: string
  end_date?: string
  strength_score: number
  satisfaction_rating: number
  total_value: number
  active_promoters: number
  last_interaction: string
  service_categories: string[]
  contract_status: 'Active' | 'Pending' | 'Expired' | 'Renewed'
  performance_score: number
  growth_trend: 'up' | 'down' | 'stable'
}

interface RelationshipStats {
  total_relationships: number
  active_relationships: number
  potential_relationships: number
  total_value: number
  avg_satisfaction: number
  top_partnerships: Array<{
    client: string
    provider: string
    value: number
    satisfaction: number
  }>
  relationship_growth: number
  network_density: number
}

export function ClientProviderRelationships() {
  const [relationships, setRelationships] = useState<Relationship[]>([])
  const [stats, setStats] = useState<RelationshipStats>({
    total_relationships: 0,
    active_relationships: 0,
    potential_relationships: 0,
    total_value: 0,
    avg_satisfaction: 0,
    top_partnerships: [],
    relationship_growth: 0,
    network_density: 0
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [selectedView, setSelectedView] = useState<'network' | 'list' | 'analytics' | 'insights'>('network')

  // Mock data - replace with real API calls
  useEffect(() => {
    const mockStats: RelationshipStats = {
      total_relationships: 24,
      active_relationships: 18,
      potential_relationships: 6,
      total_value: 425000,
      avg_satisfaction: 4.3,
      top_partnerships: [
        { client: 'Oman National Bank', provider: 'Smart Pro Services', value: 85000, satisfaction: 4.8 },
        { client: 'Muscat Municipality', provider: 'TechFlow Solutions', value: 75000, satisfaction: 4.6 },
        { client: 'Oman Air', provider: 'Elite Workforce', value: 65000, satisfaction: 4.4 }
      ],
      relationship_growth: 15.2,
      network_density: 73.5
    }

    const mockRelationships: Relationship[] = [
      {
        id: '1',
        client_id: 'c1',
        provider_id: 'p1',
        client_name: 'Oman National Bank',
        provider_name: 'Smart Pro Services',
        relationship_type: 'Active',
        start_date: '2023-08-15',
        strength_score: 92,
        satisfaction_rating: 4.8,
        total_value: 85000,
        active_promoters: 12,
        last_interaction: '2025-01-06',
        service_categories: ['Marketing', 'Brand Management', 'Digital Services'],
        contract_status: 'Active',
        performance_score: 88,
        growth_trend: 'up'
      },
      {
        id: '2',
        client_id: 'c2',
        provider_id: 'p2',
        client_name: 'Muscat Municipality',
        provider_name: 'TechFlow Solutions',
        relationship_type: 'Active',
        start_date: '2023-10-20',
        strength_score: 87,
        satisfaction_rating: 4.6,
        total_value: 75000,
        active_promoters: 8,
        last_interaction: '2025-01-05',
        service_categories: ['IT Support', 'Digital Infrastructure'],
        contract_status: 'Active',
        performance_score: 85,
        growth_trend: 'up'
      },
      {
        id: '3',
        client_id: 'c3',
        provider_id: 'p3',
        client_name: 'Oman Air',
        provider_name: 'Elite Workforce Solutions',
        relationship_type: 'Active',
        start_date: '2024-01-10',
        strength_score: 78,
        satisfaction_rating: 4.4,
        total_value: 65000,
        active_promoters: 6,
        last_interaction: '2025-01-04',
        service_categories: ['HR Services', 'Recruitment'],
        contract_status: 'Active',
        performance_score: 82,
        growth_trend: 'stable'
      },
      {
        id: '4',
        client_id: 'c4',
        provider_id: 'p1',
        client_name: 'PDO',
        provider_name: 'Smart Pro Services',
        relationship_type: 'Potential',
        start_date: '2025-01-01',
        strength_score: 65,
        satisfaction_rating: 0,
        total_value: 0,
        active_promoters: 0,
        last_interaction: '2025-01-03',
        service_categories: ['Marketing', 'Corporate Communications'],
        contract_status: 'Pending',
        performance_score: 0,
        growth_trend: 'up'
      },
      {
        id: '5',
        client_id: 'c5',
        provider_id: 'p2',
        client_name: 'Sohar Port',
        provider_name: 'TechFlow Solutions',
        relationship_type: 'Potential',
        start_date: '2025-01-02',
        strength_score: 70,
        satisfaction_rating: 0,
        total_value: 0,
        active_promoters: 0,
        last_interaction: '2025-01-02',
        service_categories: ['Cloud Services', 'System Integration'],
        contract_status: 'Pending',
        performance_score: 0,
        growth_trend: 'up'
      }
    ]

    setStats(mockStats)
    setRelationships(mockRelationships)
    setLoading(false)
  }, [])

  const filteredRelationships = relationships.filter(relationship => {
    const matchesSearch = relationship.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         relationship.provider_name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = typeFilter === 'all' || relationship.relationship_type.toLowerCase() === typeFilter
    
    return matchesSearch && matchesType
  })

  const getRelationshipColor = (type: string) => {
    switch (type) {
      case 'Active': return 'bg-green-100 text-green-800 border-green-200'
      case 'Potential': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'Paused': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'Completed': return 'bg-gray-100 text-gray-800 border-gray-200'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStrengthColor = (score: number) => {
    if (score >= 85) return 'text-green-600 bg-green-100'
    if (score >= 70) return 'text-blue-600 bg-blue-100'
    if (score >= 50) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

  const getSatisfactionColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600'
    if (rating >= 4.0) return 'text-blue-600'
    if (rating >= 3.5) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <ArrowUpRight className="h-4 w-4 text-green-600" />
      case 'down': return <ArrowDownRight className="h-4 w-4 text-red-600" />
      default: return <ArrowRight className="h-4 w-4 text-gray-600" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Network className="h-8 w-8 text-purple-600" />
            </div>
            Client-Provider Relationships
          </h1>
          <p className="text-muted-foreground mt-2">
            Visualize connections, track partnerships, and optimize collaboration networks
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Network
          </Button>
          <Button className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700">
            <Plus className="h-4 w-4" />
            Create Partnership
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-purple-500/10 rounded-full -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Partnerships</CardTitle>
              <Heart className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_relationships}</div>
              <p className="text-xs text-muted-foreground">
                of {stats.total_relationships} total relationships
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Value</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${stats.total_value.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Total partnership value
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Network Growth</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">+{stats.relationship_growth}%</div>
              <p className="text-xs text-muted-foreground">
                This quarter growth
              </p>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="relative overflow-hidden">
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full -mr-10 -mt-10" />
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Satisfaction</CardTitle>
              <Star className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avg_satisfaction.toFixed(1)}</div>
              <p className="text-xs text-muted-foreground">
                Average partnership rating
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Main Content */}
      <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="network">Network Map</TabsTrigger>
          <TabsTrigger value="list">Relationship List</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="network" className="space-y-6">
          {/* Network Visualization Placeholder */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Partnership Network Visualization
              </CardTitle>
              <CardDescription>
                Interactive map showing client-provider connections and relationship strength
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-dashed border-purple-200 flex items-center justify-center">
                <div className="text-center space-y-4">
                  <div className="flex justify-center space-x-4">
                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                      <Users className="h-8 w-8 text-blue-600" />
                    </div>
                    <div className="flex items-center">
                      <div className="w-8 h-0.5 bg-purple-300"></div>
                      <Heart className="h-6 w-6 text-purple-500 mx-2" />
                      <div className="w-8 h-0.5 bg-purple-300"></div>
                    </div>
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Factory className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-purple-800">Interactive Network Map</h3>
                    <p className="text-purple-600">Visualization of {stats.active_relationships} active partnerships</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Advanced network visualization with D3.js or similar library
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Partnership Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Top Partnerships
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.top_partnerships.map((partnership, index) => (
                    <div key={index} className="flex items-center gap-4 p-4 rounded-lg border bg-gradient-to-r from-purple-50 to-blue-50">
                      <div className="flex items-center gap-2">
                        <span className={`text-lg font-bold ${
                          index === 0 ? 'text-yellow-600' : 
                          index === 1 ? 'text-gray-600' : 'text-orange-600'
                        }`}>
                          #{index + 1}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                              {partnership.client.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <ArrowRight className="h-4 w-4 text-purple-500" />
                          <Avatar className="w-6 h-6">
                            <AvatarFallback className="bg-green-100 text-green-600 text-xs">
                              {partnership.provider.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </div>
                        <p className="font-medium text-sm">{partnership.client} ↔ {partnership.provider}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${partnership.value.toLocaleString()}</p>
                        <div className="flex items-center gap-1">
                          <Star className={`h-3 w-3 ${getSatisfactionColor(partnership.satisfaction)}`} />
                          <span className={`text-xs ${getSatisfactionColor(partnership.satisfaction)}`}>
                            {partnership.satisfaction.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Network Health
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Network Density</span>
                    <span className="text-sm font-bold text-purple-600">{stats.network_density}%</span>
                  </div>
                  <Progress value={stats.network_density} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Partnership Quality</span>
                    <span className="text-sm font-bold text-green-600">87%</span>
                  </div>
                  <Progress value={87} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Growth Potential</span>
                    <span className="text-sm font-bold text-blue-600">92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Stability Index</span>
                    <span className="text-sm font-bold text-yellow-600">85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                    <Input
                      placeholder="Search relationships..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="potential">Potential</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Relationships Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredRelationships.map((relationship) => (
              <motion.div
                key={relationship.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="hover:shadow-lg transition-shadow duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <Badge className={getRelationshipColor(relationship.relationship_type)}>
                        {relationship.relationship_type}
                      </Badge>
                      <div className="flex items-center gap-2">
                        {getTrendIcon(relationship.growth_trend)}
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStrengthColor(relationship.strength_score)}`}>
                          {relationship.strength_score}% strength
                        </span>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Partnership Connection */}
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        <Avatar>
                          <AvatarFallback className="bg-blue-100 text-blue-600">
                            {relationship.client_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{relationship.client_name}</p>
                          <p className="text-xs text-muted-foreground">Client</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1">
                        <ArrowRight className="h-4 w-4 text-purple-500" />
                        <Heart className="h-4 w-4 text-red-500" />
                        <ArrowRight className="h-4 w-4 text-purple-500" />
                      </div>
                      
                      <div className="flex items-center gap-2 flex-1">
                        <Avatar>
                          <AvatarFallback className="bg-green-100 text-green-600">
                            {relationship.provider_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-sm">{relationship.provider_name}</p>
                          <p className="text-xs text-muted-foreground">Provider</p>
                        </div>
                      </div>
                    </div>

                    {/* Key Metrics */}
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-lg font-bold text-green-600">
                          ${relationship.total_value.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">Value</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-blue-600">
                          {relationship.active_promoters}
                        </p>
                        <p className="text-xs text-muted-foreground">Promoters</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-purple-600">
                          {relationship.satisfaction_rating > 0 ? relationship.satisfaction_rating.toFixed(1) : 'N/A'}
                        </p>
                        <p className="text-xs text-muted-foreground">Rating</p>
                      </div>
                    </div>

                    {/* Service Categories */}
                    <div>
                      <p className="text-sm font-medium mb-2">Services</p>
                      <div className="flex flex-wrap gap-1">
                        {relationship.service_categories.map((category, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {category}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        Last interaction: {new Date(relationship.last_interaction).toLocaleDateString()}
                      </div>
                      <Button variant="ghost" size="sm" className="h-8">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Relationship Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Relationship type distribution</p>
                    <p className="text-sm">Chart integration pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Partnership Value Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Value growth over time</p>
                    <p className="text-sm">Chart integration pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Relationship Insights
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-green-800">Strong Partnership Growth</p>
                      <p className="text-sm text-green-600">
                        Your network has grown by 15.2% this quarter with 6 new potential partnerships identified.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-800">Optimization Opportunity</p>
                      <p className="text-sm text-blue-600">
                        Consider expanding services with Smart Pro Services - they show high performance across multiple clients.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-800">Attention Required</p>
                      <p className="text-sm text-yellow-600">
                        Two partnerships require attention to maintain satisfaction levels above 4.0 rating.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">Expand Tech Services</p>
                  <p className="text-xs text-muted-foreground">High demand in technology sector</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">Focus on Retention</p>
                  <p className="text-xs text-muted-foreground">Strengthen existing partnerships</p>
                </div>
                <div className="p-3 border rounded-lg">
                  <p className="font-medium text-sm">Cross-sell Opportunities</p>
                  <p className="text-xs text-muted-foreground">Identify additional service needs</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
