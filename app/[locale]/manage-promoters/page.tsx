"use client"

import React, { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO, differenceInDays } from "date-fns"
import Link from "next/link"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { SafeImage } from "@/components/ui/safe-image"
import { cn } from "@/lib/utils"
import ProtectedRoute from "@/components/protected-route"
import ExcelImportModal from "@/components/excel-import-modal"

// Icons
import {
  Search, MoreHorizontal, Eye, Edit3, Trash2, 
  UserPlus, FileSpreadsheet, RefreshCw, ArrowLeftIcon,
  PlusCircleIcon, BriefcaseIcon, UserIcon, Loader2,
  CheckCircle, AlertTriangle, XCircle, Clock, Building,
  Download
} from "lucide-react"

// Types and Utils
import type { Promoter } from "@/lib/types"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { usePermissions } from "@/hooks/use-permissions"

// Enhanced Promoter Interface
interface EnhancedPromoter extends Promoter {
  id_card_status: "valid" | "expiring" | "expired" | "missing"
  passport_status: "valid" | "expiring" | "expired" | "missing"
  overall_status: "active" | "warning" | "critical" | "inactive"
  days_until_id_expiry?: number
  days_until_passport_expiry?: number
  active_contracts_count?: number
  employer?: {
    id: string
    name_en: string
    name_ar: string
  } | null
}

// Statistics interface
interface PromoterStats {
  total: number
  active: number
  expiring_documents: number
  expired_documents: number
  total_contracts: number
  companies_count: number
}

// Page props interface
interface PromoterManagementProps {
  params: {
    locale: string
  }
}

