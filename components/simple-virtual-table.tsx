"use client"

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"

interface SimpleVirtualTableProps<T> {
  data: T[]
  columns: {
    key: string
    header: string
    width?: number
    render: (item: T, index: number) => React.ReactNode
  }[]
  rowHeight?: number
  containerHeight?: number
  className?: string
  onRowClick?: (item: T, index: number) => void
  selectedRows?: Set<string>
  onRowSelect?: (id: string, selected: boolean) => void
  getRowId?: (item: T) => string
}

export function SimpleVirtualTable<T>({
  data,
  columns,
  rowHeight = 60,
  containerHeight = 400,
  className,
  onRowClick,
  selectedRows = new Set(),
  onRowSelect,
  getRowId,
}: SimpleVirtualTableProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [hoveredRow, setHoveredRow] = useState<number | null>(null)

  // Calculate visible range
  const visibleCount = Math.ceil(containerHeight / rowHeight)
  const startIndex = Math.floor(scrollTop / rowHeight)
  const endIndex = Math.min(startIndex + visibleCount + 2, data.length)
  const visibleItems = data.slice(startIndex, endIndex)
  const offsetY = startIndex * rowHeight

  // Handle scroll
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  // Handle row click
  const handleRowClick = useCallback(
    (item: T, index: number) => {
      onRowClick?.(item, index)
    },
    [onRowClick],
  )

  // Handle row selection
  const handleRowSelect = useCallback(
    (item: T, selected: boolean) => {
      if (getRowId && onRowSelect) {
        onRowSelect(getRowId(item), selected)
      }
    },
    [getRowId, onRowSelect],
  )

  // Memoized column widths
  const columnWidths = useMemo(() => {
    const totalWidth = columns.reduce((sum, col) => sum + (col.width || 150), 0)
    return columns.map((col) => ({
      ...col,
      width: col.width || (150 * (col.width || 150)) / totalWidth,
    }))
  }, [columns])

  return (
    <div className={cn("overflow-hidden rounded-lg border", className)}>
      {/* Table Header */}
      <div className="border-b bg-muted/50">
        <div className="flex">
          {onRowSelect && (
            <div className="flex w-12 items-center justify-center border-r p-3">
              <input
                type="checkbox"
                checked={selectedRows.size === data.length && data.length > 0}
                onChange={(e) => {
                  data.forEach((item) => {
                    if (getRowId) {
                      onRowSelect(getRowId(item), e.target.checked)
                    }
                  })
                }}
                className="rounded"
                aria-label="Select all rows"
              />
            </div>
          )}
          {columnWidths.map((column) => (
            <div
              key={column.key}
              className="flex items-center p-3 text-sm font-medium"
              style={{ width: column.width }}
            >
              {column.header}
            </div>
          ))}
        </div>
      </div>

      {/* Virtual Table Body */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ height: containerHeight }}
        onScroll={handleScroll}
      >
        <div style={{ height: data.length * rowHeight, position: "relative" }}>
          <div style={{ transform: `translateY(${offsetY}px)` }}>
            {visibleItems.map((item, index) => {
              const actualIndex = startIndex + index
              const isSelected = getRowId ? selectedRows.has(getRowId(item)) : false
              const isHovered = hoveredRow === actualIndex

              return (
                <div
                  key={actualIndex}
                  className={cn(
                    "flex cursor-pointer items-center border-b transition-colors",
                    isSelected && "bg-primary/10",
                    isHovered && "bg-muted/50",
                    onRowClick && "hover:bg-muted/30",
                  )}
                  style={{ height: rowHeight }}
                  onClick={() => handleRowClick(item, actualIndex)}
                  onMouseEnter={() => setHoveredRow(actualIndex)}
                  onMouseLeave={() => setHoveredRow(null)}
                >
                  {onRowSelect && (
                    <div className="flex w-12 items-center justify-center border-r p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleRowSelect(item, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                        aria-label={`Select row ${actualIndex + 1}`}
                      />
                    </div>
                  )}
                  {columnWidths.map((column) => (
                    <div
                      key={column.key}
                      className="flex items-center p-3 text-sm"
                      style={{ width: column.width }}
                    >
                      {column.render(item, actualIndex)}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

// Optimized contract table using simple virtual scrolling
interface Contract {
  id: string
  contract_number: string
  first_party_name_en: string
  second_party_name_en: string
  promoter_name_en: string
  job_title: string
  contract_start_date: string
  contract_end_date: string
  contract_value: number
  status: string
}

interface OptimizedContractsTableProps {
  contracts: Contract[]
  onContractClick?: (contract: Contract) => void
  onContractSelect?: (contractIds: Set<string>) => void
  className?: string
}

export function OptimizedContractsTable({
  contracts,
  onContractClick,
  onContractSelect,
  className,
}: OptimizedContractsTableProps) {
  const [selectedContracts, setSelectedContracts] = useState<Set<string>>(new Set())

  const handleRowSelect = useCallback(
    (contractId: string, selected: boolean) => {
      setSelectedContracts((prev) => {
        const newSet = new Set(prev)
        if (selected) {
          newSet.add(contractId)
        } else {
          newSet.delete(contractId)
        }
        onContractSelect?.(newSet)
        return newSet
      })
    },
    [onContractSelect],
  )

  const columns = useMemo(
    () => [
      {
        key: "contract_number",
        header: "Contract",
        width: 200,
        render: (contract: Contract) => (
          <div className="flex flex-col">
            <span className="font-semibold">{contract.contract_number}</span>
            <span className="text-xs text-muted-foreground">{contract.job_title}</span>
          </div>
        ),
      },
      {
        key: "parties",
        header: "Parties",
        width: 250,
        render: (contract: Contract) => (
          <div className="flex flex-col">
            <span className="font-medium">{contract.first_party_name_en}</span>
            <span className="text-xs text-muted-foreground">{contract.second_party_name_en}</span>
          </div>
        ),
      },
      {
        key: "promoter",
        header: "Promoter",
        width: 200,
        render: (contract: Contract) => (
          <span className="font-medium">{contract.promoter_name_en}</span>
        ),
      },
      {
        key: "dates",
        header: "Duration",
        width: 200,
        render: (contract: Contract) => (
          <div className="flex flex-col">
            <span className="text-sm">
              {new Date(contract.contract_start_date).toLocaleDateString()}
            </span>
            <span className="text-xs text-muted-foreground">
              to {new Date(contract.contract_end_date).toLocaleDateString()}
            </span>
          </div>
        ),
      },
      {
        key: "status",
        header: "Status",
        width: 120,
        render: (contract: Contract) => (
          <span
            className={cn(
              "rounded-full px-2 py-1 text-xs font-medium",
              contract.status === "active" && "bg-green-100 text-green-800",
              contract.status === "expired" && "bg-red-100 text-red-800",
              contract.status === "draft" && "bg-gray-100 text-gray-800",
            )}
          >
            {contract.status}
          </span>
        ),
      },
      {
        key: "value",
        header: "Value",
        width: 150,
        render: (contract: Contract) => (
          <span className="font-medium">
            {contract.contract_value?.toLocaleString("en-US", {
              style: "currency",
              currency: "OMR",
            })}
          </span>
        ),
      },
    ],
    [],
  )

  return (
    <SimpleVirtualTable
      data={contracts}
      columns={columns}
      rowHeight={70}
      containerHeight={600}
      className={className}
      onRowClick={onContractClick}
      selectedRows={selectedContracts}
      onRowSelect={handleRowSelect}
      getRowId={(contract) => contract.id}
    />
  )
}
