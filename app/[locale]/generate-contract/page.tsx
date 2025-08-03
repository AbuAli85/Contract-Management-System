"use client"

import { useState, useEffect, Suspense, lazy } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { useAuth } from "@/lib/auth-service"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Settings,
  Sparkles,
  FileText,
  Info,
  CheckCircle,
  AlertTriangle,
  Brain,
  Zap,
  Shield,
  Users,
  Calendar,
  DollarSign,
  Target,
  TrendingUp,
  Star,
  Award,
  Globe,
  Lock,
  Eye,
  Download,
  RefreshCw,
  Plus,
  Search,
  Filter,
  Clock,
  Calculator,
  BarChart3,
  Activity,
  Bell,
  BookOpen,
  Briefcase,
  Building,
  CreditCard,
  FileCheck,
  Gavel,
  Lightbulb,
  MapPin,
  Monitor,
  Palette,
  Phone,
  PieChart,
  Settings2,
  Smartphone,
  Tablet,
  Truck,
  Wifi,
  Workflow,
} from "lucide-react"

// Lazy load components for better performance
// const EnhancedContractForm = lazy(() => import("@/components/enhanced-contract-form"))
// const UnifiedContractGeneratorForm = lazy(() => import("@/components/unified-contract-generator-form"))
// const ContractIntelligence = lazy(() => import("@/components/ai/contract-intelligence"))

// Temporary direct imports for testing
import EnhancedContractForm from "@/components/enhanced-contract-form"
import UnifiedContractGeneratorForm from "@/components/unified-contract-generator-form"
import ContractIntelligence from "@/components/ai/contract-intelligence"

// Enhanced utilities for contract insights
import {
  analyzeContractDuration,
  validateContractData,
  formatDuration,
  getContractTypeRecommendations,
} from "@/lib/contract-utils"
import { CONTRACT_FORM_SECTIONS, getRequiredFields } from "@/lib/schema-generator"
import { CONTRACT_TYPES } from "@/constants/contract-options"
import {
  getContractTypesByCategory,
  getEnhancedContractTypeConfig,
  getAllEnhancedContractTypes,
  contractTypes,
  type ContractTypeConfig,
} from "@/lib/contract-type-config"

interface ContractInsight {
  type: "success" | "warning" | "info" | "error"
  title: string
  description: string
  action?: string
  priority: "low" | "medium" | "high"
}

interface FormProgress {
  completed: number
  total: number
  percentage: number
  sections: Array<{
    name: string
    completed: boolean
    required: boolean
  }>
}

interface SmartRecommendation {
  category: string
  title: string
  description: string
  impact: "low" | "medium" | "high"
  implementation: string
  estimatedSavings?: string
}