export default function PromoterManagement({ params }: PromoterManagementProps) {
  const { locale } = params
  // Core state
  const [promoters, setPromoters] = useState<EnhancedPromoter[]>([])
  const [filteredPromoters, setFilteredPromoters] = useState<EnhancedPromoter[]>([])
  const [selectedPromoters, setSelectedPromoters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [isExporting, setIsExporting] = useState(false)

  // Bulk actions state
  const [showBulkCompanyModal, setShowBulkCompanyModal] = useState(false)
  const [selectedCompanyForBulk, setSelectedCompanyForBulk] = useState("")

  // Filter state
  const [searchTerm, setSearchTerm] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterCompany, setFilterCompany] = useState("all")
  const [filterDocument, setFilterDocument] = useState("all")

  // Hooks
  const router = useRouter()
  const { toast } = useToast()
  const permissions = usePermissions()

  // Helper functions
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A"
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return "Invalid Date"
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      })
    } catch (error) {
      return "Invalid Date"
    }
  }

  const getDocumentStatusType = (
    daysUntilExpiry: number | null,
    dateString: string | null,
  ): "valid" | "expiring" | "expired" | "missing" => {
    if (!dateString) return "missing"
    if (daysUntilExpiry === null) return "missing"
    if (daysUntilExpiry < 0) return "expired"
    if (daysUntilExpiry <= 30) return "expiring"
    return "valid"
  }

  const getOverallStatus = (promoter: Promoter): "active" | "warning" | "critical" | "inactive" => {
    if (!promoter.status || promoter.status === "inactive") return "inactive"

    const idExpiry = promoter.id_card_expiry_date
      ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date())
      : null
    const passportExpiry = promoter.passport_expiry_date
      ? differenceInDays(parseISO(promoter.passport_expiry_date), new Date())
      : null

    if ((idExpiry !== null && idExpiry < 0) || (passportExpiry !== null && passportExpiry < 0)) {
      return "critical"
    }

    if (
      (idExpiry !== null && idExpiry <= 30) ||
      (passportExpiry !== null && passportExpiry <= 30)
    ) {
      return "warning"
    }

    return "active"
  }

  // Data fetching
  const fetchPromoters = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const supabase = getSupabaseClient()
      
      if (!supabase) {
        throw new Error("Database connection not available")
      }

      // Test authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) {
        throw new Error("Authentication required")
      }



      // Fetch promoters without join first to avoid relationship issues
      const { data: promotersData, error: promotersError } = await supabase
        .from("promoters")
        .select("*")
        .order("name_en")

      if (promotersError) {
        console.error("Error fetching promoters:", promotersError)
        throw new Error(promotersError.message)
      }

      if (!promotersData) {
        setPromoters([])
        return
      }

      // Enhance promoter data with employer information
      const enhancedPromoters: EnhancedPromoter[] = await Promise.all(
        promotersData.map(async (promoter: any) => {
          const idExpiryDays = promoter.id_card_expiry_date 
            ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date())
            : null

          const passportExpiryDays = promoter.passport_expiry_date
            ? differenceInDays(parseISO(promoter.passport_expiry_date), new Date())
            : null

          // Fetch employer information if employer_id exists
          let employer = null
          if (promoter.employer_id) {
            try {
              const { data: employerData } = await supabase
                .from("parties")
                .select("id, name_en, name_ar")
                .eq("id", promoter.employer_id)
                .single()
              
              employer = employerData
            } catch (error) {
              console.warn(`Failed to fetch employer for promoter ${promoter.id}:`, error)
            }
          }

          return {
            ...promoter,
            id_card_status: getDocumentStatusType(idExpiryDays, promoter.id_card_expiry_date),
            passport_status: getDocumentStatusType(passportExpiryDays, promoter.passport_expiry_date),
            overall_status: getOverallStatus(promoter),
            days_until_id_expiry: idExpiryDays || undefined,
            days_until_passport_expiry: passportExpiryDays || undefined,
            active_contracts_count: 0,
            employer
          }
        })
      )



        setPromoters(enhancedPromoters)
    } catch (error) {
      console.error("Error in fetchPromoters:", error)
        setError(error instanceof Error ? error.message : "Failed to load promoters")
    } finally {
        setIsLoading(false)
    }
  }, [])

  // Load data on mount
  useEffect(() => {
    fetchPromoters()
  }, [fetchPromoters])

  // Get unique companies for filter
  const [employers, setEmployers] = useState<{ id: string; name_en: string; name_ar: string }[]>([])
  const [employersLoading, setEmployersLoading] = useState(true)

  // Fetch employers from parties table
  const fetchEmployers = useCallback(async () => {
    try {
      setEmployersLoading(true)
      const supabase = getSupabaseClient()
      
      if (!supabase) {
        throw new Error("Database connection not available")
      }

      const { data: employersData, error } = await supabase
        .from("parties")
        .select("id, name_en, name_ar")
        .eq("type", "Employer")
        .order("name_en")

      if (error) {
        console.error("Error fetching employers:", error)
        return
      }



      setEmployers(employersData || [])
    } catch (error) {
      console.error("Error fetching employers:", error)
    } finally {
      setEmployersLoading(false)
    }
  }, [])

  // Load employers on mount
  useEffect(() => {
    fetchEmployers()
  }, [fetchEmployers])

  // Get unique companies for filter
  const uniqueCompanies = useMemo(() => {
    return employers.map(employer => ({
      id: employer.id,
      name: employer.name_en || employer.name_ar || employer.id
    }))
  }, [employers])



  // Filter and sort promoters
  useEffect(() => {
    let filtered = promoters

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(promoter => {
        const searchLower = searchTerm.toLowerCase()
        
        // Basic promoter fields
        const nameMatch = 
          promoter.name_en?.toLowerCase().includes(searchLower) ||
          promoter.name_ar?.toLowerCase().includes(searchLower) ||
          promoter.id_card_number?.toLowerCase().includes(searchLower) ||
          promoter.passport_number?.toLowerCase().includes(searchLower)
        
        // Employer name search
        const employerMatch = promoter.employer ? 
          (promoter.employer.name_en?.toLowerCase().includes(searchLower) || 
           promoter.employer.name_ar?.toLowerCase().includes(searchLower)) : false
        
        return nameMatch || employerMatch
      })
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(promoter => promoter.overall_status === filterStatus)
    }

    // Company filter
    if (filterCompany !== "all") {
      filtered = filtered.filter(promoter => promoter.employer_id === filterCompany)
    }

    // Document filter
    if (filterDocument !== "all") {
      filtered = filtered.filter(promoter => {
        switch (filterDocument) {
          case "id_valid":
            return promoter.id_card_status === "valid"
          case "id_expiring":
            return promoter.id_card_status === "expiring"
          case "id_expired":
            return promoter.id_card_status === "expired"
          case "id_missing":
            return promoter.id_card_status === "missing"
          case "passport_valid":
            return promoter.passport_status === "valid"
          case "passport_expiring":
            return promoter.passport_status === "expiring"
          case "passport_expired":
            return promoter.passport_status === "expired"
          case "passport_missing":
            return promoter.passport_status === "missing"
        default:
            return true
        }
      })
    }

    setFilteredPromoters(filtered)
  }, [promoters, searchTerm, filterStatus, filterCompany, filterDocument])

  // Calculate statistics
  const stats = useMemo((): PromoterStats => {
    const total = promoters.length
    const active = promoters.filter(p => p.overall_status === "active").length
    const expiring_documents = promoters.filter(p => 
      p.id_card_status === "expiring" || p.passport_status === "expiring"
    ).length
    const expired_documents = promoters.filter(p => 
      p.id_card_status === "expired" || p.passport_status === "expired"
    ).length
    const total_contracts = promoters.reduce((sum, p) => sum + (p.active_contracts_count || 0), 0)
    const companies_count = uniqueCompanies.length

    return {
      total,
      active,
      expiring_documents,
      expired_documents,
      total_contracts,
      companies_count
    }
  }, [promoters, uniqueCompanies])

  // Action handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await fetchPromoters()
    setIsRefreshing(false)
  }, [fetchPromoters])

  const handleExportCSV = useCallback(async () => {
    setIsExporting(true)
    try {
      const csvData = filteredPromoters.map((promoter) => ({
        "Name (EN)": promoter.name_en || "N/A",
        "Name (AR)": promoter.name_ar || "N/A",
        "ID Card Number": promoter.id_card_number || "N/A",
        "Passport Number": promoter.passport_number || "N/A",
        "Mobile": promoter.mobile_number || "N/A",
        "Phone": promoter.phone || "N/A",
        "Email": promoter.email || "N/A",
        "Nationality": promoter.nationality || "N/A",
        "Date of Birth": promoter.date_of_birth ? format(parseISO(promoter.date_of_birth), "yyyy-MM-dd") : "N/A",
        "Gender": promoter.gender || "N/A",
        "Address": promoter.address || "N/A",
        "Emergency Contact": promoter.emergency_contact || "N/A",
        "Emergency Phone": promoter.emergency_phone || "N/A",
        "ID Card Status": promoter.id_card_status,
        "ID Card Expiry": promoter.id_card_expiry_date ? format(parseISO(promoter.id_card_expiry_date), "yyyy-MM-dd") : "N/A",
        "Passport Status": promoter.passport_status,
        "Passport Expiry": promoter.passport_expiry_date ? format(parseISO(promoter.passport_expiry_date), "yyyy-MM-dd") : "N/A",
        "Company": promoter.employer?.name_en || "N/A",
        "Job Title": promoter.job_title || "N/A",
        "Work Location": promoter.work_location || "N/A",
        "Status": promoter.status || "N/A",
        "Overall Status": promoter.overall_status,
        "Active Contracts": promoter.active_contracts_count || 0,
        "Notes": promoter.notes || "",
        "Created At": promoter.created_at ? format(parseISO(promoter.created_at), "yyyy-MM-dd") : "N/A",
      }))

      const csvContent = [
        Object.keys(csvData[0] || {}).join(","),
        ...csvData.map((row) =>
          Object.values(row)
            .map((val) => `"${val}"`)
            .join(","),
        ),
      ].join("\n")

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
      const link = document.createElement("a")
      link.href = URL.createObjectURL(blob)
      link.download = `promoters-export-${format(new Date(), "yyyy-MM-dd")}.csv`
      link.click()

      toast({
        title: "Export Complete",
        description: `Exported ${filteredPromoters.length} promoters to CSV`,
        variant: "default",
      })
    } catch (error) {
      console.error("Export error:", error)
      toast({
        title: "Export Failed",
        description: "Failed to export promoter data",
        variant: "destructive",
      })
    } finally {
      setIsExporting(false)
    }
  }, [filteredPromoters, toast])

  const handleDelete = useCallback(async (promoter: Promoter) => {
    if (!confirm(`Are you sure you want to delete promoter "${promoter.name_en}"?`)) {
      return
    }

    try {
      const supabase = getSupabaseClient()
      if (!supabase) {
        throw new Error("Database connection not available")
      }

      // Check if promoter has active contracts
      const { data: activeContracts, error: contractsError } = await supabase
        .from("contracts")
        .select("id")
        .eq("promoter_id", promoter.id)
        .eq("status", "active")

      if (contractsError) {
        throw new Error("Failed to check contracts")
      }

      if (activeContracts && activeContracts.length > 0) {
        toast({
          title: "Cannot delete promoter",
          description: `This promoter has ${activeContracts.length} active contract(s). Please terminate the contracts first.`,
          variant: "destructive"
        })
        return
      }

      // Delete related records first
      await supabase.from('promoter_skills').delete().eq('promoter_id', promoter.id)
      await supabase.from('promoter_experience').delete().eq('promoter_id', promoter.id)
      await supabase.from('promoter_education').delete().eq('promoter_id', promoter.id)
      await supabase.from('promoter_documents').delete().eq('promoter_id', promoter.id)
      
      // Delete the promoter
      const { error } = await supabase.from('promoters').delete().eq('id', promoter.id)

      if (error) {
        throw new Error(error.message)
      }

      await fetchPromoters()

      toast({
        title: "Promoter deleted",
        description: `Successfully deleted promoter "${promoter.name_en}"`
      })
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Failed to delete promoter",
        variant: "destructive"
      })
    }
  }, [fetchPromoters, toast])

  const toggleSelectAll = useCallback(() => {
    if (selectedPromoters.length === filteredPromoters.length) {
      setSelectedPromoters([])
    } else {
      setSelectedPromoters(filteredPromoters.map(p => p.id))
    }
  }, [selectedPromoters.length, filteredPromoters])

  const toggleSelectPromoter = useCallback((promoterId: string) => {
    setSelectedPromoters(prev => 
      prev.includes(promoterId) 
        ? prev.filter(id => id !== promoterId)
        : [...prev, promoterId]
    )
  }, [])

  const getStatusIcon = useCallback((status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />
      case "critical":
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <Clock className="h-4 w-4 text-gray-600" />
    }
  }, [])

  const getStatusBadgeVariant = useCallback((status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "warning":
        return "secondary"
      case "critical":
        return "destructive"
      default:
        return "outline"
    }
  }, [])

  // Bulk company assignment
  const handleBulkCompanyAssignment = useCallback(async () => {
    if (!selectedCompanyForBulk || selectedPromoters.length === 0) {
      toast({
        title: "No selection",
        description: "Please select a company and promoters to assign.",
        variant: "destructive",
      })
      return
    }

    setBulkActionLoading(true)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error("Database connection not available")

      const { error } = await supabase
        .from("promoters")
        .update({ employer_id: selectedCompanyForBulk })
        .in("id", selectedPromoters)

      if (error) {
        throw error
      }

      toast({
        title: "Company assigned",
        description: `Successfully assigned ${selectedPromoters.length} promoters to the selected company.`,
      })

      // Refresh data and clear selection
      setSelectedPromoters([])
      setSelectedCompanyForBulk("")
      setShowBulkCompanyModal(false)
      fetchPromoters()
    } catch (error) {
      console.error("Error assigning company:", error)
      toast({
        title: "Assignment failed",
        description: "Failed to assign company to promoters. Please try again.",
        variant: "destructive",
      })
    } finally {
      setBulkActionLoading(false)
    }
  }, [selectedPromoters, selectedCompanyForBulk, fetchPromoters, toast])

  // View and Edit handlers
  const handleView = useCallback((promoter: EnhancedPromoter) => {
    router.push(`/${locale}/manage-promoters/${promoter.id}`)
  }, [router, locale])

  const handleEdit = useCallback((promoter: EnhancedPromoter) => {
    router.push(`/${locale}/manage-promoters/${promoter.id}/edit`)
  }, [router, locale])

  const handleAddNew = useCallback(() => {
    router.push(`/${locale}/manage-promoters/new`)
  }, [router, locale])

  if (isLoading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-background px-4 py-8">
          <div className="mx-auto max-w-screen-xl">
            <div className="flex items-center justify-center h-64">
              <div className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span>Loading promoters...</span>
              </div>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background px-4 py-8">
        <div className="mx-auto max-w-screen-xl">
                     {/* Header */}
           <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div>
               <h1 className="text-3xl font-bold text-card-foreground">
                Promoter Management
               </h1>
              <p className="text-muted-foreground">
                Manage and monitor your promoters
              </p>
               </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                Refresh
              </Button>
              <Button asChild variant="outline">
                <Link href="/">
                  <ArrowLeftIcon className="mr-2 h-4 w-4" /> Back to Home
                </Link>
              </Button>
              <Button
                onClick={() => setIsImportModalOpen(true)}
                variant="outline"
                size="sm"
              >
                <FileSpreadsheet className="mr-2 h-4 w-4" />
                Import Excel
              </Button>
              <Button
                onClick={handleExportCSV}
                variant="outline"
                size="sm"
                disabled={isExporting || filteredPromoters.length === 0}
              >
                {isExporting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Download className="mr-2 h-4 w-4" />
                )}
                Export CSV
              </Button>
              <Button onClick={handleAddNew}>
                <PlusCircleIcon className="mr-2 h-4 w-4" />
                Add New Promoter
              </Button>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <Card className="mb-6 border-red-200 bg-red-50">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 text-red-800">
                  <AlertTriangle className="h-4 w-4" />
                  <span className="font-medium">Error: {error}</span>
                </div>
              <Button
                variant="outline"
                size="sm"
                  onClick={handleRefresh}
                  className="mt-2"
              >
                  Try Again
              </Button>
                </CardContent>
              </Card>
          )}

          {/* Statistics Cards */}
          <div className="grid grid-cols-1 gap-4 mb-6 sm:grid-cols-2 lg:grid-cols-6">
            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <UserIcon className="h-4 w-4 text-blue-600" />
                    <div>
                    <p className="text-2xl font-bold">{stats.total}</p>
                    <p className="text-xs text-muted-foreground">Total Promoters</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                    <p className="text-2xl font-bold">{stats.active}</p>
                    <p className="text-xs text-muted-foreground">Active</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <div>
                    <p className="text-2xl font-bold">{stats.expiring_documents}</p>
                    <p className="text-xs text-muted-foreground">Expiring</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <XCircle className="h-4 w-4 text-red-600" />
                    <div>
                    <p className="text-2xl font-bold">{stats.expired_documents}</p>
                    <p className="text-xs text-muted-foreground">Expired</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <BriefcaseIcon className="h-4 w-4 text-purple-600" />
                    <div>
                    <p className="text-2xl font-bold">{stats.total_contracts}</p>
                    <p className="text-xs text-muted-foreground">Contracts</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

            <Card>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-indigo-600" />
                    <div>
                    <p className="text-2xl font-bold">{stats.companies_count}</p>
                    <p className="text-xs text-muted-foreground">Companies</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>



          {/* Search and Filters */}
          <Card className="mb-6">
            <CardContent className="pt-4">
              <div className="space-y-4">
                {/* Search Bar */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="flex-1">
                    <Input
                      placeholder="Search by name, ID, passport, or company..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  
                  {selectedPromoters.length > 0 && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowBulkCompanyModal(true)}
                        disabled={bulkActionLoading}
                      >
                        <Building className="mr-2 h-4 w-4" />
                        Assign Company ({selectedPromoters.length})
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          selectedPromoters.forEach(id => {
                            const promoter = promoters.find(p => p.id === id);
                            if (promoter) {
                              handleDelete(promoter);
                            }
                          });
                        }}
                        disabled={bulkActionLoading}
                      >
                        {bulkActionLoading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="mr-2 h-4 w-4" />
                        )}
                        Delete Selected ({selectedPromoters.length})
                      </Button>
                    </div>
                  )}
                </div>

                {/* Filter Options */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {/* Status Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      aria-label="Filter by status"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="warning">Warning</option>
                      <option value="critical">Critical</option>
                      <option value="inactive">Inactive</option>
                    </select>
                </div>

                  {/* Company Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Company</label>
                    <select
                      value={filterCompany}
                      onChange={(e) => setFilterCompany(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      disabled={employersLoading}
                      aria-label="Filter by company"
                    >
                      <option value="all">
                        {employersLoading ? "Loading companies..." : "All Companies"}
                      </option>
                      {uniqueCompanies.map(company => (
                        <option key={company.id} value={company.id}>
                          {company.name}
                        </option>
                      ))}
                    </select>
                </div>

                  {/* Document Filter */}
                  <div>
                    <label className="text-sm font-medium mb-2 block">Document Status</label>
                    <select
                      value={filterDocument}
                      onChange={(e) => setFilterDocument(e.target.value)}
                      className="w-full px-3 py-2 border border-input rounded-md bg-background"
                      aria-label="Filter by document status"
                    >
                      <option value="all">All Documents</option>
                      <optgroup label="ID Card">
                        <option value="id_valid">ID - Valid</option>
                        <option value="id_expiring">ID - Expiring</option>
                        <option value="id_expired">ID - Expired</option>
                        <option value="id_missing">ID - Missing</option>
                      </optgroup>
                      <optgroup label="Passport">
                        <option value="passport_valid">Passport - Valid</option>
                        <option value="passport_expiring">Passport - Expiring</option>
                        <option value="passport_expired">Passport - Expired</option>
                        <option value="passport_missing">Passport - Missing</option>
                      </optgroup>
                    </select>
                </div>
              </div>

                {/* Active Filters Display */}
                {(filterStatus !== "all" || filterCompany !== "all" || filterDocument !== "all" || searchTerm) && (
                  <div className="flex flex-wrap gap-2">
                    {searchTerm && (
                      <Badge variant="secondary" className="gap-1">
                        Search: {searchTerm}
                        <button
                          onClick={() => setSearchTerm("")}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {filterStatus !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        Status: {filterStatus}
                        <button
                          onClick={() => setFilterStatus("all")}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {filterCompany !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        Company: {(() => {
                          const employer = employers.find(e => e.id === filterCompany)
                          return employer ? (employer.name_en || employer.name_ar || employer.id) : filterCompany
                        })()}
                        <button
                          onClick={() => setFilterCompany("all")}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                      </Badge>
                    )}
                    {filterDocument !== "all" && (
                      <Badge variant="secondary" className="gap-1">
                        Document: {filterDocument.replace("_", " ")}
                        <button
                          onClick={() => setFilterDocument("all")}
                          className="ml-1 hover:text-destructive"
                        >
                          ×
                        </button>
                    </Badge>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSearchTerm("")
                        setFilterStatus("all")
                        setFilterCompany("all")
                        setFilterDocument("all")
                      }}
                    >
                      Clear All Filters
                    </Button>
                  </div>
                )}
                </div>
              </CardContent>
            </Card>

          {/* Promoters Table */}
          {filteredPromoters.length === 0 ? (
          <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <UserIcon className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {searchTerm || filterStatus !== "all" 
                      ? "No promoters found" 
                      : "No promoters yet"}
                  </h3>
                <p className="text-muted-foreground text-center mb-4">
                  {searchTerm || filterStatus !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Get started by adding your first promoter"}
                  </p>
                {!searchTerm && filterStatus === "all" && (
                    <Button onClick={handleAddNew}>
                      <PlusCircleIcon className="mr-2 h-4 w-4" />
                      Add First Promoter
                    </Button>
                  )}
              </CardContent>
            </Card>
          ) : (
            <Card>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedPromoters.length === filteredPromoters.length && filteredPromoters.length > 0}
                            onCheckedChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Name</TableHead>
                    <TableHead>Company</TableHead>
                        <TableHead>ID Card</TableHead>
                        <TableHead>Passport</TableHead>
                        <TableHead>ID Expiry</TableHead>
                        <TableHead>Passport Expiry</TableHead>
                        <TableHead>Contracts</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPromoters.map((promoter) => {
                        const isSelected = selectedPromoters.includes(promoter.id)
                        return (
                          <TableRow key={promoter.id}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleSelectPromoter(promoter.id)}
                          />
                        </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-3">
                                <SafeImage
                                  src={promoter.profile_picture_url}
                                  alt={promoter.name_en}
                                  className="h-10 w-10 rounded-full"
                                  fallback={<UserIcon className="h-10 w-10 rounded-full bg-muted p-2" />}
                                />
                                <div>
                                  <div className="font-medium">{promoter.name_en}</div>
                                  <div className="text-sm text-muted-foreground">{promoter.name_ar}</div>
                                </div>
                              </div>
                            </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {promoter.employer ? (
                              promoter.employer.name_en || promoter.employer.name_ar || promoter.employer.id
                            ) : (
                              <span className="text-muted-foreground">Not assigned</span>
                            )}
                          </div>
                        </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Badge variant={promoter.id_card_status === "valid" ? "default" : "secondary"}>
                                  {promoter.id_card_status}
                                </Badge>
                                {promoter.days_until_id_expiry !== undefined && promoter.days_until_id_expiry <= 30 && (
                                  <span className="text-xs text-amber-600">
                                    {promoter.days_until_id_expiry}d
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <Badge variant={promoter.passport_status === "valid" ? "default" : "secondary"}>
                                  {promoter.passport_status}
                                </Badge>
                                {promoter.days_until_passport_expiry !== undefined && promoter.days_until_passport_expiry <= 30 && (
                                  <span className="text-xs text-amber-600">
                                    {promoter.days_until_passport_expiry}d
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(promoter.id_card_expiry_date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="text-sm">
                                {formatDate(promoter.passport_expiry_date)}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                <BriefcaseIcon className="h-4 w-4 text-muted-foreground" />
                                <span>{promoter.active_contracts_count || 0}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center space-x-2">
                                {getStatusIcon(promoter.overall_status)}
                                <Badge variant={getStatusBadgeVariant(promoter.overall_status)}>
                                  {promoter.overall_status}
                                </Badge>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                                <Button
                              variant="ghost"
                                  size="sm"
                              onClick={() => handleView(promoter)}
                                >
                              <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                              variant="ghost"
                                  size="sm"
                                  onClick={() => handleEdit(promoter)}
                                >
                              <Edit3 className="h-4 w-4" />
                                </Button>
                                <Button
                              variant="ghost"
                                  size="sm"
                                  onClick={() => handleDelete(promoter)}
                                >
                              <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                        </Card>
          )}

          {/* Excel Import Modal */}
          <ExcelImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportComplete={() => {
              console.log("Import completed, refreshing promoters data...")
              toast({
                title: "Import completed",
                description: "Refreshing promoter list...",
              })
              fetchPromoters()
              setIsImportModalOpen(false)
            }}
          />

          {/* Bulk Company Assignment Modal */}
          {showBulkCompanyModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
                <h3 className="text-lg font-semibold mb-4">Assign Company to {selectedPromoters.length} Promoters</h3>
                
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">Select Company</label>
                  <select
                    value={selectedCompanyForBulk}
                    onChange={(e) => setSelectedCompanyForBulk(e.target.value)}
                    className="w-full px-3 py-2 border border-input rounded-md bg-background"
                    disabled={employersLoading}
                    aria-label="Select company for bulk assignment"
                  >
                    <option value="">
                      {employersLoading ? "Loading companies..." : "Select a company..."}
                    </option>
                    {uniqueCompanies.map(company => (
                      <option key={company.id} value={company.id}>
                        {company.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowBulkCompanyModal(false)
                      setSelectedCompanyForBulk("")
                    }}
                    disabled={bulkActionLoading}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleBulkCompanyAssignment}
                    disabled={!selectedCompanyForBulk || bulkActionLoading}
                  >
                    {bulkActionLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Building className="mr-2 h-4 w-4" />
                    )}
                    Assign Company
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = "force-dynamic"