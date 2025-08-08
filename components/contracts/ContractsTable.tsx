"use client"

import React, { useState, useEffect, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import {
  Loader2, MoreHorizontal, Grid, List, Building2, User, Copy, Archive, RefreshCw, Plus, AlertTriangle, XCircle, CheckCircle, Eye, Edit, Trash2, ChevronUp, ChevronDown, Search
} from 'lucide-react'

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Checkbox } from "@/components/ui/checkbox"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { format, parseISO, differenceInDays } from "date-fns"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

type Contract = {
  id: string
  contract_number: string
  employer_id: string
  client_id: string
  promoter_id: string
  employer_name_en: string
  employer_name_ar: string
  employer_crn: string
  client_name_en: string
  client_name_ar: string
  client_crn: string
  promoter_name_en: string
  promoter_name_ar: string
  email: string
  job_title: string
  work_location: string
  start_date: string
  end_date: string
  value: number
  status: string
  is_current: boolean
  created_at: string
  updated_at: string
}

interface ContractsTableProps {
  className?: string
}

// Memoized contract row component to prevent unnecessary re-renders
const ContractRow = React.memo(
  ({
    contract,
    isSelected,
    onSelect,
    onDuplicate,
    onArchive,
    onDelete,
  }: {
    contract: Contract
    isSelected: boolean
    onSelect: (id: string, selected: boolean) => void
    onDuplicate: (contract: Contract) => void
    onArchive: (contractId: string) => void
    onDelete: (contractId: string) => void
  }) => {
    const router = useRouter()
    const { toast } = useToast()

    // Memoize expensive calculations
    const contractStatus = useMemo(() => {
      const today = new Date()
      const endDate = parseISO(contract.end_date)
      const daysUntilExpiry = differenceInDays(endDate, today)

      if (daysUntilExpiry < 0)
        return { status: "expired", color: "bg-red-100 text-red-800", icon: XCircle }
      if (daysUntilExpiry <= 30)
        return { status: "expiring", color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle }
      return { status: "active", color: "bg-green-100 text-green-800", icon: CheckCircle }
    }, [contract.end_date])

    const handleViewDetails = useCallback(() => {
      router.push(`/contracts/${contract.id}`)
    }, [contract.id, router])

    const handleEdit = useCallback(() => {
      router.push(`/edit-contract/${contract.id}`)
    }, [contract.id, router])

    const handleDuplicate = useCallback(() => {
      onDuplicate(contract)
    }, [contract, onDuplicate])

    const handleArchive = useCallback(() => {
      onArchive(contract.id)
    }, [contract.id, onArchive])

    const handleDelete = useCallback(() => {
      onDelete(contract.id)
    }, [contract.id, onDelete])

    return (
      <TableRow className={cn(isSelected && "bg-muted/50")}>
        <TableCell className="w-12">
          <Checkbox
            checked={isSelected}
            onCheckedChange={(checked) => onSelect(contract.id, checked as boolean)}
          />
        </TableCell>
        <TableCell className="font-medium">
          <div className="flex flex-col">
            <span className="font-semibold">{contract.contract_number}</span>
            <span className="text-sm text-muted-foreground">{contract.job_title}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium">{contract.client_name_en}</span>
            <span className="text-sm text-muted-foreground">{contract.employer_name_en}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium">{contract.promoter_name_en}</span>
            <span className="text-sm text-muted-foreground">{contract.email}</span>
          </div>
        </TableCell>
        <TableCell>
          <div className="flex flex-col">
            <span className="font-medium">
              {format(parseISO(contract.start_date), "dd/MM/yyyy")}
            </span>
            <span className="text-sm text-muted-foreground">
              to {format(parseISO(contract.end_date), "dd/MM/yyyy")}
            </span>
          </div>
        </TableCell>
        <TableCell>
          <Badge className={cn("font-medium", contractStatus.color)}>
            <contractStatus.icon className="mr-1 h-3 w-3" />
            {contractStatus.status}
          </Badge>
        </TableCell>
        <TableCell className="text-right font-medium">
          {contract.value?.toLocaleString("en-US", { style: "currency", currency: "OMR" })}
        </TableCell>
        <TableCell className="w-12">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Contract Actions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleViewDetails}>
                <Eye className="mr-2 h-4 w-4" />
                View Details
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleEdit}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Contract
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate Contract
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleArchive}>
                <Archive className="mr-2 h-4 w-4" />
                Archive Contract
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Contract
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
    )
  },
)

ContractRow.displayName = "ContractRow"