export default function GenerateContractPage() {
  const { user, profile } = useAuth()
  const { toast } = useToast()
  const pathname = usePathname()
  const locale = pathname.split("/")[1] || "en"

  // State management
  const [useEnhancedForm, setUseEnhancedForm] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(true)
  const [showContractInsights, setShowContractInsights] = useState(true)
  const [selectedContractType, setSelectedContractType] = useState<string>("")
  const [formProgress, setFormProgress] = useState<FormProgress>({
    completed: 0,
    total: 11,
    percentage: 0,
    sections: [
      { name: "Contracting Parties", completed: false, required: true },
      { name: "Promoter Required Information", completed: false, required: true },
      { name: "Contract Required Period", completed: false, required: true },
      { name: "Employment Details", completed: false, required: false },
      { name: "Compensation", completed: false, required: false },
      { name: "Additional Terms", completed: false, required: false },
    ],
  })

  // AI Insights and Recommendations
  const [insights, setInsights] = useState<ContractInsight[]>([
    {
      type: "info",
      title: "Enhanced Schema Validation",
      description:
        "All contracts are validated against Oman labor law requirements and business rules.",
      priority: "high",
    },
    {
      type: "success",
      title: "Smart Field Requirements",
      description: "Form automatically shows required fields based on contract type selection.",
      priority: "medium",
    },
    {
      type: "warning",
      title: "Date Validation & Constraints",
      description: "Contract dates are validated to ensure compliance with legal requirements.",
      priority: "high",
    },
  ])

  const [recommendations, setRecommendations] = useState<SmartRecommendation[]>([
    {
      category: "Compliance",
      title: "Oman Labor Law Compliance",
      description: "Ensure all contracts meet Oman labor law requirements",
      impact: "high",
      implementation: "Automated validation checks",
    },
    {
      category: "Efficiency",
      title: "Template Optimization",
      description: "Use pre-approved templates for faster processing",
      impact: "medium",
      implementation: "Template library integration",
      estimatedSavings: "2-3 hours per contract",
    },
    {
      category: "Risk Management",
      title: "Legal Review Workflow",
      description: "Implement automated legal review for high-value contracts",
      impact: "high",
      implementation: "Workflow automation",
    },
  ])

  // Contract type categories
  const contractCategories = [
    { id: "employment", label: "Employment", icon: Users, count: 4 },
    { id: "service", label: "Service", icon: Briefcase, count: 2 },
    { id: "consulting", label: "Consulting", icon: Brain, count: 1 },
    { id: "partnership", label: "Partnership", icon: Users, count: 1 },
    { id: "nda", label: "NDA", icon: Lock, count: 1 },
  ]

  // Best practices
  const bestPractices = [
    "Ensure all party information is accurate and up-to-date",
    "Verify contract dates align with business requirements",
    "Review job title and department classifications",
    "Confirm work location and arrangement details",
    "Validate compensation structure and benefits",
    "Include all required legal clauses and terms",
  ]

  // Feature comparison
  const featureComparison = {
    standard: {
      title: "Standard Form",
      description: "Enhanced with advanced validation and business rules",
      features: [
        "Enhanced schema validation",
        "Business rule enforcement",
        "Smart field requirements",
        "Date validation & constraints",
        "Comprehensive error handling",
        "Ready for production use",
      ],
      status: "active",
    },
    enhanced: {
      title: "Enhanced Form",
      description: "Advanced interface with sectioned workflow (In Development)",
      features: [
        "Sectioned form with progress tracking",
        "Real-time contract insights",
        "Smart auto-completion",
        "Salary recommendations",
        "Advanced analytics",
        "Coming soon...",
      ],
      status: "development",
    },
  }

  // Contract types with enhanced configuration - group by category
  const allContractTypes = getAllEnhancedContractTypes()
  const contractTypesConfig = allContractTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = []
    }
    acc[type.category].push({
      value: type.id,
      label: type.name,
      category: type.category,
      requiredFields: type.validation.requiredFields
    })
    return acc
  }, {} as Record<string, Array<{value: string, label: string, category: string, requiredFields: string[]}>>)

  const handleContractTypeSelect = (type: string) => {
    setSelectedContractType(type)
    // Update insights based on contract type
    updateInsightsForContractType(type)
  }

  const updateInsightsForContractType = (type: string) => {
    const typeConfig = getEnhancedContractTypeConfig(type)
    if (typeConfig) {
      const newInsights: ContractInsight[] = [
        {
          type: "info",
          title: `${typeConfig.label} Contract`,
          description: typeConfig.description,
          priority: "medium",
        },
        {
          type: "success",
          title: "Template Available",
          description: `Professional template with ${typeConfig.requiredFields.length} required fields`,
          priority: "high",
        },
      ]
      setInsights((prev) => [...prev, ...newInsights])
    }
  }

  const updateFormProgress = (section: string, completed: boolean) => {
    setFormProgress((prev) => {
      const updatedSections = prev.sections.map((s) =>
        s.name === section ? { ...s, completed } : s,
      )
      const completedCount = updatedSections.filter((s) => s.completed).length
      return {
        ...prev,
        completed: completedCount,
        percentage: Math.round((completedCount / prev.total) * 100),
      }
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="space-y-4 text-center">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="font-heading text-3xl font-bold md:text-4xl">Create New Contract</h1>
          <p className="mt-2 text-lg text-muted-foreground">
            Generate professional bilingual contracts with enhanced validation and insights
          </p>
        </motion.div>

        {/* Search and Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex flex-col items-center justify-center gap-4 sm:flex-row"
        >
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
            <input
              type="text"
              placeholder="Search contracts, promoters, parties..."
              className="w-full rounded-lg border py-2 pl-10 pr-4 focus:border-transparent focus:ring-2 focus:ring-primary"
            />
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Contract
          </Button>
        </motion.div>

        {/* Form Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex justify-center"
        >
          <Tabs value={useEnhancedForm ? "enhanced" : "standard"} className="w-full max-w-md">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="standard"
                onClick={() => setUseEnhancedForm(false)}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Standard
              </TabsTrigger>
              <TabsTrigger
                value="enhanced"
                onClick={() => setUseEnhancedForm(true)}
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                Enhanced
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </motion.div>
      </div>

      {/* Feature Comparison */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="grid gap-6 md:grid-cols-2"
      >
        <Card
          className={`border-2 transition-all duration-200 ${
            !useEnhancedForm ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {featureComparison.standard.title}
            </CardTitle>
            <CardDescription>{featureComparison.standard.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {featureComparison.standard.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            <Badge
              className="mt-4"
              variant={featureComparison.standard.status === "active" ? "default" : "secondary"}
            >
              {featureComparison.standard.status === "active" ? "Active" : "Development"}
            </Badge>
          </CardContent>
        </Card>

        <Card
          className={`border-2 transition-all duration-200 ${
            useEnhancedForm ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              {featureComparison.enhanced.title}
            </CardTitle>
            <CardDescription>{featureComparison.enhanced.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {featureComparison.enhanced.features.map((feature, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{feature}</span>
                </div>
              ))}
            </div>
            <Badge
              className="mt-4"
              variant={featureComparison.enhanced.status === "active" ? "default" : "secondary"}
            >
              {featureComparison.enhanced.status === "active" ? "Active" : "Development"}
            </Badge>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contract Generation Insights */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-blue-500" />
              Contract Generation Insights
            </CardTitle>
            <CardDescription>Smart recommendations and validation insights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Form Completion Progress */}
            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium">Form Completion</span>
                <span className="text-sm text-muted-foreground">
                  {formProgress.completed} of {formProgress.total} required fields completed
                </span>
              </div>
              <Progress value={formProgress.percentage} className="h-2" />
            </div>

            {/* Best Practices */}
            <div>
              <h4 className="mb-3 font-medium">Best Practices</h4>
              <div className="space-y-2">
                {bestPractices.map((practice, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{practice}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Compliance Note */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                All contracts are validated against Oman labor law requirements and business rules.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </motion.div>

      {/* Form Sections Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Workflow className="h-5 w-5" />
              Form Sections Overview
            </CardTitle>
            <CardDescription>Overview of contract generation sections</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {formProgress.sections.map((section, index) => (
                <div key={index} className="flex items-center gap-3 rounded-lg border p-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full ${
                      section.completed
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {section.completed ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <span className="text-sm font-medium">{index + 1}</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">{section.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {section.required ? "Required" : "Optional"}
                    </div>
                  </div>
                  {section.required && (
                    <Badge variant="outline" className="text-xs">
                      Required
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Contract Types */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />9 Contract Types
            </CardTitle>
            <CardDescription>
              Each contract type has unique templates, fields, and business rules
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter Buttons */}
            <div className="mb-6 flex flex-wrap gap-2">
              <Button variant="outline" size="sm">
                All Types
              </Button>
              {contractCategories.map((category) => (
                <Button key={category.id} variant="outline" size="sm">
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Contract Type Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.entries(contractTypesConfig).map(([category, types]) => (
                <div key={category} className="space-y-3">
                  <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">
                    {category}
                  </h4>
                  <div className="space-y-2">
                    {types.map((type) => (
                      <div
                        key={type.value}
                        className={`cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:border-primary ${
                          selectedContractType === type.value ? "border-primary bg-primary/5" : ""
                        }`}
                        onClick={() => handleContractTypeSelect(type.value)}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {type.requiredFields.length} required fields
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {type.category}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Insights and Recommendations */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              AI Insights & Recommendations
            </CardTitle>
            <CardDescription>Smart analysis and optimization suggestions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Insights */}
              <div>
                <h4 className="mb-3 font-medium">Current Insights</h4>
                <div className="space-y-3">
                  {insights.map((insight, index) => (
                    <div
                      key={index}
                      className={`rounded-lg border p-3 ${
                        insight.type === "success"
                          ? "border-green-200 bg-green-50"
                          : insight.type === "warning"
                            ? "border-yellow-200 bg-yellow-50"
                            : insight.type === "error"
                              ? "border-red-200 bg-red-50"
                              : "border-blue-200 bg-blue-50"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {insight.type === "success" && (
                          <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />
                        )}
                        {insight.type === "warning" && (
                          <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600" />
                        )}
                        {insight.type === "error" && (
                          <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />
                        )}
                        {insight.type === "info" && (
                          <Info className="mt-0.5 h-4 w-4 text-blue-600" />
                        )}
                        <div className="flex-1">
                          <div className="text-sm font-medium">{insight.title}</div>
                          <div className="text-xs text-muted-foreground">{insight.description}</div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {insight.priority}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations */}
              <div>
                <h4 className="mb-3 font-medium">Smart Recommendations</h4>
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div key={index} className="rounded-lg border p-3">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="text-sm font-medium">{rec.title}</div>
                        <Badge variant="outline" className="text-xs">
                          {rec.impact}
                        </Badge>
                      </div>
                      <div className="mb-2 text-xs text-muted-foreground">{rec.description}</div>
                      <div className="text-xs">
                        <strong>Implementation:</strong> {rec.implementation}
                      </div>
                      {rec.estimatedSavings && (
                        <div className="mt-1 text-xs text-green-600">
                          💰 Estimated savings: {rec.estimatedSavings}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
      >
        {useEnhancedForm ? (
          <EnhancedContractForm
            onSuccess={() => {
              toast({
                title: "Contract Generated",
                description: "Your contract has been successfully generated and saved.",
              })
            }}
            onError={(error) => {
              toast({
                title: "Generation Failed",
                description: error.message || "Failed to generate contract.",
                variant: "destructive",
              })
            }}
          />
        ) : (
          <UnifiedContractGeneratorForm
            mode="advanced"
            showAdvanced={true}
            autoRedirect={false}
            onFormSubmit={() => {
              toast({
                title: "Contract Saved",
                description: "Your contract has been successfully saved.",
              })
            }}
          />
        )}
      </motion.div>

      {/* AI Contract Intelligence */}
      {showAIInsights && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.0 }}
        >
          <ContractIntelligence contractId="sample-contract-123" />
        </motion.div>
      )}
    </motion.div>
  )
}
