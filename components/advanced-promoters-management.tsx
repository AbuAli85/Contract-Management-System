"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { format, parseISO, differenceInDays, isPast, isValid } from "date-fns"
import * as XLSX from "xlsx"
import Papa from "papaparse"
import dynamic from "next/dynamic"
import { QRCodeSVG } from "qrcode.react"

// UI Components
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DataTable } from "@/components/ui/data-table"
import { ColumnDef } from "@tanstack/react-table"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// Icons
import {
  Upload,
  Download,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  Edit3,
  Trash2,
  UserPlus,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  Clock,
  Users,
  TrendingUp,
  BarChart3,
  PieChart,
  Activity,
  Loader2,
  RefreshCw,
  ArrowUpDown,
  SortAsc,
  SortDesc,
  Settings,
  Globe,
  Flag,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileImage,
  Shield,
  ShieldAlert,
  Archive,
  Plus,
  Minus,
  ChevronDown,
  ExternalLink,
  Copy,
  Share2,
  Star,
  MessageSquare,
  History,
  Download as DownloadIcon,
  Upload as UploadIcon,
  Zap,
  Target,
  Bell,
  BookOpen,
  Briefcase,
  Camera,
  QrCode,
  Send,
  UserCheck,
  UserX,
  Layers,
  Grid,
  List,
  Filter as FilterIcon,
  SortAsc as SortIcon,
  MonitorPlay,
  Smartphone,
  Tablet,
  Layout,
  Save,
  Printer,
  Bookmark,
  Tag,
  Workflow,
  Gauge,
} from "lucide-react"

// Types and Utils
import type { Promoter } from "@/lib/types"
import { getSupabaseClient } from "@/lib/supabase"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { SafeImage } from "@/components/ui/safe-image"

// Enhanced Promoter Interface with additional calculated fields
interface EnhancedPromoter extends Promoter {
  id_card_status: "valid" | "expiring" | "expired" | "missing"
  passport_status: "valid" | "expiring" | "expired" | "missing"
  overall_status: "active" | "warning" | "critical" | "inactive"
  days_until_id_expiry?: number
  days_until_passport_expiry?: number
  contracts_trend?: "up" | "down" | "stable"
  last_contract_date?: string
  avatar_url?: string
  tags?: string[]
}

// Bulk operation types
interface BulkOperation {
  type: "status_update" | "delete" | "export" | "notification_settings"
  data?: any
}

interface ImportProgress {
  total: number
  processed: number
  success: number
  errors: string[]
}

// Filter and sort options
interface FilterOptions {
  status: string[]
  id_card_status: string[]
  passport_status: string[]
  active_contracts: [number, number]
  created_date_range: [Date | null, Date | null]
  search: string
  tags: string[]
}

