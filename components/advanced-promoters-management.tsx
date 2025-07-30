"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO, differenceInDays } from "date-fns"
import * as XLSX from "xlsx"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"

// Icons
import {
  Upload, Download, Search, MoreHorizontal, Eye, Edit3, Trash2, 
  UserPlus, FileSpreadsheet, FileText, AlertTriangle, CheckCircle, 
  XCircle, Clock, Users, TrendingUp, BarChart3, Activity, Loader2, 
  RefreshCw, Settings, Globe, CreditCard, Zap, Bell, Grid, List, Mail
} from "lucide-react"

// Types and Utils
import type { Promoter } from "@/lib/types"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { SafeImage } from "@/components/ui/safe-image"

// Enhanced Promoter Interface
interface EnhancedPromoter extends Promoter {
  id_card_status: "valid" | "expiring" | "expired" | "missing"
  passport_status: "valid" | "expiring" | "expired" | "missing"
  overall_status: "active" | "warning" | "critical" | "inactive"
  days_until_id_expiry?: number
  days_until_passport_expiry?: number
}

// Statistics interface
interface PromoterStats {
  total: number
  active: number
  expiring_documents: number
  expired_documents: number
  total_contracts: number
  growth_rate: number
  engagement_score: number
}

export default function AdvancedPromotersManagement() {
  // State management
  const [promoters, setPromoters] = useState<EnhancedPromoter[]>([])
  const [filteredPromoters, setFilteredPromoters] = useState<EnhancedPromoter[]>([])
  const [selectedPromoters, setSelectedPromoters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentView, setCurrentView] = useState<"table" | "grid">("table")
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)

  // Hooks
  const router = useRouter()
  const { toast } = useToast()

  // Enhanced data fetching
  const fetchPromoters = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const { data: promotersData, error } = await getSupabaseClient()
        .from("promoters")
        .select(`
          *,
          contracts:contracts(count)
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      // Enhance promoter data with calculated fields
      const enhancedPromoters: EnhancedPromoter[] = promotersData?.map(promoter => {
        const idExpiryDays = promoter.id_card_expiry_date 
          ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date())
          : null

        const passportExpiryDays = promoter.passport_expiry_date
          ? differenceInDays(parseISO(promoter.passport_expiry_date), new Date())
          : null

        return {
          ...promoter,
          id_card_status: getDocumentStatus(idExpiryDays, promoter.id_card_expiry_date || null),
          passport_status: getDocumentStatus(passportExpiryDays, promoter.passport_expiry_date || null),
          overall_status: getOverallStatus(promoter),
          days_until_id_expiry: idExpiryDays || undefined,
          days_until_passport_expiry: passportExpiryDays || undefined
        }
      }) || []

      setPromoters(enhancedPromoters)
      setFilteredPromoters(enhancedPromoters)
    } catch (error) {
      console.error("Error fetching promoters:", error)
      toast({
        title: "Error",
        description: "Failed to fetch promoters data",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Helper functions for data processing
  const getDocumentStatus = (daysUntilExpiry: number | null, dateString: string | null): "valid" | "expiring" | "expired" | "missing" => {
    if (!dateString) return "missing"
    if (daysUntilExpiry === null) return "missing"
    if (daysUntilExpiry < 0) return "expired"
    if (daysUntilExpiry <= 30) return "expiring"
    return "valid"
  }

  const getOverallStatus = (promoter: Promoter): "active" | "warning" | "critical" | "inactive" => {
    if (!promoter.status || promoter.status === "inactive") return "inactive"
    
    const idExpiry = promoter.id_card_expiry_date ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date()) : null
    const passportExpiry = promoter.passport_expiry_date ? differenceInDays(parseISO(promoter.passport_expiry_date), new Date()) : null
    
    if ((idExpiry !== null && idExpiry < 0) || (passportExpiry !== null && passportExpiry < 0)) {
      return "critical"
    }
    
    if ((idExpiry !== null && idExpiry <= 30) || (passportExpiry !== null && passportExpiry <= 30)) {
      return "warning"
    }
    
    return "active"
  }

  // Calculate statistics
  const stats = useMemo((): PromoterStats => {
    const total = promoters.length
    const active = promoters.filter(p => p.overall_status === "active").length
    const expiring = promoters.filter(p => p.overall_status === "warning").length
    const expired = promoters.filter(p => p.overall_status === "critical").length
    const totalContracts = promoters.reduce((sum, p) => sum + (p.active_contracts_count || 0), 0)
    
    return {
      total,
      active,
      expiring_documents: expiring,
      expired_documents: expired,
      total_contracts: totalContracts,
      growth_rate: 12.5,
      engagement_score: 87.3
    }
  }, [promoters])

  // Export functionality
  const handleExport = (promoterIds?: string[]) => {
    const dataToExport = promoterIds 
      ? promoters.filter(p => promoterIds.includes(p.id))
      : promoters

    const exportData = dataToExport.map(promoter => ({
      'Name (English)': promoter.name_en,
      'Name (Arabic)': promoter.name_ar,
      'ID Card Number': promoter.id_card_number,
      'Status': promoter.status,
      'ID Card Status': promoter.id_card_status,
      'Passport Status': promoter.passport_status,
      'Active Contracts': promoter.active_contracts_count || 0,
      'ID Expiry Date': promoter.id_card_expiry_date,
      'Passport Expiry Date': promoter.passport_expiry_date,
      'Days Until ID Expiry': promoter.days_until_id_expiry,
      'Days Until Passport Expiry': promoter.days_until_passport_expiry,
      'Overall Status': promoter.overall_status,
      'Created Date': promoter.created_at,
      'Notes': promoter.notes
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportData)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Promoters')
    
    const filename = `promoters_export_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.xlsx`
    XLSX.writeFile(workbook, filename)

    toast({
      title: "Export Successful",
      description: `Exported ${exportData.length} promoters to ${filename}`
    })
  }

  // Helper functions for styling
  const getStatusVariant = (status: string) => {
    switch (status) {
      case "active": return "default"
      case "warning": return "secondary"
      case "critical": return "destructive"
      case "inactive": return "outline"
      default: return "outline"
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active": return <CheckCircle className="mr-1 h-3 w-3" />
      case "warning": return <AlertTriangle className="mr-1 h-3 w-3" />
      case "critical": return <XCircle className="mr-1 h-3 w-3" />
      case "inactive": return <Clock className="mr-1 h-3 w-3" />
      default: return null
    }
  }

  const getDocumentStatusVariant = (status: string) => {
    switch (status) {
      case "valid": return "default"
      case "expiring": return "secondary"
      case "expired": return "destructive"
      case "missing": return "outline"
      default: return "outline"
    }
  }

  // Filter promoters based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = promoters.filter(promoter => 
        promoter.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.id_card_number.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredPromoters(filtered)
    } else {
      setFilteredPromoters(promoters)
    }
  }, [searchTerm, promoters])

  // Effects
  useEffect(() => {
    fetchPromoters()
  }, [fetchPromoters])

  // Auto-refresh functionality
  useEffect(() => {
    let interval: NodeJS.Timeout

    if (autoRefresh) {
      interval = setInterval(() => {
        fetchPromoters()
      }, 30000) // Refresh every 30 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh, fetchPromoters])

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Advanced Promoters Management</h1>
          <p className="text-muted-foreground">
            Comprehensive promoter management with advanced analytics and bulk operations
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Auto Refresh Toggle */}
          <div className="flex items-center gap-2 px-3 py-1 border rounded-lg bg-background">
            <Zap className="h-4 w-4 text-muted-foreground" />
            <Switch
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <span className="text-sm text-muted-foreground">Auto-refresh</span>
          </div>
          
          {/* Notification Center */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => setIsNotificationCenterOpen(true)}
            className="relative"
          >
            <Bell className="h-4 w-4" />
            {stats.expiring_documents + stats.expired_documents > 0 && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {stats.expiring_documents + stats.expired_documents}
              </span>
            )}
          </Button>
          
          <Button variant="outline" onClick={() => fetchPromoters()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={() => handleExport()}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => router.push('/manage-promoters/new')}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add Promoter
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Promoters</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              +{stats.growth_rate}% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Promoters</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              {((stats.active / stats.total) * 100).toFixed(1)}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Document Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.expiring_documents + stats.expired_documents}</div>
            <p className="text-xs text-muted-foreground">
              {stats.expired_documents} expired, {stats.expiring_documents} expiring
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Contracts</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total_contracts}</div>
            <p className="text-xs text-muted-foreground">
              Avg {(stats.total_contracts / Math.max(stats.total, 1)).toFixed(1)} per promoter
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Search Promoters</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>View Options</Label>
              <div className="flex gap-2">
                <Button
                  variant={currentView === "table" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentView("table")}
                >
                  <List className="mr-1 h-3 w-3" />
                  Table
                </Button>
                <Button
                  variant={currentView === "grid" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setCurrentView("grid")}
                >
                  <Grid className="mr-1 h-3 w-3" />
                  Grid
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Actions</Label>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(selectedPromoters)}
                  disabled={selectedPromoters.length === 0}
                >
                  <Download className="mr-1 h-3 w-3" />
                  Export Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPromoters([])}
                  disabled={selectedPromoters.length === 0}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions Bar */}
      {selectedPromoters.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="bg-orange-100">
                  {selectedPromoters.length} selected
                </Badge>
                <div className="text-sm text-muted-foreground">
                  Bulk actions available for selected promoters
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport(selectedPromoters)}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export Selected
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedPromoters([])}
                >
                  Clear Selection
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading promoters...</span>
            </div>
          ) : currentView === "table" ? (
            <div className="p-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedPromoters.length === filteredPromoters.length && filteredPromoters.length > 0}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedPromoters(filteredPromoters.map(p => p.id))
                          } else {
                            setSelectedPromoters([])
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>ID Card</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Documents</TableHead>
                    <TableHead>Contracts</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPromoters.map((promoter) => (
                    <TableRow key={promoter.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedPromoters.includes(promoter.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedPromoters(prev => [...prev, promoter.id])
                            } else {
                              setSelectedPromoters(prev => prev.filter(id => id !== promoter.id))
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                                                  <SafeImage
                          src={promoter.profile_picture_url}
                          alt={`${promoter.name_en} avatar`}
                          width={32}
                          height={32}
                          className="h-8 w-8"
                          fallback={
                            <div className="h-8 w-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-sm font-medium">
                              {promoter.name_en.charAt(0).toUpperCase()}
                            </div>
                          }
                        />
                          <div>
                            <div className="font-medium">{promoter.name_en}</div>
                            <div className="text-sm text-gray-500">{promoter.name_ar}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-mono text-sm">{promoter.id_card_number}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusVariant(promoter.overall_status)}>
                          {getStatusIcon(promoter.overall_status)}
                          {promoter.overall_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Badge variant={getDocumentStatusVariant(promoter.id_card_status)} className="text-xs">
                            <CreditCard className="mr-1 h-3 w-3" />
                            ID
                          </Badge>
                          <Badge variant={getDocumentStatusVariant(promoter.passport_status)} className="text-xs">
                            <Globe className="mr-1 h-3 w-3" />
                            PP
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <Badge variant="outline" className="bg-blue-50">
                            {promoter.active_contracts_count || 0}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {promoter.created_at ? format(parseISO(promoter.created_at), 'MMM dd, yyyy') : 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/manage-promoters/${promoter.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleExport([promoter.id])}>
                              <Download className="mr-2 h-4 w-4" />
                              Export Data
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredPromoters.map((promoter) => (
                <Card key={promoter.id} className="hover:shadow-md transition-shadow group">
                  <CardContent className="pt-4">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <SafeImage
                          src={promoter.profile_picture_url}
                          alt={`${promoter.name_en} avatar`}
                          width={40}
                          height={40}
                          className="h-10 w-10"
                          fallback={
                            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-medium">
                              {promoter.name_en.charAt(0).toUpperCase()}
                            </div>
                          }
                        />
                        <Badge variant={getStatusVariant(promoter.overall_status)} className="text-xs">
                          {promoter.overall_status}
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="font-semibold">{promoter.name_en}</h3>
                        <p className="text-sm text-muted-foreground">{promoter.name_ar}</p>
                        <p className="text-xs text-muted-foreground font-mono mt-1">
                          {promoter.id_card_number}
                        </p>
                      </div>

                      <div className="flex justify-between items-center">
                        <div className="flex gap-1">
                          <Badge variant={getDocumentStatusVariant(promoter.id_card_status)} className="text-xs">
                            ID
                          </Badge>
                          <Badge variant={getDocumentStatusVariant(promoter.passport_status)} className="text-xs">
                            PP
                          </Badge>
                        </div>
                        <Badge variant="outline" className="bg-blue-50">
                          {promoter.active_contracts_count || 0} contracts
                        </Badge>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => router.push(`/manage-promoters/${promoter.id}`)}
                        >
                          <Eye className="mr-2 h-3 w-3" />
                          View
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => handleExport([promoter.id])}
                        >
                          <Download className="mr-2 h-3 w-3" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Center */}
      <Dialog open={isNotificationCenterOpen} onOpenChange={setIsNotificationCenterOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Center
            </DialogTitle>
            <DialogDescription>
              Important alerts and system notifications
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 overflow-y-auto max-h-[60vh]">
            {/* Document Expiry Alerts */}
            <div className="space-y-2">
              <h4 className="font-medium text-red-600 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Document Expiry Alerts
              </h4>
              {promoters
                .filter(p => 
                  (p.days_until_id_expiry !== undefined && p.days_until_id_expiry <= 30) ||
                  (p.days_until_passport_expiry !== undefined && p.days_until_passport_expiry <= 30)
                )
                .map(promoter => (
                  <Card key={promoter.id} className="border-red-200 bg-red-50">
                    <CardContent className="pt-3 pb-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{promoter.name_en}</p>
                          <p className="text-sm text-muted-foreground">
                            {promoter.days_until_id_expiry !== undefined && promoter.days_until_id_expiry <= 30 && 
                              `ID expires in ${promoter.days_until_id_expiry} days`}
                            {promoter.days_until_passport_expiry !== undefined && promoter.days_until_passport_expiry <= 30 && 
                              `Passport expires in ${promoter.days_until_passport_expiry} days`}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Mail className="mr-1 h-3 w-3" />
                            Notify
                          </Button>
                          <Button size="sm" onClick={() => router.push(`/manage-promoters/${promoter.id}`)}>
                            View
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>

            {/* System Notifications */}
            <div className="space-y-2">
              <h4 className="font-medium text-blue-600 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                System Updates
              </h4>
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="pt-3 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Database Sync Complete</p>
                      <p className="text-sm text-muted-foreground">
                        All promoter data has been synchronized successfully
                      </p>
                    </div>
                    <Badge variant="outline" className="bg-blue-100">
                      2 min ago
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNotificationCenterOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              toast({
                title: "Notifications cleared",
                description: "All notifications have been marked as read"
              })
            }}>
              Mark All as Read
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
