"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Users, 
  Building2,
  Calendar,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle
} from "lucide-react"

interface AnalyticsData {
  contracts: {
    total: number
    active: number
    pending: number
    expired: number
  }
  promoters: {
    total: number
    active: number
  }
  companies: {
    total: number
    active: number
  }
  growth: {
    contractsThisMonth: number
    promotersThisMonth: number
    companiesThisMonth: number
  }
}

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      setLoading(true)
      
      // Fetch data from multiple APIs
      const [contractsRes, promotersRes, companiesRes] = await Promise.all([
        fetch('/api/contracts').then(r => r.json()).catch(e => ({ success: false, error: e.message })),
        fetch('/api/promoters').then(r => r.json()).catch(e => ({ success: false, error: e.message })),
        fetch('/api/companies').then(r => r.json()).catch(e => ({ success: false, error: e.message }))
      ])

      const analytics: AnalyticsData = {
        contracts: {
          total: contractsRes.success ? (contractsRes.contracts?.length || 0) : 0,
          active: contractsRes.success ? (contractsRes.activeContracts || 0) : 0,
          pending: contractsRes.success ? (contractsRes.pendingContracts || 0) : 0,
          expired: 0
        },
        promoters: {
          total: promotersRes.success ? (promotersRes.promoters?.length || 0) : 0,
          active: promotersRes.success ? (promotersRes.promoters?.length || 0) : 0
        },
        companies: {
          total: companiesRes.success ? (companiesRes.companies?.length || 0) : 0,
          active: companiesRes.success ? (companiesRes.companies?.length || 0) : 0
        },
        growth: {
          contractsThisMonth: 0,
          promotersThisMonth: 0,
          companiesThisMonth: 0
        }
      }

      setData(analytics)
      setError(null)
    } catch (error) {
      console.error('Error fetching analytics:', error)
      setError('Failed to fetch analytics data')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
            <p className="text-muted-foreground">Contract management insights and reports</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Contract management insights and reports</p>
        </div>
        <Button>
          <BarChart3 className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* Error State */}
      {error && (
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center text-red-600">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
              <Button onClick={fetchAnalytics} className="ml-4" size="sm">
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.contracts.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{data?.growth.contractsThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.contracts.active || 0}</div>
            <p className="text-xs text-muted-foreground">
              {data?.contracts.total ? 
                Math.round((data.contracts.active / data.contracts.total) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Promoters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.promoters.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{data?.growth.promotersThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.companies.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{data?.growth.companiesThisMonth || 0} this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Contracts</CardTitle>
            <Activity className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data?.contracts.pending || 0}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contract Success Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.contracts.total ? 
                Math.round((data.contracts.active / data.contracts.total) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Active vs total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Processing Time</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.5 days</div>
            <p className="text-xs text-muted-foreground">From draft to active</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Placeholder */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Contract Status Distribution</CardTitle>
            <CardDescription>
              Breakdown of contracts by current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                <p>Chart visualization would go here</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Monthly Growth Trend</CardTitle>
            <CardDescription>
              Contract creation and completion trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[200px] flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-2" />
                <p>Growth chart would go here</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