interface SortOption {
  field: keyof EnhancedPromoter
  direction: "asc" | "desc"
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
  const [isImporting, setIsImporting] = useState(false)
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null)

  // Filter and sort state
  const [filters, setFilters] = useState<FilterOptions>({
    status: [],
    id_card_status: [],
    passport_status: [],
    active_contracts: [0, 50],
    created_date_range: [null, null],
    search: "",
    tags: [],
  })
  const [sortOption, setSortOption] = useState<SortOption>({ field: "name_en", direction: "asc" })

  // Modal and dialog states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [isBulkActionModalOpen, setIsBulkActionModalOpen] = useState(false)
  const [isQuickEditModalOpen, setIsQuickEditModalOpen] = useState(false)
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false)
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false)
  const [bulkOperation, setBulkOperation] = useState<BulkOperation>({ type: "status_update" })
  const [selectedPromoterForEdit, setSelectedPromoterForEdit] = useState<EnhancedPromoter | null>(
    null,
  )

  // View state
  const [currentView, setCurrentView] = useState<"table" | "grid" | "analytics">("table")
  const [pageSize, setPageSize] = useState(25)
  const [currentPage, setCurrentPage] = useState(1)
  const [favoritePromoters, setFavoritePromoters] = useState<string[]>([])
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([])
  const [autoRefresh, setAutoRefresh] = useState(false)
  const [notificationSettings, setNotificationSettings] = useState({
    expiry_alerts: true,
    activity_updates: true,
    system_notifications: true,
  })

  // Add state for QR code modal
  const [qrCodePromoter, setQrCodePromoter] = useState<EnhancedPromoter | null>(null)
  const [isQrModalOpen, setIsQrModalOpen] = useState(false)

  // Hooks
  const router = useRouter()
  const { toast } = useToast()

  // Enhanced data fetching with real-time features
  const fetchPromoters = useCallback(async () => {
    try {
      setIsLoading(true)

      const { data: promotersData, error } = await getSupabaseClient()
        .from("promoters")
        .select(
          `
          *,
          contracts:contracts(count)
        `,
        )
        .order("created_at", { ascending: false })

      if (error) throw error

      // Enhance promoter data with calculated fields
      const enhancedPromoters: EnhancedPromoter[] =
        promotersData?.map((promoter) => {
          const idExpiryDays = promoter.id_card_expiry_date
            ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date())
            : null

          const passportExpiryDays = promoter.passport_expiry_date
            ? differenceInDays(parseISO(promoter.passport_expiry_date), new Date())
            : null

          return {
            ...promoter,
            id_card_status: getDocumentStatus(idExpiryDays, promoter.id_card_expiry_date || null),
            passport_status: getDocumentStatus(
              passportExpiryDays,
              promoter.passport_expiry_date || null,
            ),
            overall_status: getOverallStatus(promoter),
            days_until_id_expiry: idExpiryDays || undefined,
            days_until_passport_expiry: passportExpiryDays || undefined,
            contracts_trend: getContractsTrend(promoter),
            tags: generateTags(promoter),
          }
        }) || []

      setPromoters(enhancedPromoters)
      setFilteredPromoters(enhancedPromoters)
    } catch (error) {
      console.error("Error fetching promoters:", error)
      toast({
        title: "Error",
        description: "Failed to fetch promoters data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  // Helper functions for data processing
  const getDocumentStatus = (
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

  const getContractsTrend = (promoter: Promoter): "up" | "down" | "stable" => {
    // This would be calculated based on historical contract data
    // For now, return stable as default
    return "stable"
  }

  const generateTags = (promoter: Promoter): string[] => {
    const tags: string[] = []

    if (promoter.active_contracts_count && promoter.active_contracts_count > 5) {
      tags.push("high-activity")
    }

    if (promoter.status === "premium") {
      tags.push("premium")
    }

    const idExpiry = promoter.id_card_expiry_date
      ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date())
      : null
    if (idExpiry !== null && idExpiry <= 30) {
      tags.push("urgent")
    }

    return tags
  }

  // Calculate statistics
  const stats = useMemo((): PromoterStats => {
    const total = promoters.length
    const active = promoters.filter((p) => p.overall_status === "active").length
    const expiring = promoters.filter((p) => p.overall_status === "warning").length
    const expired = promoters.filter((p) => p.overall_status === "critical").length
    const totalContracts = promoters.reduce((sum, p) => sum + (p.active_contracts_count || 0), 0)

    return {
      total,
      active,
      expiring_documents: expiring,
      expired_documents: expired,
      total_contracts: totalContracts,
      growth_rate: 12.5, // This would be calculated from historical data
      engagement_score: 87.3, // This would be calculated based on activity metrics
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

  // Effects
  useEffect(() => {
    fetchPromoters()

    // Load persisted data from localStorage
    try {
      const savedFavorites = localStorage.getItem("promoter-favorites")
      const savedRecentlyViewed = localStorage.getItem("promoter-recently-viewed")
      const savedNotificationSettings = localStorage.getItem("notification-settings")

      if (savedFavorites) {
        setFavoritePromoters(JSON.parse(savedFavorites))
      }
      if (savedRecentlyViewed) {
        setRecentlyViewed(JSON.parse(savedRecentlyViewed))
      }
      if (savedNotificationSettings) {
        setNotificationSettings(JSON.parse(savedNotificationSettings))
      }
    } catch (error) {
      console.warn("Failed to load persisted data:", error)
    }
  }, [fetchPromoters])

  // Persist favorites to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("promoter-favorites", JSON.stringify(favoritePromoters))
    } catch (error) {
      console.warn("Failed to save favorites:", error)
    }
  }, [favoritePromoters])

  // Persist recently viewed to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("promoter-recently-viewed", JSON.stringify(recentlyViewed))
    } catch (error) {
      console.warn("Failed to save recently viewed:", error)
    }
  }, [recentlyViewed])

  // Persist notification settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("notification-settings", JSON.stringify(notificationSettings))
    } catch (error) {
      console.warn("Failed to save notification settings:", error)
    }
  }, [notificationSettings])

  // Real-time updates
  useEffect(() => {
    const channel = getSupabaseClient()
      .channel("promoters-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "promoters" }, () => {
        fetchPromoters()
      })
      .subscribe()

    return () => {
      getSupabaseClient().removeChannel(channel)
    }
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
          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Import
          </Button>
          <Button variant="outline" onClick={() => handleExport()}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setIsAddModalOpen(true)}>
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

      {/* Main Content */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Loading promoters...</span>
            </div>
          ) : (
            <div className="p-6">
              <div className="text-center text-muted-foreground">
                Advanced promoters management interface loaded successfully!
                <br />
                Total promoters: {stats.total}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
