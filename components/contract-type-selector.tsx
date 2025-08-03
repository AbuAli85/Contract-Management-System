"use client"

import React, { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Briefcase,
  Users,
  Clock,
  Building2,
  Brain,
  UserCheck,
  Handshake,
  Lock,
  Truck,
  CheckCircle,
  AlertTriangle,
  Info,
  Zap,
  FileText,
  Settings,
  Shield,
  DollarSign,
  Calendar,
  Globe,
  Star,
} from "lucide-react"
import { enhancedContractTypes, ContractTypeConfig } from "@/lib/contract-type-config"
import { getMakecomTemplateConfig } from "@/lib/makecom-template-config"

interface ContractTypeSelectorProps {
  onSelect: (contractType: ContractTypeConfig) => void
  selectedType?: string
  showAdvanced?: boolean
}

const categoryIcons = {
  employment: Briefcase,
  service: Building2,
  freelance: UserCheck,
  consulting: Brain,
  partnership: Handshake,
  nda: Lock,
  vendor: Truck,
  custom: Settings,
  lease: Calendar,
}

const categoryColors = {
  employment: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  service: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  freelance: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  consulting: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  partnership: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  nda: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
  vendor: "bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200",
  custom: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
  lease: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
}

export function ContractTypeSelector({
  onSelect,
  selectedType,
  showAdvanced = false,
}: ContractTypeSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<"name" | "category" | "complexity">("name")

  const filteredTypes = (enhancedContractTypes || [])
    .filter((type) => {
      const matchesSearch =
        type.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        type.description.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = categoryFilter === "all" || type.category === categoryFilter
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "name":
          return a.name.localeCompare(b.name)
        case "category":
          return a.category.localeCompare(b.category)
        case "complexity":
          return (
            b.fields.length +
            (b.businessRules?.complianceChecks?.length || 0) -
            (a.fields.length + (a.businessRules?.complianceChecks?.length || 0))
          )
        default:
          return 0
      }
    })

  const getComplexityScore = (type: ContractTypeConfig) => {
    const fieldScore = type.fields.length
    const businessRuleScore = type.businessRules?.complianceChecks?.length || 0
    const approvalScore = type.requiresApproval ? 2 : 0
    return fieldScore + businessRuleScore + approvalScore
  }

  const getComplexityBadge = (score: number) => {
    if (score <= 5) return { label: "Simple", color: "bg-green-100 text-green-800" }
    if (score <= 10) return { label: "Moderate", color: "bg-yellow-100 text-yellow-800" }
    return { label: "Complex", color: "bg-red-100 text-red-800" }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="mb-2 text-3xl font-bold text-gray-900 dark:text-gray-100">
          9 Contract Types Available
        </h2>
        <p className="mx-auto max-w-2xl text-gray-600 dark:text-gray-400">
          Choose from our comprehensive selection of contract types, each with unique templates,
          business rules, and automated Make.com integration for seamless document generation.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex-1">
          <Input
            placeholder="Search contract types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="employment">Employment</SelectItem>
            <SelectItem value="service">Service</SelectItem>
            <SelectItem value="freelance">Freelance</SelectItem>
            <SelectItem value="consulting">Consulting</SelectItem>
            <SelectItem value="partnership">Partnership</SelectItem>
            <SelectItem value="nda">NDA</SelectItem>
            <SelectItem value="vendor">Vendor</SelectItem>
          </SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Sort by Name</SelectItem>
            <SelectItem value="category">Sort by Category</SelectItem>
            <SelectItem value="complexity">Sort by Complexity</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Contract Types Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {(filteredTypes || []).map((type) => {
          const IconComponent =
            categoryIcons[type.category as keyof typeof categoryIcons] || Settings
          const categoryColor =
            categoryColors[type.category as keyof typeof categoryColors] ||
            "bg-gray-100 text-gray-800"
          const complexityScore = getComplexityScore(type)
          const complexityBadge = getComplexityBadge(complexityScore)
          const makecomConfig = getMakecomTemplateConfig(type.makecomTemplateId || "")

          return (
            <Card
              key={type.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                selectedType === type.id ? "bg-blue-50 ring-2 ring-blue-500 dark:bg-blue-950" : ""
              }`}
              onClick={() => onSelect(type)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`rounded-lg p-2 ${categoryColor}`}>
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{type.name}</CardTitle>
                      <CardDescription className="text-sm">{type.nameAr}</CardDescription>
                    </div>
                  </div>
                  <Badge variant={selectedType === type.id ? "default" : "secondary"}>
                    {complexityBadge.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>

                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Features</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Badge variant="outline" className="text-xs">
                      {type.fields.length} Fields
                    </Badge>
                    {type.requiresApproval && (
                      <Badge variant="outline" className="text-xs">
                        <AlertTriangle className="mr-1 h-3 w-3" />
                        Approval Required
                      </Badge>
                    )}
                    {type.businessRules?.autoApproval && (
                      <Badge variant="outline" className="text-xs">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Auto Approval
                      </Badge>
                    )}
                  </div>
                </div>

                {/* Make.com Integration */}
                {makecomConfig && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      <span className="text-sm font-medium">Make.com Automation</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Globe className="h-3 w-3" />
                        <span>Google Docs Integration</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Shield className="h-3 w-3" />
                        <span>
                          {makecomConfig.makecomModuleConfig.automationSteps.length} Automation
                          Steps
                        </span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Settings className="h-3 w-3" />
                        <span>
                          {makecomConfig.makecomModuleConfig.errorHandling.length} Error Handlers
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Business Rules */}
                {showAdvanced && type.businessRules && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Settings className="h-4 w-4 text-purple-500" />
                      <span className="text-sm font-medium">Business Rules</span>
                    </div>
                    <div className="space-y-1 text-xs text-gray-600 dark:text-gray-400">
                      {type.businessRules.minContractValue &&
                        type.businessRules.maxContractValue && (
                          <div className="flex items-center space-x-1">
                            <DollarSign className="h-3 w-3" />
                            <span>
                              {type.businessRules.minContractValue.toLocaleString()} -{" "}
                              {type.businessRules.maxContractValue.toLocaleString()}{" "}
                              {type.businessRules.allowedCurrencies[0]}
                            </span>
                          </div>
                        )}
                      {type.businessRules.complianceChecks && (
                        <div className="flex items-center space-x-1">
                          <Shield className="h-3 w-3" />
                          <span>
                            {type.businessRules.complianceChecks.length} Compliance Checks
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Pricing */}
                {type.pricing && (
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Star className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">Pricing</span>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400">
                      <div className="flex items-center justify-between">
                        <span>Base Price:</span>
                        <span className="font-medium">
                          {type.pricing.basePrice} {type.pricing.currency}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Model:</span>
                        <span className="font-medium capitalize">
                          {type.pricing.pricingModel.replace("-", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Button */}
                <Button
                  className="w-full"
                  variant={selectedType === type.id ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation()
                    onSelect(type)
                  }}
                >
                  {selectedType === type.id ? "Selected" : "Select Contract Type"}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Summary */}
      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
        Showing {filteredTypes.length} of {enhancedContractTypes.length} contract types
        {searchTerm && ` matching "${searchTerm}"`}
        {categoryFilter !== "all" && ` in ${categoryFilter} category`}
      </div>
    </div>
  )
}
