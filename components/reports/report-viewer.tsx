"use client"

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BarChart3,
  PieChart,
  TrendingUp,
  Download,
  Share,
  Filter,
  Calendar,
  Building2,
  FileText,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  DollarSign,
  Percent
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

import {
  type CompanyOverviewData,
  type DocumentComplianceData,
  type ExpiryAnalysisData,
  type ActivitySummaryData
} from '@/lib/report-service'

interface ReportViewerProps {
  reportType: 'company_overview' | 'document_compliance' | 'expiry_analysis' | 'activity_summary'
  data: CompanyOverviewData | DocumentComplianceData | ExpiryAnalysisData | ActivitySummaryData
  config?: {
    includeCharts?: boolean
    includeDetails?: boolean
    format?: string
  }
  onExport?: (format: string) => void
  onShare?: () => void
}

export function ReportViewer({
  reportType,
  data,
  config = { includeCharts: true, includeDetails: true },
  onExport,
  onShare
}: ReportViewerProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  const renderCompanyOverview = (data: CompanyOverviewData) => (
    <div className="space-y-6">
      {/* Company Info Header */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-2xl">{data.company.company_name}</CardTitle>
              <CardDescription>
                CR: {data.company.cr_number} • {data.company.business_type}
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {data.company.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p><strong>Email:</strong> {data.company.contact_email}</p>
              <p><strong>Phone:</strong> {data.company.phone_number}</p>
              <p><strong>Registration Date:</strong> {new Date(data.company.registration_date).toLocaleDateString()}</p>
            </div>
            <div>
              <p><strong>Address:</strong> {data.company.address}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.documents.total}</div>
            <p className="text-xs text-muted-foreground">
              {data.documents.active} active, {data.documents.expired} expired
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatPercentage(data.documents.compliance_score)}
            </div>
            <Progress value={data.documents.compliance_score} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.contracts.active}</div>
            <p className="text-xs text-muted-foreground">
              {data.contracts.total} total contracts
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contract Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.contracts.total_value)}</div>
            <p className="text-xs text-muted-foreground">
              Total contract value
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Sections */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="contracts">Contracts</TabsTrigger>
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document Status by Type</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(data.documents.by_type).map(([type, count]) => (
                  <div key={type} className="flex items-center justify-between">
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contracts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Contract Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-2xl font-bold text-green-600">{data.contracts.active}</div>
                  <p className="text-sm text-muted-foreground">Active</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{data.contracts.completed}</div>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
                <div>
                  <div className="text-2xl font-bold text-orange-600">{data.contracts.pending}</div>
                  <p className="text-sm text-muted-foreground">Pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.recent_activity.map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">{activity.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  const renderDocumentCompliance = (data: DocumentComplianceData) => (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_companies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliant</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.summary.compliant_companies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Non-Compliant</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.summary.non_compliant_companies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Percent className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercentage(data.summary.compliance_rate)}</div>
            <Progress value={data.summary.compliance_rate} className="mt-2" />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Tables */}
      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies">By Company</TabsTrigger>
          <TabsTrigger value="documents">By Document Type</TabsTrigger>
        </TabsList>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Company Compliance Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Company</TableHead>
                    <TableHead>CR Number</TableHead>
                    <TableHead>Compliance Score</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Missing Documents</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.by_company.map((company, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{company.company_name}</TableCell>
                      <TableCell>{company.cr_number}</TableCell>
                      <TableCell>{formatPercentage(company.compliance_score)}</TableCell>
                      <TableCell>
                        <Badge variant={
                          company.status === 'compliant' ? 'default' :
                          company.status === 'partial' ? 'secondary' : 'destructive'
                        }>
                          {company.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {company.missing_documents.length > 0 ? (
                          <div className="space-y-1">
                            {company.missing_documents.map((doc, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {doc.replace('_', ' ')}
                              </Badge>
                            ))}
                          </div>
                        ) : (
                          <span className="text-green-600">None</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Document Type Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Total Required</TableHead>
                    <TableHead>Total Submitted</TableHead>
                    <TableHead>Submission Rate</TableHead>
                    <TableHead>Expired</TableHead>
                    <TableHead>Expiring</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.by_document_type.map((docType, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium capitalize">
                        {docType.document_type.replace('_', ' ')}
                      </TableCell>
                      <TableCell>{docType.total_required}</TableCell>
                      <TableCell>{docType.total_submitted}</TableCell>
                      <TableCell>{formatPercentage(docType.submission_rate)}</TableCell>
                      <TableCell>
                        <Badge variant={docType.expired_count > 0 ? 'destructive' : 'outline'}>
                          {docType.expired_count}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={docType.expiring_count > 0 ? 'secondary' : 'outline'}>
                          {docType.expiring_count}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  const renderExpiryAnalysis = (data: ExpiryAnalysisData) => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_documents}</div>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{data.summary.expired}</div>
          </CardContent>
        </Card>

        <Card className="border-orange-200 bg-orange-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next 7 Days</CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.summary.expiring_7_days}</div>
          </CardContent>
        </Card>

        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next 30 Days</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{data.summary.expiring_30_days}</div>
          </CardContent>
        </Card>

        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Next 90 Days</CardTitle>
            <Calendar className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.summary.expiring_90_days}</div>
          </CardContent>
        </Card>
      </div>

      {/* Company Risk Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Company Risk Analysis</CardTitle>
          <CardDescription>Companies sorted by risk level</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company</TableHead>
                <TableHead>Expired Documents</TableHead>
                <TableHead>Expiring Soon</TableHead>
                <TableHead>Risk Level</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.by_company
                .sort((a, b) => {
                  const riskOrder = { critical: 4, high: 3, medium: 2, low: 1 }
                  return riskOrder[b.risk_level] - riskOrder[a.risk_level]
                })
                .map((company, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{company.company_name}</TableCell>
                  <TableCell>
                    <Badge variant="destructive">{company.expired_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{company.expiring_soon_count}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={
                      company.risk_level === 'critical' ? 'destructive' :
                      company.risk_level === 'high' ? 'destructive' :
                      company.risk_level === 'medium' ? 'secondary' : 'outline'
                    }>
                      {company.risk_level}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )

  const renderActivitySummary = (data: ActivitySummaryData) => (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.summary.total_activities}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Companies</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{data.summary.new_companies}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">New Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{data.summary.new_documents}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Document Updates</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{data.summary.document_updates}</div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Details */}
      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTrigger value="timeline">Activity Timeline</TabsTrigger>
          <TabsTrigger value="companies">Top Companies</TabsTrigger>
          <TabsTrigger value="types">Activity Types</TabsTrigger>
        </TabsList>

        <TabsContent value="timeline">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.activities.slice(0, 10).map((activity, index) => (
                  <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <div className="flex-1">
                      <p className="font-medium">{activity.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.company_name && `${activity.company_name} • `}
                        {new Date(activity.date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge variant="outline">{activity.type}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="companies">
          <Card>
            <CardHeader>
              <CardTitle>Most Active Companies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.trends.top_companies.map((company, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="font-medium">{company.company_name}</span>
                    <Badge variant="outline">{company.activity_count} activities</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types">
          <Card>
            <CardHeader>
              <CardTitle>Activity Type Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.trends.activity_types.map((type, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize">{type.type.replace('_', ' ')}</span>
                      <span>{type.count} ({formatPercentage(type.percentage)})</span>
                    </div>
                    <Progress value={type.percentage} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {reportType.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')} Report
          </h1>
          <p className="text-muted-foreground">
            Generated on {new Date().toLocaleDateString()}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => onExport?.('pdf')}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => onExport?.('excel')}>
            <Download className="h-4 w-4 mr-2" />
            Export Excel
          </Button>
          <Button variant="outline" onClick={onShare}>
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Report Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {reportType === 'company_overview' && renderCompanyOverview(data as CompanyOverviewData)}
        {reportType === 'document_compliance' && renderDocumentCompliance(data as DocumentComplianceData)}
        {reportType === 'expiry_analysis' && renderExpiryAnalysis(data as ExpiryAnalysisData)}
        {reportType === 'activity_summary' && renderActivitySummary(data as ActivitySummaryData)}
      </motion.div>
    </div>
  )
}
