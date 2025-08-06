"use client"

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { 
  Upload, 
  Calendar,
  BarChart3,
  FileText,
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'

import { CompanyDocumentUpload } from './company-document-upload'
import { ExpiryTracker } from './expiry-tracker'

interface DocumentDashboardProps {
  companyId?: string
  userRole?: 'admin' | 'company' | 'user'
  showAllCompanies?: boolean
}

export function DocumentDashboard({
  companyId,
  userRole = 'company',
  showAllCompanies = false
}: DocumentDashboardProps) {
  const [activeTab, setActiveTab] = useState('upload')
  const [refreshKey, setRefreshKey] = useState(0)

  // Determine which features to show based on user role
  const isAdmin = userRole === 'admin'
  const canUpload = userRole === 'company' || userRole === 'admin'
  const canViewAll = isAdmin && showAllCompanies

  const handleUploadComplete = () => {
    // Refresh the expiry tracker when a new document is uploaded
    setRefreshKey(prev => prev + 1)
    // Switch to expiry tracker to show the uploaded document
    setActiveTab('expiry')
  }

  const dashboardTabs = [
    {
      value: 'upload',
      label: 'Upload Documents',
      icon: Upload,
      description: 'Upload and manage company documents',
      show: canUpload
    },
    {
      value: 'expiry',
      label: 'Expiry Tracking',
      icon: Calendar,
      description: 'Monitor document expiry dates',
      show: true
    },
    {
      value: 'analytics',
      label: 'Analytics',
      icon: BarChart3,
      description: 'Document statistics and insights',
      show: isAdmin
    }
  ].filter(tab => tab.show)

  return (
    <div className="space-y-6">
      {/* Dashboard Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
          <p className="text-muted-foreground">
            {canViewAll 
              ? 'Manage documents across all companies'
              : 'Upload, track, and manage your company documents'
            }
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Building2 className="h-3 w-3" />
            {canViewAll ? 'All Companies' : 'Company View'}
          </Badge>
          {userRole === 'admin' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Administrator
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats (for admin view) */}
      {isAdmin && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">1,234</div>
              <p className="text-xs text-muted-foreground">
                +12% from last month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">23</div>
              <p className="text-xs text-muted-foreground">
                Next 30 days
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Companies</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">156</div>
              <p className="text-xs text-muted-foreground">
                +3 new this month
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">94.2%</div>
              <p className="text-xs text-muted-foreground">
                +2.1% from last month
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {dashboardTabs.map((tab) => {
            const Icon = tab.icon
            return (
              <TabsTrigger 
                key={tab.value} 
                value={tab.value}
                className="flex items-center gap-2"
              >
                <Icon className="h-4 w-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </TabsTrigger>
            )
          })}
        </TabsList>

        {/* Upload Documents Tab */}
        {canUpload && (
          <TabsContent value="upload" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="h-5 w-5" />
                  Document Upload
                </CardTitle>
                <CardDescription>
                  Upload company documents including commercial registration, licenses, and certificates
                </CardDescription>
              </CardHeader>
              <CardContent>
                {companyId ? (
                  <CompanyDocumentUpload
                    companyId={companyId}
                    onUploadComplete={handleUploadComplete}
                    onError={(error) => console.error('Upload error:', error)}
                    maxFiles={5}
                    showPreview={true}
                  />
                ) : (
                  <div className="text-center py-8">
                    <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Company ID Required</h3>
                    <p className="text-muted-foreground">
                      Please select a company to upload documents
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Expiry Tracking Tab */}
        <TabsContent value="expiry" className="space-y-6">
          <ExpiryTracker
            key={refreshKey} // Force refresh when new documents are uploaded
            companyId={companyId}
            showAllCompanies={canViewAll}
            onDocumentUpdate={() => setRefreshKey(prev => prev + 1)}
            onNotificationSent={(documentId) => {
              console.log(`Notification sent for document: ${documentId}`)
            }}
          />
        </TabsContent>

        {/* Analytics Tab (Admin only) */}
        {isAdmin && (
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Document Type Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Document Distribution
                  </CardTitle>
                  <CardDescription>
                    Breakdown of documents by type across all companies
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { type: 'Commercial Registration', count: 156, percentage: 98 },
                      { type: 'Business License', count: 142, percentage: 89 },
                      { type: 'Tax Certificate', count: 134, percentage: 84 },
                      { type: 'Insurance', count: 98, percentage: 61 },
                      { type: 'Other Documents', count: 67, percentage: 42 }
                    ].map((item) => (
                      <div key={item.type} className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>{item.type}</span>
                          <span className="font-medium">{item.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <motion.div
                            className="bg-blue-600 h-2 rounded-full"
                            initial={{ width: 0 }}
                            animate={{ width: `${item.percentage}%` }}
                            transition={{ duration: 1, delay: 0.2 }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Expiry Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Expiry Timeline
                  </CardTitle>
                  <CardDescription>
                    Documents expiring in the coming months
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { period: 'Next 7 days', count: 5, color: 'bg-red-500' },
                      { period: 'Next 30 days', count: 18, color: 'bg-orange-500' },
                      { period: 'Next 90 days', count: 45, color: 'bg-yellow-500' },
                      { period: 'Next 6 months', count: 89, color: 'bg-blue-500' },
                      { period: 'Beyond 6 months', count: 234, color: 'bg-green-500' }
                    ].map((item) => (
                      <div key={item.period} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-3 h-3 rounded-full ${item.color}`} />
                          <span className="text-sm">{item.period}</span>
                        </div>
                        <Badge variant="outline">{item.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Compliance Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Compliance Trends
                  </CardTitle>
                  <CardDescription>
                    Company compliance score over time
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">94.2%</div>
                      <p className="text-sm text-muted-foreground">Overall Compliance Rate</p>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 text-center">
                      <div>
                        <div className="text-lg font-semibold text-green-600">147</div>
                        <p className="text-xs text-muted-foreground">Compliant</p>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-orange-600">9</div>
                        <p className="text-xs text-muted-foreground">At Risk</p>
                      </div>
                      <div>
                        <div className="text-lg font-semibold text-red-600">3</div>
                        <p className="text-xs text-muted-foreground">Non-Compliant</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Latest document uploads and updates
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { company: 'ABC Trading LLC', action: 'uploaded', document: 'Commercial Registration', time: '2 hours ago' },
                      { company: 'XYZ Construction', action: 'updated', document: 'Insurance Certificate', time: '4 hours ago' },
                      { company: 'Tech Solutions Inc', action: 'uploaded', document: 'Tax Certificate', time: '6 hours ago' },
                      { company: 'Green Energy Co', action: 'expired', document: 'Business License', time: '1 day ago' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div>
                          <p className="text-sm font-medium">{activity.company}</p>
                          <p className="text-xs text-muted-foreground">
                            {activity.action} {activity.document}
                          </p>
                        </div>
                        <span className="text-xs text-muted-foreground">{activity.time}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
