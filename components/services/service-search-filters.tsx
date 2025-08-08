"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, X } from "lucide-react"

interface ServiceSearchFiltersProps {
  onSearchChange: (query: string) => void
  onStatusFilterChange: (status: string) => void
  onClearFilters: () => void
  searchQuery: string
  statusFilter: string
}

export function ServiceSearchFilters({
  onSearchChange,
  onStatusFilterChange,
  onClearFilters,
  searchQuery,
  statusFilter
}: ServiceSearchFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const handleClearFilters = () => {
    onSearchChange("")
    onStatusFilterChange("")
    onClearFilters()
  }

  const hasActiveFilters = searchQuery || statusFilter

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search services by name or provider..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-4"
        />
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
        </Button>

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>

      {/* Expanded Filters */}
      {isExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <Select value={statusFilter} onValueChange={onStatusFilterChange}>
              <SelectTrigger>
                <SelectValue placeholder="All statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {searchQuery && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
              <span>Search: "{searchQuery}"</span>
              <button
                onClick={() => onSearchChange("")}
                className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                title="Clear search"
                aria-label="Clear search filter"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {statusFilter && (
            <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm">
              <span>Status: {statusFilter}</span>
              <button
                onClick={() => onStatusFilterChange("")}
                className="ml-1 hover:bg-green-200 rounded-full p-0.5"
                title="Clear status filter"
                aria-label="Clear status filter"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 