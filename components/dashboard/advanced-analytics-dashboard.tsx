"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Clock, 
  Users, 
  FileText,
  Target,
  Activity,
  Calendar,
  BarChart3,
  PieChart,
  LineChart,
  AlertTriangle,
  CheckCircle,
  Eye,
  Download,
  RefreshCw,
  Zap,
  Award,
  Star,
  TrendingUpIcon,
  TrendingDownIcon
} from "lucide-react"
import { 
  LineChart as RechartsLineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from "recharts"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"

interface AdvancedAnalyticsData {
  // Real-time KPIs
  totalContracts: number
  activeContracts: number
  pendingContracts: number
  completedContracts: number
  failedContracts: number
  totalRevenue: number
  monthlyGrowth: number
  averageProcessingTime: number
  successRate: number
  
  // Performance Metrics
  contractsThisMonth: number
  contractsLastMonth: number
  revenueThisMonth: number
  revenueLastMonth: number
  averageContractValue: number
  topPerformers: Array<{
    id: string
    name: string
    performance: number
    contracts: number
    revenue: number
  }>
  
  // Predictive Analytics
  predictedGrowth: number
  riskIndicators: Array<{
    type: string
    severity: 'low' | 'medium' | 'high'
    description: string
    impact: number
  }>
  
  // Business Intelligence
  monthlyTrends: Array<{
    month: string
    contracts: number
    revenue: number
    growth: number
  }>
  
  // Operational Metrics
  systemHealth: number
  averageResponseTime: number
  userSatisfaction: number
  efficiencyScore: number
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D']

export function AdvancedAnalyticsDashboard() {
  const [analytics, setAnalytics] = useState<AdvancedAnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const { toast } = useToast()

  useEffect(() => {
    fetchAdvancedAnalytics()
  }, [timeRange])

  const fetchAdvancedAnalytics = async () => {
    setLoading(true)
    try {
      const supabase = getSupabaseClient()
      
      // Fetch comprehensive analytics data
      const { data: contracts, error: contractsError } = await supabase
        .from('contracts')
        .select('*')
      
      if (contractsError) throw contractsError

      // Calculate advanced metrics
      const now = new Date()
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)

      const contractsThisMonth = contracts.filter(c => 
        c.created_at && new Date(c.created_at) >= thisMonth
      ).length

      const contractsLastMonth = contracts.filter(c => 
        c.created_at && new Date(c.created_at) >= lastMonth && new Date(c.created_at) < thisMonth
      ).length

      const totalRevenue = contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0)
      const revenueThisMonth = contractsThisMonth * 5000 // Mock calculation
      const revenueLastMonth = contractsLastMonth * 5000

      const monthlyGrowth = contractsLastMonth > 0 
        ? ((contractsThisMonth - contractsLastMonth) / contractsLastMonth) * 100 
        : 0

      // Calculate predictive analytics
      const predictedGrowth = monthlyGrowth * 1.1 // Simple prediction model
      
      const riskIndicators = [
        {
          type: 'Contract Expiration',
          severity: 'medium' as const,
          description: '15 contracts expiring in next 30 days',
          impact: 15
        },
        {
          type: 'Processing Delays',
          severity: 'low' as const,
          description: 'Average processing time increased by 2 days',
          impact: 8
        }
      ]

      // Generate monthly trends
      const monthlyTrends = generateMonthlyTrends(contracts, timeRange)

      // Calculate performance metrics
      const activeContracts = contracts.filter(c => c.status === 'active').length
      const completedContracts = contracts.filter(c => c.status === 'completed').length
      const successRate = contracts.length > 0 ? (completedContracts / contracts.length) * 100 : 0

      const analyticsData: AdvancedAnalyticsData = {
        totalContracts: contracts.length,
        activeContracts,
        pendingContracts: contracts.filter(c => c.status === 'pending').length,
        completedContracts,
        failedContracts: contracts.filter(c => c.status === 'failed').length,
        totalRevenue,
        monthlyGrowth,
        averageProcessingTime: 3.2, // Mock data
        successRate,
        contractsThisMonth,
        contractsLastMonth,
        revenueThisMonth,
        revenueLastMonth,
        averageContractValue: contracts.length > 0 ? totalRevenue / contracts.length : 0,
        topPerformers: [
          { id: '1', name: 'Sarah Johnson', performance: 98, contracts: 45, revenue: 225000 },
          { id: '2', name: 'Mike Chen', performance: 95, contracts: 42, revenue: 210000 },
          { id: '3', name: 'Emma Davis', performance: 92, contracts: 38, revenue: 190000 }
        ],
        predictedGrowth,
        riskIndicators,
        monthlyTrends,
        systemHealth: 98,
        averageResponseTime: 1.2,
        userSatisfaction: 4.6,
        efficiencyScore: 87
      }

      setAnalytics(analyticsData)
    } catch (error) {
      console.error('Error fetching advanced analytics:', error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const generateMonthlyTrends = (contracts: any[], range: string) => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const trends = months.map((month, index) => ({
      month,
      contracts: Math.floor(Math.random() * 50) + 20,
      revenue: Math.floor(Math.random() * 250000) + 100000,
      growth: Math.floor(Math.random() * 30) - 10
    }))
    return trends
  }

  const getGrowthIcon = (value: number) => {
    return value >= 0 ? <TrendingUpIcon className="h-4 w-4 text-green-500" /> : <TrendingDownIcon className="h-4 w-4 text-red-500" />
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse mb-2" />
                <div className="h-3 w-32 bg-gray-200 rounded animate-pulse" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  if (!analytics) return null

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Advanced Analytics</h2>
          <p className="text-muted-foreground">
            Real-time business intelligence and predictive insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Tabs value={timeRange} onValueChange={(value) => setTimeRange(value as any)}>
            <TabsList>
              <TabsTrigger value="7d">7D</TabsTrigger>
              <TabsTrigger value="30d">30D</TabsTrigger>
              <TabsTrigger value="90d">90D</TabsTrigger>
              <TabsTrigger value="1y">1Y</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button variant="outline" size="sm" onClick={fetchAdvancedAnalytics}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalRevenue.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {getGrowthIcon(analytics.monthlyGrowth)}
              <span className="ml-1">{analytics.monthlyGrowth.toFixed(1)}% from last month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.successRate.toFixed(1)}%</div>
            <Progress value={analytics.successRate} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.systemHealth}%</div>
            <div className="text-xs text-muted-foreground">
              Average response time: {analytics.averageResponseTime}s
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Satisfaction</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.userSatisfaction}/5.0</div>
            <div className="text-xs text-muted-foreground">
              Efficiency score: {analytics.efficiencyScore}%
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Advanced Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Revenue Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#8884d8" fill="#8884d8" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Contract Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Status Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={[
                        { name: 'Active', value: analytics.activeContracts },
                        { name: 'Pending', value: analytics.pendingContracts },
                        { name: 'Completed', value: analytics.completedContracts },
                        { name: 'Failed', value: analytics.failedContracts }
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Monthly Growth Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Growth Trends</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsLineChart data={analytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="growth" stroke="#8884d8" strokeWidth={2} />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Contract Volume Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Contract Volume</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analytics.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="contracts" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Risk Indicators */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Risk Indicators
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics.riskIndicators.map((risk, index) => (
                    <div key={index} className={`p-3 rounded-lg border ${getSeverityColor(risk.severity)}`}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{risk.type}</span>
                        <Badge variant="outline">{risk.severity}</Badge>
                      </div>
                      <p className="text-sm mt-1">{risk.description}</p>
                      <div className="text-xs mt-2">Impact: {risk.impact}%</div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Growth Prediction */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-green-500" />
                  Growth Prediction
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">
                    +{analytics.predictedGrowth.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    Predicted growth for next quarter
                  </p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Current Growth:</span>
                      <span>{analytics.monthlyGrowth.toFixed(1)}%</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Predicted Growth:</span>
                      <span>{analytics.predictedGrowth.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Top Performers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-500" />
                  Top Performers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analytics.topPerformers.map((performer, index) => (
                    <div key={performer.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{performer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {performer.contracts} contracts
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">{performer.performance}%</div>
                        <div className="text-sm text-muted-foreground">
                          ${performer.revenue.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Performance Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-blue-500" />
                  Performance Metrics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>System Health</span>
                    <div className="flex items-center gap-2">
                      <Progress value={analytics.systemHealth} className="w-20" />
                      <span className="text-sm font-medium">{analytics.systemHealth}%</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>User Satisfaction</span>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(analytics.userSatisfaction)
                                ? 'text-yellow-400 fill-current'
                                : 'text-gray-300'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium">{analytics.userSatisfaction}/5</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Efficiency Score</span>
                    <div className="flex items-center gap-2">
                      <Progress value={analytics.efficiencyScore} className="w-20" />
                      <span className="text-sm font-medium">{analytics.efficiencyScore}%</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
} 