// Memoized table header component
const TableHeaderComponent = React.memo(
  ({
    sortField,
    sortDirection,
    onSort,
  }: {
    sortField: string
    sortDirection: "asc" | "desc"
    onSort: (field: string) => void
  }) => {
    const handleSort = useCallback(
      (field: string) => {
        onSort(field)
      },
      [onSort],
    )

    return (
      <TableHeader>
        <TableRow>
          <TableHead className="w-12">
            <Checkbox />
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => handleSort("contract_number")}
          >
            <div className="flex items-center">
              Contract
              {sortField === "contract_number" &&
                (sortDirection === "asc" ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-1 h-4 w-4" />
                ))}
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => handleSort("client_name_en")}
          >
            <div className="flex items-center">
              Parties
              {sortField === "client_name_en" &&
                (sortDirection === "asc" ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-1 h-4 w-4" />
                ))}
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => handleSort("promoter_name_en")}
          >
            <div className="flex items-center">
              Promoter
              {sortField === "promoter_name_en" &&
                (sortDirection === "asc" ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-1 h-4 w-4" />
                ))}
            </div>
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => handleSort("start_date")}
          >
            <div className="flex items-center">
              Duration
              {sortField === "start_date" &&
                (sortDirection === "asc" ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-1 h-4 w-4" />
                ))}
            </div>
          </TableHead>
          <TableHead>Status</TableHead>
          <TableHead
            className="cursor-pointer hover:bg-muted/50"
            onClick={() => handleSort("value")}
          >
            <div className="flex items-center">
              Value
              {sortField === "value" &&
                (sortDirection === "asc" ? (
                  <ChevronUp className="ml-1 h-4 w-4" />
                ) : (
                  <ChevronDown className="ml-1 h-4 w-4" />
                ))}
            </div>
          </TableHead>
          <TableHead className="w-12">Actions</TableHead>
        </TableRow>
      </TableHeader>
    )
  },
)

TableHeaderComponent.displayName = "TableHeaderComponent"

