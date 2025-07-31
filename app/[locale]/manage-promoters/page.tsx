"use client"

import React, { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO, differenceInDays } from "date-fns"
import * as XLSX from "xlsx"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Switch } from "@/components/ui/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { SafeImage } from "@/components/ui/safe-image"
import { cn } from "@/lib/utils"
import { useFormContext } from "@/hooks/use-form-context"
import { AutoRefreshIndicator } from "@/components/ui/auto-refresh-indicator"
import ProtectedRoute from "@/components/protected-route"
import ExcelImportModal from "@/components/excel-import-modal"
import Link from "next/link"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

// Icons
import {
  Upload, Download, Search, MoreHorizontal, Eye, Edit3, Trash2, 
  UserPlus, FileSpreadsheet, FileText, AlertTriangle, CheckCircle, 
  XCircle, Clock, Users, TrendingUp, BarChart3, Activity, Loader2, 
  RefreshCw, Settings, Globe, CreditCard, Zap, Bell, Grid, List, Mail,
  PlusCircleIcon, ArrowLeftIcon, BriefcaseIcon, Filter, ArrowUpDown,
  ChevronUp, ChevronDown, Star, MessageSquare, Calendar, UserIcon,
  FileTextIcon, EyeIcon, EditIcon
} from "lucide-react"

// Types and Utils
import type { Promoter } from "@/lib/types"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { usePermissions, PermissionGuard } from "@/hooks/use-permissions"

// Enhanced Promoter Interface
interface EnhancedPromoter extends Promoter {
  id_card_status: "valid" | "expiring" | "expired" | "missing"
  passport_status: "valid" | "expiring" | "expired" | "missing"
  overall_status: "active" | "warning" | "critical" | "inactive"
  days_until_id_expiry?: number
  days_until_passport_expiry?: number
  active_contracts_count?: number
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

export default function ComprehensivePromoterManagement() {
  
  // State management
  const [promoters, setPromoters] = useState<EnhancedPromoter[]>([])
  const [filteredPromoters, setFilteredPromoters] = useState<EnhancedPromoter[]>([])
  const [selectedPromoters, setSelectedPromoters] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [currentView, setCurrentView] = useState<"table" | "grid">("table")
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState("all")
  const [documentFilter, setDocumentFilter] = useState("all")
  const [sortBy, setSortBy] = useState<"name" | "id_expiry" | "passport_expiry" | "contracts">("name")
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc")
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showStats, setShowStats] = useState(true)
  const [isExporting, setIsExporting] = useState(false)
  const [bulkActionLoading, setBulkActionLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)

  // Hooks
  const router = useRouter()
  const { toast } = useToast()
  const permissions = usePermissions()
  const { isFormActive } = useFormContext()
  const isMountedRef = useRef(true)



  // Helper functions
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

