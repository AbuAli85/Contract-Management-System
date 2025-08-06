"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Calendar,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Percent,
  RefreshCw,
  Filter,
  Download,
  MoreVertical,
  Eye,
  Archive
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

import { ReportService } from '@/lib/report-service'

interface DashboardStats {
  total_companies: number
  active_companies: number
  total_documents: number
  active_documents: number
  expired_documents: number
  expiring_soon: number
  compliance_rate: number
  recent_activities: number
  trends: {
    companies_growth: number
    documents_growth: number
    compliance_change: number
  }
}

interface RecentReport {
  id: string
  title: string
  type: string
  generated_at: string
  generated_by: string
  status: 'completed' | 'generating' | 'failed'
  export_format: string[]
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentReports, setRecentReports] = useState<RecentReport[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d' | '1y'>('30d')
  const [refreshing, setRefreshing] = useState(false)

  const reportService = new ReportService()

  useEffect(() => {
    loadDashboardData()
  }, [timeRange])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Simulate loading dashboard stats
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setStats({
        total_companies: 156,
        active_companies: 142,
        total_documents: 2847,
        active_documents: 2651,
        expired_documents: 96,
        expiring_soon: 234,
        compliance_rate: 87.4,
        recent_activities: 48,
        trends: {
          companies_growth: 8.2,
          documents_growth: 12.5,
          compliance_change: -2.1
        }
      })

      setRecentReports([
        {
          id: '1',
          title: 'Monthly Compliance Report',
          type: 'document_compliance',
          generated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          generated_by: 'System Admin',
          status: 'completed',
          export_format: ['pdf', 'excel']
        },
        {
          id: '2',
          title: 'Company Overview - ABC Corp',
          type: 'company_overview',
          generated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
          generated_by: 'John Doe',
          status: 'completed',
          export_format: ['pdf']
        },
        {
          id: '3',
          title: 'Document Expiry Analysis',
          type: 'expiry_analysis',
          generated_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          generated_by: 'Jane Smith',
          status: 'generating',
          export_format: ['excel', 'csv']
        }
      ])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await loadDashboardData()
    setRefreshing(false)
  }

  const formatPercentage = (value: number, showSign: boolean = false) => {
    const sign = showSign && value > 0 ? '+' : ''
    return `${sign}${value.toFixed(1)}%`
  }

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    const diffInDays = Math.floor(diffInHours / 24)
    return `${diffInDays}d ago`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Real-time insights and reporting overview
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.total_companies}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                {formatPercentage(stats?.trends.companies_growth || 0, true)}
              </span>
              {' '}from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.active_documents}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">
                {formatPercentage(stats?.trends.documents_growth || 0, true)}
              </span>
              {' '}from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(stats?.compliance_rate || 0)}</div>
            <p className="text-xs text-muted-foreground">
              <span className={stats?.trends.compliance_change && stats.trends.compliance_change < 0 ? 'text-red-600' : 'text-green-600'}>
                {formatPercentage(stats?.trends.compliance_change || 0, true)}
              </span>
              {' '}from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.expired_documents}</div>
            <p className="text-xs text-muted-foreground">
              {stats?.expiring_soon} expiring soon
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="reports">Recent Reports</TabsTrigger>
          <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Company Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Company Status Distribution</CardTitle>
                <CardDescription>Current status of all registered companies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full" />
                      <span>Active</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{stats?.active_companies}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatPercentage((stats?.active_companies || 0) / (stats?.total_companies || 1) * 100)}
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={(stats?.active_companies || 0) / (stats?.total_companies || 1) * 100} 
                    className="h-2" 
                  />
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                      <span>Pending</span>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">{(stats?.total_companies || 0) - (stats?.active_companies || 0)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatPercentage(((stats?.total_companies || 0) - (stats?.active_companies || 0)) / (stats?.total_companies || 1) * 100)}
                      </div>
                    </div>
                  </div>
                  <Progress 
                    value={((stats?.total_companies || 0) - (stats?.active_companies || 0)) / (stats?.total_companies || 1) * 100} 
                    className="h-2" 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Document Health Status */}
            <Card>
              <CardHeader>
                <CardTitle>Document Health Status</CardTitle>
                <CardDescription>Overview of document compliance and expiry status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-green-600">{stats?.active_documents}</div>
                      <div className="text-sm text-muted-foreground">Active</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-orange-600">{stats?.expiring_soon}</div>
                      <div className="text-sm text-muted-foreground">Expiring</div>
                    </div>
                    <div className="space-y-2">
                      <div className="text-2xl font-bold text-red-600">{stats?.expired_documents}</div>
                      <div className="text-sm text-muted-foreground">Expired</div>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Overall Health</span>
                      <span>{formatPercentage((stats?.active_documents || 0) / (stats?.total_documents || 1) * 100)}</span>
                    </div>
                    <Progress value={(stats?.active_documents || 0) / (stats?.total_documents || 1) * 100} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Generate reports and perform common tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                  <Building2 className="h-6 w-6" />
                  <span>Company Report</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                  <FileText className="h-6 w-6" />
                  <span>Compliance Report</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                  <AlertTriangle className="h-6 w-6" />
                  <span>Expiry Analysis</span>
                </Button>
                <Button variant="outline" className="h-auto p-4 flex-col gap-2">
                  <TrendingUp className="h-6 w-6" />
                  <span>Activity Summary</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Reports</CardTitle>
              <CardDescription>View and manage recently generated reports</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Title</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Generated By</TableHead>
                    <TableHead>Generated</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium">{report.title}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {report.type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>{report.generated_by}</TableCell>
                      <TableCell>{formatTimeAgo(report.generated_at)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          report.status === 'completed' ? 'default' :
                          report.status === 'generating' ? 'secondary' : 'destructive'
                        }>
                          {report.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                              <Eye className="mr-2 h-4 w-4" />
                              View Report
                            </DropdownMenuItem>
                            {report.status === 'completed' && (
                              <>
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download PDF
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  <Download className="mr-2 h-4 w-4" />
                                  Download Excel
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem>
                              <Archive className="mr-2 h-4 w-4" />
                              Archive
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-red-500" />
                  Critical Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 border border-red-200 rounded-lg bg-red-50">
                    <div>
                      <p className="font-medium text-red-900">Documents Expired</p>
                      <p className="text-sm text-red-700">{stats?.expired_documents} documents have expired</p>
                    </div>
                    <Badge variant="destructive">{stats?.expired_documents}</Badge>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 border border-orange-200 rounded-lg bg-orange-50">
                    <div>
                      <p className="font-medium text-orange-900">Documents Expiring Soon</p>
                      <p className="text-sm text-orange-700">{stats?.expiring_soon} documents expiring within 30 days</p>
                    </div>
                    <Badge variant="secondary">{stats?.expiring_soon}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-500" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Database Status</span>
                    <Badge variant="default">Healthy</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Storage Usage</span>
                    <Badge variant="outline">67% Used</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>API Response Time</span>
                    <Badge variant="default">Fast</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last Backup</span>
                    <Badge variant="outline">2 hours ago</Badge>
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
