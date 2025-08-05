/**
 * Optimized Dashboard Component with Infinite Scroll and Performance Enhancements
 * Part of Critical Path Optimization Guide implementation
 */
'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { AlertCircle, TrendingUp, FileText, Clock, DollarSign, RefreshCw } from 'lucide-react'
import { useInfiniteContracts } from '@/lib/hooks/use-infinite-scroll'
import { useOptimizedAuth } from '@/lib/auth/optimized-auth-manager'
import { useBackgroundContractProcessor } from '@/lib/workers/background-contract-worker'
import { formatCurrency, formatDate } from '@/lib/utils/enhanced-utils'

interface DashboardOverview {
  totalContracts: number
  activeContracts: number
  pendingApprovals: number
  completedContracts: number
  totalRevenue: number
}

interface ContractItem {
  id: string
  contract_number: string
  status: string
  basic_salary: string
  currency: string
  created_at: string
  first_party: { name_en: string }
  second_party: { name_en: string }
  promoter?: { name_en: string }
}

export default function OptimizedDashboard() {
  // State management
  const [overview, setOverview] = useState<DashboardOverview | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  // Hooks
  const { getCurrentUser, hasPermission } = useOptimizedAuth()
  const { 
    batchGeneratePDFs, 
    getWorkerStatus,
    cleanupTempFiles 
  } = useBackgroundContractProcessor()

  // Debounced search query
  const debouncedSearchQuery = useMemo(() => {
    const timer = setTimeout(() => searchQuery, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Infinite scroll for contracts
  const {
    data: contracts,
    isLoading,
    isLoadingMore,
    hasMore,
    error,
    refresh: refreshContracts,
    ref: loadMoreRef
  } = useInfiniteContracts({
    searchQuery,
    filters: statusFilter && statusFilter !== 'all' ? { status: [statusFilter] } : {},
    enabled: true
  })

  // Fetch dashboard overview
  const fetchOverview = useCallback(async () => {
    try {
      const response = await fetch(`/api/dashboard/analytics/paginated?timeRange=${timeRange}`)
      if (response.ok) {
        const result = await response.json()
        setOverview(result.data)
        setLastUpdated(new Date())
      }
    } catch (error) {
      console.error('Failed to fetch overview:', error)
    }
  }, [timeRange])

  // Refresh all data
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        fetchOverview(),
        refreshContracts()
      ])
    } finally {
      setIsRefreshing(false)
    }
  }, [fetchOverview, refreshContracts])

  // Auto-refresh every 5 minutes
  useEffect(() => {
    fetchOverview()
    const interval = setInterval(fetchOverview, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchOverview])

  // Batch operations
  const handleBatchPDFGeneration = useCallback(async () => {
    const pendingContracts = (contracts as ContractItem[])
      .filter(c => c.status === 'pending' || c.status === 'approved')
      .map(c => c.id)
      .slice(0, 10) // Limit to 10 at a time

    if (pendingContracts.length === 0) {
      alert('No contracts available for PDF generation')
      return
    }

    try {
      await batchGeneratePDFs(pendingContracts, (progress, total) => {
        console.log(`PDF Generation Progress: ${progress}/${total}`)
      })
      
      alert(`PDF generation started for ${pendingContracts.length} contracts`)
      handleRefresh()
    } catch (error) {
      console.error('Batch PDF generation failed:', error)
      alert('Failed to start batch PDF generation')
    }
  }, [contracts, batchGeneratePDFs, handleRefresh])

  // Background cleanup
  useEffect(() => {
    const cleanup = async () => {
      try {
        await cleanupTempFiles(24 * 60 * 60 * 1000) // 24 hours
        console.log('Background cleanup completed')
      } catch (error) {
        console.error('Background cleanup failed:', error)
      }
    }

    // Run cleanup on mount and every hour
    cleanup()
    const interval = setInterval(cleanup, 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [cleanupTempFiles])

  // Render overview cards
  const renderOverviewCards = () => {
    if (!overview) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Contracts</p>
                <p className="text-2xl font-bold">{overview.totalContracts.toLocaleString()}</p>
              </div>
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Contracts</p>
                <p className="text-2xl font-bold text-green-600">{overview.activeContracts.toLocaleString()}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Pending Approvals</p>
                <p className="text-2xl font-bold text-yellow-600">{overview.pendingApprovals.toLocaleString()}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(overview.totalRevenue, 'SAR')}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // Render contract item
  const renderContractItem = (contract: ContractItem) => (
    <Card key={contract.id} className="mb-4 hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-semibold">{contract.contract_number}</h3>
              <Badge variant={
                contract.status === 'active' ? 'default' :
                contract.status === 'pending_approval' ? 'secondary' :
                contract.status === 'completed' ? 'outline' : 'destructive'
              }>
                {contract.status.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            
            <div className="text-sm text-muted-foreground space-y-1">
              <p><strong>Employer:</strong> {contract.first_party?.name_en || 'N/A'}</p>
              <p><strong>Employee:</strong> {contract.second_party?.name_en || 'N/A'}</p>
              {contract.promoter && (
                <p><strong>Promoter:</strong> {contract.promoter.name_en}</p>
              )}
              <p><strong>Created:</strong> {formatDate(contract.created_at)}</p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-semibold">
              {formatCurrency(parseFloat(contract.basic_salary) || 0, contract.currency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
            </SelectContent>
          </Select>
          
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {renderOverviewCards()}

      {/* Contracts Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Recent Contracts</CardTitle>
            <Button 
              onClick={handleBatchPDFGeneration}
              variant="outline"
              size="sm"
            >
              Batch Generate PDFs
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <Input
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="max-w-sm"
            />
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending_approval">Pending Approval</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contracts List */}
          {error && (
            <div className="flex items-center gap-2 text-red-600 mb-4">
              <AlertCircle className="h-4 w-4" />
              <span>Failed to load contracts: {error}</span>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-40 mb-2" />
                    <Skeleton className="h-4 w-60 mb-1" />
                    <Skeleton className="h-4 w-48" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <>
              {(contracts as ContractItem[]).map(renderContractItem)}
              
              {/* Load more trigger */}
              {hasMore && (
                <div ref={loadMoreRef} className="py-4 text-center">
                  {isLoadingMore ? (
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Loading more contracts...</span>
                    </div>
                  ) : (
                    <Button variant="outline" onClick={() => {}}>
                      Load More
                    </Button>
                  )}
                </div>
              )}
              
              {!hasMore && contracts.length > 0 && (
                <p className="text-center text-muted-foreground py-4">
                  No more contracts to load
                </p>
              )}
              
              {contracts.length === 0 && !isLoading && (
                <p className="text-center text-muted-foreground py-8">
                  No contracts found
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