  // Enhanced data fetching with contract counts
  const fetchPromotersWithContractCount = useCallback(async () => {
    console.log("🔄 Starting fetchPromotersWithContractCount")
    
    if (isMountedRef.current) {
      setIsLoading(true)
      setError(null) // Clear any previous errors
    }

    try {
      const supabase = getSupabaseClient()
      console.log("🔄 Supabase client obtained")

      // Check if we got a mock client
      if (!supabase || typeof supabase.auth === 'undefined') {
        console.error("No valid Supabase client available")
        if (isMountedRef.current) {
          setError("Database connection not available. Please check your environment variables.")
          setIsLoading(false)
        }
        return
      }

      // Test authentication first
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError) {
        console.error("Authentication error:", authError)
        if (isMountedRef.current) {
          setError(`Authentication error: ${authError.message}`)
          setIsLoading(false)
        }
        return
      }
      
      if (!user) {
        console.error("No authenticated user")
        if (isMountedRef.current) {
          setError("No authenticated user")
          setIsLoading(false)
        }
        return
      }
      
      console.log("🔄 Authenticated user:", user.email)

      // Fetch promoters with contract count
      const { data: promotersData, error: promotersError } = await supabase
        .from("promoters")
        .select("*")
        .order("name_en")

      console.log("🔄 Promoters query result:", { data: promotersData, error: promotersError })

      if (promotersError) {
        console.error("Error fetching promoters:", promotersError)
        if (isMountedRef.current) {
          setError(`Failed to load promoters: ${promotersError.message}`)
          setIsLoading(false)
        }
        return
      }

      if (!promotersData) {
        console.log("🔄 No promoters data returned")
        if (isMountedRef.current) {
          setPromoters([])
          setIsLoading(false)
        }
        return
      }

      // Enhance promoter data with calculated fields
      const enhancedPromoters: EnhancedPromoter[] = promotersData.map((promoter: any) => {
        const idExpiryDays = promoter.id_card_expiry_date 
          ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date())
          : null

        const passportExpiryDays = promoter.passport_expiry_date
          ? differenceInDays(parseISO(promoter.passport_expiry_date), new Date())
          : null

        return {
          ...promoter,
          id_card_status: getDocumentStatusType(idExpiryDays, promoter.id_card_expiry_date),
          passport_status: getDocumentStatusType(passportExpiryDays, promoter.passport_expiry_date),
          overall_status: getOverallStatus(promoter),
          days_until_id_expiry: idExpiryDays || undefined,
          days_until_passport_expiry: passportExpiryDays || undefined,
          active_contracts_count: 0 // Default to 0 since we're not fetching contract counts
        }
      })

      console.log("🔄 Enhanced promoters:", enhancedPromoters.length)

      if (isMountedRef.current) {
        console.log("🔄 Setting promoters and stopping loading...")
        setPromoters(enhancedPromoters)
        setError(null)
        setIsLoading(false) // ✅ Explicitly set loading to false on success
        console.log("🔄 Loading state should now be false")
      }
    } catch (error) {
      console.error("Error in fetchPromotersWithContractCount:", error)
      if (isMountedRef.current) {
        setError(error instanceof Error ? error.message : "Failed to load promoters")
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [isMountedRef])

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
    const growth_rate = total > 0 ? ((active / total) * 100) : 0
    const engagement_score = total > 0 ? ((total_contracts / total) * 100) : 0

    return {
      total,
      active,
      expiring_documents,
      expired_documents,
      total_contracts,
      growth_rate,
      engagement_score
    }
  }, [promoters])

  // Calculate notification count
  const notificationCount = useMemo(() => {
    const expiringAlerts = promoters.filter(p => 
      (p.days_until_id_expiry !== undefined && p.days_until_id_expiry <= 30) ||
      (p.days_until_passport_expiry !== undefined && p.days_until_passport_expiry <= 30)
    ).length
    
    return expiringAlerts + 1 // +1 for system notifications
  }, [promoters])

  // Monitor loading state changes
  useEffect(() => {
    console.log("🔄 Loading state changed:", isLoading)
  }, [isLoading])

  // Monitor promoters state changes
  useEffect(() => {
    console.log("🔄 Promoters state changed:", promoters.length)
  }, [promoters.length])

  // Filter and sort promoters
  useEffect(() => {
    let filtered = promoters

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(promoter =>
        promoter.name_en?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.name_ar?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.id_card_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        promoter.notes?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Status filter
    if (filterStatus !== "all") {
      filtered = filtered.filter(promoter => promoter.overall_status === filterStatus)
    }

    // Document filter
    if (documentFilter !== "all") {
      filtered = filtered.filter(promoter => 
        promoter.id_card_status === documentFilter || promoter.passport_status === documentFilter
      )
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue: any, bValue: any

      switch (sortBy) {
        case "name":
          aValue = a.name_en || ""
          bValue = b.name_en || ""
          break
        case "id_expiry":
          aValue = a.days_until_id_expiry ?? Infinity
          bValue = b.days_until_id_expiry ?? Infinity
          break
        case "passport_expiry":
          aValue = a.days_until_passport_expiry ?? Infinity
          bValue = b.days_until_passport_expiry ?? Infinity
          break
        case "contracts":
          aValue = a.active_contracts_count || 0
          bValue = b.active_contracts_count || 0
          break
        default:
          aValue = a.name_en || ""
          bValue = b.name_en || ""
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1
      } else {
        return aValue < bValue ? 1 : -1
      }
    })

    setFilteredPromoters(filtered)
  }, [promoters, searchTerm, filterStatus, documentFilter, sortBy, sortOrder])

  // Event handlers
  const handleAddNew = () => {
    router.push("/en/manage-promoters/new")
  }

  const handleEdit = (promoter: Promoter) => {
    router.push(`/en/manage-promoters/${promoter.id}/edit`)
  }

  const handleBulkDelete = async () => {
    if (selectedPromoters.length === 0) return

    setBulkActionLoading(true)
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.from("promoters").delete().in("id", selectedPromoters)

      if (error) throw error

      toast({
        title: "Success",
        description: `Deleted ${selectedPromoters.length} promoters`,
        variant: "default",
      })

      setSelectedPromoters([])
      fetchPromotersWithContractCount()
    } catch (error) {
      console.error("Error deleting promoters:", error)
      toast({
        title: "Error",
        description: "Failed to delete promoters",
        variant: "destructive",
      })
    } finally {
      setBulkActionLoading(false)
    }
  }

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      await fetchPromotersWithContractCount()
      toast({
        title: "Refreshed",
        description: "Promoter data has been updated",
        variant: "default",
      })
    } catch (error) {
      console.error("Refresh failed:", error)
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh promoter data",
        variant: "destructive",
      })
    } finally {
      setIsRefreshing(false)
    }
  }

  // Fallback data fetching for basic promoter data
  const fetchBasicPromoters = useCallback(async () => {
    console.log("🔄 Starting fetchBasicPromoters (fallback)")
    
    if (isMountedRef.current) {
      setIsLoading(true)
      setError(null)
    }

    try {
      const supabase = getSupabaseClient()
      console.log("🔄 Supabase client obtained for fallback")

      // Check if we got a mock client
      if (!supabase || typeof supabase.auth === 'undefined') {
        console.error("No valid Supabase client available for fallback")
        if (isMountedRef.current) {
          setError("Database connection not available. Please check your environment variables.")
          setIsLoading(false)
        }
        return
      }

      const { data: promotersData, error } = await supabase
        .from("promoters")
        .select("*")
        .order("name_en")

      console.log("🔄 Fallback query result:", { data: promotersData, error })

      if (error) {
        console.error("Error in fallback fetch:", error)
        if (isMountedRef.current) {
          setError(`Failed to load promoters: ${error.message}`)
          setIsLoading(false)
        }
        return
      }

      if (!promotersData) {
        console.log("🔄 No promoters data in fallback")
        if (isMountedRef.current) {
          setPromoters([])
          setIsLoading(false)
        }
        return
      }

      // Basic enhancement without contract counts
      const basicEnhancedPromoters: EnhancedPromoter[] = promotersData.map((promoter: any) => {
        const idExpiryDays = promoter.id_card_expiry_date 
          ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date())
          : null

        const passportExpiryDays = promoter.passport_expiry_date
          ? differenceInDays(parseISO(promoter.passport_expiry_date), new Date())
          : null

        return {
          ...promoter,
          id_card_status: getDocumentStatusType(idExpiryDays, promoter.id_card_expiry_date),
          passport_status: getDocumentStatusType(passportExpiryDays, promoter.passport_expiry_date),
          overall_status: getOverallStatus(promoter),
          days_until_id_expiry: idExpiryDays || undefined,
          days_until_passport_expiry: passportExpiryDays || undefined,
          active_contracts_count: 0 // Default to 0 for fallback
        }
      })

      console.log("🔄 Basic enhanced promoters:", basicEnhancedPromoters.length)

      if (isMountedRef.current) {
        console.log("🔄 Setting basic promoters and stopping loading...")
        setPromoters(basicEnhancedPromoters)
        setError(null)
        setIsLoading(false) // ✅ Explicitly set loading to false on success
        console.log("🔄 Loading state should now be false")
      }
    } catch (error) {
      console.error("Error in fetchBasicPromoters:", error)
      if (isMountedRef.current) {
        setError(error instanceof Error ? error.message : "Failed to load promoters")
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false)
      }
    }
  }, [isMountedRef])



  const handleExport = async (promoterIds?: string[]) => {
    setIsExporting(true)
    try {
      const dataToExport = promoterIds 
        ? promoters.filter(p => promoterIds.includes(p.id))
        : filteredPromoters

      const exportData = dataToExport.map(promoter => ({
        "Name (EN)": promoter.name_en,
        "Name (AR)": promoter.name_ar,
        "ID Card Number": promoter.id_card_number,
        "Passport Number": promoter.passport_number || "",
        "Mobile Number": promoter.mobile_number || "",
        "Email": promoter.email || "",
        "Phone": promoter.phone || "",
        "ID Card Status": promoter.id_card_status,
        "ID Card Expiry": promoter.id_card_expiry_date || "N/A",
        "Passport Status": promoter.passport_status,
        "Passport Expiry": promoter.passport_expiry_date || "N/A",
        "Active Contracts": promoter.active_contracts_count || 0,
        "Overall Status": promoter.overall_status,
        "Created At": promoter.created_at
          ? format(parseISO(promoter.created_at), "yyyy-MM-dd")
          : "N/A",
        "Notes": promoter.notes || "",
      }))

      const ws = XLSX.utils.json_to_sheet(exportData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, "Promoters")
      
      const fileName = `promoters-export-${format(new Date(), "yyyy-MM-dd")}.xlsx`
      XLSX.writeFile(wb, fileName)

      toast({
        title: "Export Complete",
        description: `Exported ${exportData.length} promoters to Excel`,
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
  }

  const toggleSelectAll = () => {
    if (selectedPromoters.length === filteredPromoters.length) {
      setSelectedPromoters([])
    } else {
      setSelectedPromoters(filteredPromoters.map(p => p.id))
    }
  }

  const toggleSelectPromoter = (promoterId: string) => {
    setSelectedPromoters(prev => 
      prev.includes(promoterId) 
        ? prev.filter(id => id !== promoterId)
        : [...prev, promoterId]
    )
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />
      case "critical":
        return <XCircle className="h-4 w-4 text-red-500" />
      case "inactive":
        return <Clock className="h-4 w-4 text-gray-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "default"
      case "warning":
        return "secondary"
      case "critical":
        return "destructive"
      case "inactive":
        return "outline"
      default:
        return "outline"
    }
  }

  // Load data on mount with timeout protection
  useEffect(() => {
    console.log("🔄 useEffect triggered - starting data load")
    
    const loadData = async () => {
      console.log("🔄 loadData function called")
      try {
        console.log("🔄 Calling fetchPromotersWithContractCount")
        await fetchPromotersWithContractCount()
      } catch (error) {
        console.error("Main data fetching failed, trying fallback:", error)
        // Try fallback method
        try {
          console.log("🔄 Calling fetchBasicPromoters as fallback")
          await fetchBasicPromoters()
        } catch (fallbackError) {
          console.error("Fallback data fetching also failed:", fallbackError)
          if (isMountedRef.current) {
            setIsLoading(false)
            setError("Failed to load promoters. Please check your connection and try again.")
          }
        }
      }
    }
    
    loadData()
    
    // Add timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (isLoading && isMountedRef.current) {
        console.log("🔄 Loading timeout reached")
        setIsLoading(false)
        setError("Loading timeout - please refresh the page")
      }
    }, 10000) // 10 second timeout

    return () => {
      isMountedRef.current = false
      clearTimeout(timeout)
    }
  }, [fetchPromotersWithContractCount, fetchBasicPromoters]) // Add dependencies

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background px-4 py-8 sm:py-12">

        
        <div className="mx-auto max-w-screen-xl">
                     {/* Header */}
           <div className="mb-8 flex flex-col items-center justify-between gap-4 sm:flex-row">
             <div className="flex items-center gap-4">
               <h1 className="text-3xl font-bold text-card-foreground">
                 Comprehensive Promoter Management
               </h1>
               {isRefreshing && <RefreshCw className="h-5 w-5 animate-spin text-primary" />}
               <AutoRefreshIndicator />
               {/* Debug info */}
               <div className="text-xs text-muted-foreground">
                 {isLoading ? "Loading promoters..." : `Loaded: ${promoters.length} promoters`}
                 {error && (
                   <div className="text-red-500 ml-2">
                     <div>Error: {error}</div>
                     <div className="text-xs">Check environment variables and database connection</div>
                   </div>
                 )}
                 {!isLoading && !error && promoters.length === 0 && (
                   <div className="text-yellow-500 ml-2">
                     <div>No promoters found</div>
                     <div className="text-xs">Try importing data or check database connection</div>
                   </div>
                 )}
               </div>
             </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing || isLoading}
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
                onClick={handleAddNew}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                <PlusCircleIcon className="mr-2 h-5 w-5" />
                Add New Promoter
              </Button>
              <Button
                onClick={fetchBasicPromoters}
                variant="outline"
                size="sm"
                title="Debug: Load basic promoter data"
              >
                <Users className="mr-2 h-4 w-4" />
                Debug Load
              </Button>
              <Button
                onClick={async () => {
                  const supabase = getSupabaseClient()
                  console.log("🔧 Debug: Supabase client type:", typeof supabase)
                  console.log("🔧 Debug: Supabase client:", supabase)
                  console.log("🔧 Debug: Environment variables:", {
                    hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
                    hasKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
                  })
                  
                  // Test the client
                  if (supabase && supabase.auth) {
                    try {
                      const { data: { user }, error } = await supabase.auth.getUser()
                      console.log("🔧 Debug: Auth test result:", { user: user?.email, error })
                      
                      if (user) {
                        toast({
                          title: "✅ Environment OK",
                          description: `Authenticated as: ${user.email}`,
                        })
                      } else {
                        toast({
                          title: "⚠️ No User",
                          description: "Client works but no user authenticated",
                          variant: "destructive",
                        })
                      }
                    } catch (error) {
                      console.error("🔧 Debug: Auth test failed:", error)
                      toast({
                        title: "❌ Auth Test Failed",
                        description: "Check your environment variables",
                        variant: "destructive",
                      })
                    }
                  } else {
                    toast({
                      title: "❌ No Valid Client",
                      description: "Create .env.local with Supabase credentials",
                      variant: "destructive",
                    })
                  }
                }}
                variant="outline"
                size="sm"
                title="Debug: Check environment and client"
              >
                <Settings className="mr-2 h-4 w-4" />
                Debug Env
              </Button>
              <Button
                onClick={() => {
                  console.log("🔧 Debug: Current state:", {
                    isLoading,
                    promotersCount: promoters.length,
                    error
                  })
                  toast({
                    title: "Current State",
                    description: `Loading: ${isLoading}, Promoters: ${promoters.length}, Error: ${error || 'None'}`,
                  })
                }}
                variant="outline"
                size="sm"
                title="Debug: Check current state"
              >
                <Activity className="mr-2 h-4 w-4" />
                Debug State
              </Button>
              <Button
                onClick={async () => {
                  console.log("🔄 Test DB button clicked")
                  const supabase = getSupabaseClient()
                  
                  // Test authentication first
                  const { data: { user }, error: authError } = await supabase.auth.getUser()
                  if (authError) {
                    console.error("Auth test failed:", authError)
                    toast({
                      title: "Authentication Test Failed",
                      description: authError.message,
                      variant: "destructive",
                    })
                    return
                  }
                  
                  console.log("🔄 Auth test successful, user:", user?.email)
                  
                  // Test database connection
                  const { data, error } = await supabase
                    .from("promoters")
                    .select("id")
                    .limit(1)
                  
                  if (error) {
                    console.error("Database test failed:", error)
                    toast({
                      title: "Database Test Failed",
                      description: error.message,
                      variant: "destructive",
                    })
                  } else {
                    console.log("Database test successful:", data)
                    toast({
                      title: "Database Test Successful",
                      description: `Connection working. Found ${data?.length || 0} promoters`,
                      variant: "default",
                    })
                  }
                }}
                variant="outline"
                size="sm"
                title="Test database connection"
              >
                Test DB
              </Button>
            </div>
          </div>

          {/* Statistics Dashboard */}
          {showStats && (
            <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-7">
              <Card className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {stats.total}
                      </p>
                    </div>
                    <Users className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Active</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {stats.active}
                      </p>
                    </div>
                    <CheckCircle className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Expiring</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                        {stats.expiring_documents}
                      </p>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-red-50 to-red-100 dark:from-red-950 dark:to-red-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Expired</p>
                      <p className="text-2xl font-bold text-red-900 dark:text-red-100">
                        {stats.expired_documents}
                      </p>
                    </div>
                    <XCircle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Contracts</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        {stats.total_contracts}
                      </p>
                    </div>
                    <BriefcaseIcon className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Growth</p>
                      <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">
                        {stats.growth_rate.toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-indigo-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Engagement</p>
                      <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
                        {stats.engagement_score.toFixed(1)}%
                      </p>
                    </div>
                    <Activity className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Controls */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                {/* Search */}
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Search by name, ID, or notes..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <Label>Status Filter</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Document Filter */}
                <div className="space-y-2">
                  <Label>Document Filter</Label>
                  <Select value={documentFilter} onValueChange={setDocumentFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Documents" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Documents</SelectItem>
                      <SelectItem value="valid">Valid</SelectItem>
                      <SelectItem value="expiring">Expiring</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                      <SelectItem value="missing">Missing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Sort */}
                <div className="space-y-2">
                  <Label>Sort By</Label>
                  <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="id_expiry">ID Expiry</SelectItem>
                      <SelectItem value="passport_expiry">Passport Expiry</SelectItem>
                      <SelectItem value="contracts">Contract Count</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowStats(!showStats)}
                  >
                    {showStats ? "Hide" : "Show"} Stats
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport()}
                    disabled={isExporting}
                  >
                    <Download className="mr-1 h-3 w-3" />
                    Export All
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsNotificationCenterOpen(true)}
                    className="relative"
                  >
                    <Bell className="mr-1 h-3 w-3" />
                    Notifications
                    {notificationCount > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
                      >
                        {notificationCount}
                      </Badge>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bulk Actions Bar */}
          {selectedPromoters.length > 0 && (
            <Card className="mb-6 border-orange-200 bg-orange-50">
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
                      disabled={isExporting}
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
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleBulkDelete}
                      disabled={bulkActionLoading}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Selected
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
              ) : error ? (
                <div className="flex flex-col items-center justify-center h-64 p-8">
                  <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
                  <h3 className="text-lg font-semibold text-red-600 mb-2">Error Loading Promoters</h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">{error}</p>
                  <div className="flex gap-2">
                    <Button onClick={handleRefresh} variant="outline">
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Try Again
                    </Button>
                    <Button onClick={fetchBasicPromoters} variant="outline">
                      <Users className="mr-2 h-4 w-4" />
                      Load Basic Data
                    </Button>
                  </div>
                </div>
              ) : filteredPromoters.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 p-8">
                  <Users className="h-16 w-16 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">
                    {searchTerm || filterStatus !== "all" || documentFilter !== "all" 
                      ? "No promoters found" 
                      : "No promoters yet"}
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-4">
                    {searchTerm || filterStatus !== "all" || documentFilter !== "all"
                      ? "Try adjusting your search or filter criteria"
                      : "Get started by adding your first promoter"}
                  </p>
                  {!searchTerm && filterStatus === "all" && documentFilter === "all" && (
                    <Button onClick={handleAddNew}>
                      <PlusCircleIcon className="mr-2 h-4 w-4" />
                      Add First Promoter
                    </Button>
                  )}
                </div>
              ) : currentView === "table" ? (
                <div className="p-6">
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
                        <TableHead>ID Card</TableHead>
                        <TableHead>Passport</TableHead>
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
                              <div className="flex justify-end space-x-2">
                                <Button
                                  asChild
                                  variant="outline"
                                  size="sm"
                                >
                                  <Link href={`/en/manage-promoters/${promoter.id}`}>
                                    <EyeIcon className="mr-1 h-3 w-3" /> View
                                  </Link>
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleEdit(promoter)}
                                >
                                  <EditIcon className="mr-1 h-3 w-3" /> Edit
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem asChild>
                                      <Link href={`/en/manage-promoters/${promoter.id}`}>
                                        <EyeIcon className="mr-2 h-4 w-4" />
                                        View Details
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEdit(promoter)}>
                                      <EditIcon className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredPromoters.map((promoter) => {
                      const isSelected = selectedPromoters.includes(promoter.id)
                      return (
                        <Card key={promoter.id} className="relative">
                          <CardHeader className="pb-3">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center space-x-3">
                                <SafeImage
                                  src={promoter.profile_picture_url}
                                  alt={promoter.name_en}
                                  className="h-12 w-12 rounded-full"
                                  fallback={<UserIcon className="h-12 w-12 rounded-full bg-muted p-2" />}
                                />
                                <div>
                                  <div className="font-medium">{promoter.name_en}</div>
                                  <div className="text-sm text-muted-foreground">{promoter.name_ar}</div>
                                </div>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  checked={isSelected}
                                  onCheckedChange={() => toggleSelectPromoter(promoter.id)}
                                />
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem asChild>
                                      <Link href={`/en/manage-promoters/${promoter.id}`}>
                                        <EyeIcon className="mr-2 h-4 w-4" />
                                        View Details
                                      </Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEdit(promoter)}>
                                      <EditIcon className="mr-2 h-4 w-4" />
                                      Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem className="text-red-600">
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            {/* Document Status */}
                            <div className="grid grid-cols-2 gap-4">
                              <div className="text-center">
                                <div className="mb-1 text-xs text-muted-foreground">ID Card</div>
                                <div className="flex flex-col items-center">
                                  <Badge variant={promoter.id_card_status === "valid" ? "default" : "secondary"}>
                                    {promoter.id_card_status}
                                  </Badge>
                                  {promoter.days_until_id_expiry !== undefined && promoter.days_until_id_expiry <= 30 && (
                                    <span className="text-xs font-medium text-amber-600">
                                      {promoter.days_until_id_expiry}d left
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="text-center">
                                <div className="mb-1 text-xs text-muted-foreground">Passport</div>
                                <div className="flex flex-col items-center">
                                  <Badge variant={promoter.passport_status === "valid" ? "default" : "secondary"}>
                                    {promoter.passport_status}
                                  </Badge>
                                  {promoter.days_until_passport_expiry !== undefined && promoter.days_until_passport_expiry <= 30 && (
                                    <span className="text-xs font-medium text-amber-600">
                                      {promoter.days_until_passport_expiry}d left
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Contract Status */}
                            <div className="text-center">
                              <div className="mb-2 text-xs text-muted-foreground">Active Contracts</div>
                              <Badge
                                variant={promoter.active_contracts_count && promoter.active_contracts_count > 0 ? "default" : "secondary"}
                                className="text-sm"
                              >
                                <BriefcaseIcon className="mr-1.5 h-4 w-4" />
                                {promoter.active_contracts_count || 0}
                              </Badge>
                            </div>

                            {/* Overall Status */}
                            <div className="flex items-center justify-center space-x-2">
                              {getStatusIcon(promoter.overall_status)}
                              <Badge variant={getStatusBadgeVariant(promoter.overall_status)}>
                                {promoter.overall_status}
                              </Badge>
                            </div>

                            {/* Actions */}
                            <div className="flex space-x-2 pt-2">
                              <Button asChild variant="outline" size="sm" className="flex-1">
                                <Link href={`/en/manage-promoters/${promoter.id}`}>
                                  <EyeIcon className="mr-1 h-4 w-4" /> View
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEdit(promoter)}
                                className="flex-1"
                              >
                                <EditIcon className="mr-1 h-4 w-4" /> Edit
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      )
                    })}
                  </div>
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
                              <Button size="sm" asChild>
                                <Link href={`/en/manage-promoters/${promoter.id}`}>
                                  View
                                </Link>
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {promoters.filter(p => 
                    (p.days_until_id_expiry !== undefined && p.days_until_id_expiry <= 30) ||
                    (p.days_until_passport_expiry !== undefined && p.days_until_passport_expiry <= 30)
                  ).length === 0 && (
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="pt-3 pb-3">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <p className="text-sm text-green-800">No expiring documents</p>
                        </div>
                      </CardContent>
                    </Card>
                  )}
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

          {/* Excel Import Modal */}
          <ExcelImportModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onImportComplete={() => {
              fetchPromotersWithContractCount()
              setIsImportModalOpen(false)
            }}
          />
        </div>
      </div>
    </ProtectedRoute>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = "force-dynamic"