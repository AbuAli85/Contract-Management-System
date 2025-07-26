"use client"

import React, { useState, useEffect } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select'
import { Badge } from './badge'
import { Card, CardContent } from './card'
import { Button } from './button'
import { Input } from './input'
import { Search, User, Building2, MapPin, Phone, Mail, Calendar } from 'lucide-react'
import { useParties } from '@/hooks/use-parties'
import { usePromoters } from '@/hooks/use-promoters'

interface EnhancedPromoterSelectorProps {
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function EnhancedPromoterSelector({
  value,
  onValueChange,
  placeholder = "Select Promoter",
  disabled = false,
  className = ""
}: EnhancedPromoterSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedPromoter, setSelectedPromoter] = useState<any>(null)
  
  const { data: promoters, isLoading: isLoadingPromoters } = usePromoters()
  const { data: parties, isLoading: isLoadingParties } = useParties()

  // Find selected promoter details
  useEffect(() => {
    if (value && promoters) {
      const promoter = promoters.find(p => p.id === value)
      setSelectedPromoter(promoter)
    } else {
      setSelectedPromoter(null)
    }
  }, [value, promoters])

  // Filter promoters based on search term
  const filteredPromoters = promoters?.filter(promoter => {
    if (!searchTerm) return true
    const searchLower = searchTerm.toLowerCase()
    return (
      promoter.name_en?.toLowerCase().includes(searchLower) ||
      promoter.name_ar?.toLowerCase().includes(searchLower) ||
      promoter.id_card_number?.toLowerCase().includes(searchLower) ||
      promoter.mobile_number?.toLowerCase().includes(searchLower)
    )
  }) || []

  // Get employer information for a promoter
  const getEmployerInfo = (promoter: any) => {
    if (!parties) return null
    
    // For now, we'll show a placeholder since the relationship might be complex
    // In a real implementation, you'd have employer_id in the promoter record
    return {
      name: "Employer Information",
      location: "Work Location",
      contact: "Contact Details"
    }
  }

  const formatPromoterDisplay = (promoter: any) => {
    return (
      <div className="flex flex-col space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{promoter.name_en}</span>
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {promoter.status || 'Active'}
          </span>
        </div>
        <div className="text-sm text-muted-foreground">
          {promoter.name_ar} • ID: {promoter.id_card_number}
        </div>
        <div className="text-xs text-blue-600 flex items-center gap-1">
          <Building2 className="h-3 w-3" />
          Employer Info
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <Select onValueChange={onValueChange} value={value || ""}>
        <SelectTrigger disabled={disabled || isLoadingPromoters} className={className}>
          <SelectValue placeholder={isLoadingPromoters ? "Loading promoters..." : placeholder} />
        </SelectTrigger>
        <SelectContent className="w-[400px] max-h-[300px]">
          {/* Search Input */}
          <div className="p-2 border-b">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search promoters..."
                value={searchTerm}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>

          {/* Promoter List */}
          <div className="max-h-[200px] overflow-y-auto">
            {filteredPromoters.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                {searchTerm ? "No promoters found" : "No promoters available"}
              </div>
            ) : (
              filteredPromoters.map((promoter) => (
                <SelectItem key={promoter.id} value={promoter.id} className="p-2">
                  {formatPromoterDisplay(promoter)}
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>

      {/* Selected Promoter Details */}
      {selectedPromoter && (
        <Card className="mt-2 border-green-200 bg-green-50/50">
          <CardContent className="p-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-sm">{selectedPromoter.name_en}</span>
                  <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                    {selectedPromoter.status || 'Active'}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <div>{selectedPromoter.name_ar}</div>
                  <div className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedPromoter.mobile_number}
                  </div>
                  {selectedPromoter.id_card_expiry_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      ID Expires: {new Date(selectedPromoter.id_card_expiry_date).toLocaleDateString('en-GB')}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onValueChange("")}
                className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600"
              >
                ×
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
} 