// Main ContractsTable component with React.memo
const ContractsTable = React.memo(({ className }: ContractsTableProps) => {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [sortField, setSortField] = useState("created_at")
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc")
  const [viewMode, setViewMode] = useState<"table" | "grid">("table")

  const { toast } = useToast()

  // Memoized filtered and sorted contracts
  const filteredAndSortedContracts = useMemo(() => {
    const filtered = contracts.filter((contract) => {
      const matchesSearch =
        contract.contract_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.client_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.employer_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.promoter_name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
        contract.job_title.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesStatus = statusFilter === "all" || contract.status === statusFilter

      return matchesSearch && matchesStatus
    })

    // Sort contracts
    filtered.sort((a, b) => {
      let aValue: string | number = a[sortField as keyof Contract] as string | number
      let bValue: string | number = b[sortField as keyof Contract] as string | number

      if (sortField === "start_date" || sortField === "end_date") {
        aValue = new Date(aValue as string).getTime()
        bValue = new Date(bValue as string).getTime()
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1
      return 0
    })

    return filtered
  }, [contracts, searchTerm, statusFilter, sortField, sortDirection])

  // Memoized fetch function
  const fetchContracts = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("contracts")
        .select(
          `
    *,
    employer:parties!contracts_employer_id_fkey (name_en, name_ar, crn),
    client:parties!contracts_client_id_fkey (name_en, name_ar, crn),
    promoter:promoters!contracts_promoter_id_fkey (name_en, name_ar)
  `,
        )
        .order("created_at", { ascending: false })

      if (error) throw error

      setContracts(
        (data || []).map((contract: any) => ({
          id: contract.id || "",
          contract_number: contract.contract_number || "",
          employer_id: contract.employer_id || "",
          client_id: contract.client_id || "",
          promoter_id: contract.promoter_id || "",
          employer_name_en: contract.employer?.name_en || "",
          employer_name_ar: contract.employer?.name_ar || "",
          employer_crn: contract.employer?.crn || "",
          client_name_en: contract.client?.name_en || "",
          client_name_ar: contract.client?.name_ar || "",
          client_crn: contract.client?.crn || "",
          promoter_name_en: contract.promoter?.name_en || "",
          promoter_name_ar: contract.promoter?.name_ar || "",
          email: contract.email || "",
          job_title: contract.job_title || "",
          work_location: contract.work_location || "",
          start_date: contract.start_date || "",
          end_date: contract.end_date || "",
          value: contract.value ?? 0,
          status: contract.status || "",
          is_current: contract.is_current ?? false,
          created_at: contract.created_at || "",
          updated_at: contract.updated_at || "",
        })),
      )
    } catch (err) {
      console.error("Error fetching contracts:", err)
      setError("Failed to fetch contracts")
      toast({
        title: "Error",
        description: "Failed to fetch contracts",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [toast])

  // Memoized handlers
  const handleSelectContract = useCallback((contractId: string, selected: boolean) => {
    setSelectedContracts((prev) => {
      const newSet = new Set(prev)
      if (selected) {
        newSet.add(contractId)
      } else {
        newSet.delete(contractId)
      }
      return newSet
    })
  }, [])

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (selected) {
        setSelectedContracts(new Set(filteredAndSortedContracts.map((c) => c.id)))
      } else {
        setSelectedContracts(new Set())
      }
    },
    [filteredAndSortedContracts],
  )

  const handleSort = useCallback(
    (field: string) => {
      setSortDirection((prev) => (sortField === field && prev === "asc" ? "desc" : "asc"))
      setSortField(field)
    },
    [sortField],
  )

  const duplicateContract = useCallback(
    async (contract: Contract) => {
      try {
        const timestamp = Date.now()
        const newContractNumber = `${contract.contract_number}-COPY-${timestamp}`

        const newContract = {
          contract_number: newContractNumber,
          employer_id: contract.employer_id, // Use the foreign key, not the name/crn
          client_id: contract.client_id,
          promoter_id: contract.promoter_id,
          email: contract.email,
          job_title: contract.job_title,
          work_location: contract.work_location,
          start_date: contract.start_date,
          end_date: contract.end_date,
          value: contract.value,
          status: "draft",
          is_current: true,
          // ...any other fields that exist in the contracts table
        }

        const supabase = createClient()
        const { error } = await supabase.from("contracts").insert(newContract)

        if (error) throw error

        await fetchContracts()
        toast({
          title: "Success",
          description: "Contract duplicated successfully",
        })
      } catch (err) {
        console.error("❌ Error duplicating contract:", err)
        setError("Failed to duplicate contract")
        toast({
          title: "Error",
          description: "Failed to duplicate contract",
          variant: "destructive",
        })
      }
    },
    [fetchContracts, toast],
  )

  const archiveContract = useCallback(
    async (contractId: string) => {
      try {
        const supabase = createClient()
        const { error } = await supabase
          .from("contracts")
          .update({ is_current: false, updated_at: new Date().toISOString() })
          .eq("id", contractId)

        if (error) throw error

        await fetchContracts()
        toast({
          title: "Success",
          description: "Contract archived successfully",
        })
      } catch (err) {
        console.error("❌ Error archiving contract:", err)
        setError("Failed to archive contract")
        toast({
          title: "Error",
          description: "Failed to archive contract",
          variant: "destructive",
        })
      }
    },
    [fetchContracts, toast],
  )

  const deleteContract = useCallback(
    async (contractId: string) => {
      try {
        const supabase = createClient()
        const { error } = await supabase.from("contracts").delete().eq("id", contractId)

        if (error) throw error

        await fetchContracts()
        toast({
          title: "Success",
          description: "Contract deleted successfully",
        })
      } catch (err) {
        console.error("❌ Error deleting contract:", err)
        setError("Failed to delete contract")
        toast({
          title: "Error",
          description: "Failed to delete contract",
          variant: "destructive",
        })
      }
    },
    [fetchContracts, toast],
  )

  // Load contracts on mount
  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading contracts...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8 text-red-600">
        <AlertTriangle className="mr-2 h-8 w-8" />
        <span>{error}</span>
      </div>
    )
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header with controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <h2 className="text-2xl font-bold">Contracts</h2>
          <Badge variant="secondary">{filteredAndSortedContracts.length} contracts</Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === "table" ? "grid" : "table")}
          >
            {viewMode === "table" ? <Grid className="h-4 w-4" /> : <List className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={fetchContracts}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Contract
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
          <Input
            placeholder="Search contracts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border bg-background px-3 py-2 text-sm"
          aria-label="Filter by contract status"
        >
          <option value="all">All Statuses</option>
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="terminated">Terminated</option>
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Contract List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeaderComponent
              sortField={sortField}
              sortDirection={sortDirection}
              onSort={handleSort}
            />
            <TableBody>
              {filteredAndSortedContracts.map((contract) => (
                <ContractRow
                  key={contract.id}
                  contract={contract}
                  isSelected={selectedContracts.has(contract.id)}
                  onSelect={handleSelectContract}
                  onDuplicate={duplicateContract}
                  onArchive={archiveContract}
                  onDelete={deleteContract}
                />
              ))}
            </TableBody>
          </Table>

          {filteredAndSortedContracts.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">No contracts found</div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})

ContractsTable.displayName = "ContractsTable"

export default ContractsTable
