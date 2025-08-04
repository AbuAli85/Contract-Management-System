"use client"

import { useState, useCallback, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion } from "framer-motion"
import dynamic from 'next/dynamic'

// UI Components first (these are usually safe)
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { AuthenticatedLayout } from "@/components/authenticated-layout"

// Icons
import {
  Sparkles,
  FileText,
  Info,
  CheckCircle,
  AlertTriangle,
  Brain,
  Users,
  Lock,
  Plus,
  Search,
  Briefcase,
  Workflow,
  UserPlus,
} from "lucide-react"

// Dynamic imports for potentially problematic modules
const DynamicEnhancedContractForm = dynamic(
  () => import("@/components/enhanced-contract-form"),
  { 
    loading: () => <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading enhanced form...</p>
      </div>
    </div>,
    ssr: false 
  }
)

const DynamicUnifiedContractGeneratorForm = dynamic(
  () => import("@/components/unified-contract-generator-form"),
  { 
    loading: () => <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading contract form...</p>
      </div>
    </div>,
    ssr: false 
  }
)

const DynamicContractIntelligence = dynamic(
  () => import("@/components/ai/contract-intelligence"),
  { 
    loading: () => <div className="flex items-center justify-center p-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
        <p>Loading AI insights...</p>
      </div>
    </div>,
    ssr: false 
  }
)

// Enhanced form submission types
interface FormValues {
  contractType: string
  employerCompany: string
  employeeName: string
  startDate: string
  endDate: string
  salary: string
  position: string
  language: "english" | "arabic" | "bilingual"
}

// Smart recommendation interface
interface SmartRecommendation {
  category: string
  title: string
  description: string
  impact: "low" | "medium" | "high"
  implementation: string
  estimatedSavings?: string
}

// Custom hook for contract config with error handling
function useContractConfig() {
  const [config, setConfig] = useState<{
    getAllEnhancedContractTypes: () => any[],
    getEnhancedContractTypeConfig: (id: string) => any | null,
    loading: boolean,
    error: string | null
  }>({
    getAllEnhancedContractTypes: () => [],
    getEnhancedContractTypeConfig: () => null,
    loading: true,
    error: null
  });
  
  useEffect(() => {
    async function loadConfig() {
      try {
        const configModule = await import("@/lib/contract-type-config");
        setConfig({
          getAllEnhancedContractTypes: configModule.getAllEnhancedContractTypes,
          getEnhancedContractTypeConfig: configModule.getEnhancedContractTypeConfig,
          loading: false,
          error: null
        });
      } catch (error) {
        console.error("Config loading error:", error);
        const errorMessage = error instanceof Error ? error.message : "Config loading failed";
        setConfig({
          getAllEnhancedContractTypes: () => [],
          getEnhancedContractTypeConfig: () => null,
          loading: false,
          error: errorMessage
        });
      }
    }
    
    loadConfig();
  }, []);
  
  return config;
}

// Feature comparison component to reduce duplication
const FeatureCard = ({ 
  formType, 
  isSelected, 
  onClick 
}: { 
  formType: {
    title: string;
    description: string;
    features: string[];
    status: "active" | "development";
  },
  isSelected: boolean, 
  onClick: () => void 
}) => (
  <Card
    className={`border-2 transition-all duration-200 cursor-pointer ${
      isSelected ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
    }`}
    onClick={onClick}
  >
    <CardHeader>
      <CardTitle className="flex items-center gap-2">
        {formType.title === "Standard Form" ? (
          <FileText className="h-5 w-5" />
        ) : (
          <Sparkles className="h-5 w-5" />
        )}
        {formType.title}
      </CardTitle>
      <CardDescription>{formType.description}</CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        {formType.features.map((feature, index) => (
          <div key={index} className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-sm">{feature}</span>
          </div>
        ))}
      </div>
      <Badge className="mt-4" variant={formType.status === "active" ? "default" : "secondary"}>
        {formType.status === "active" ? "Active" : "Development"}
      </Badge>
    </CardContent>
  </Card>
)

// Feature comparison data
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
    status: "active" as const,
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
    status: "development" as const,
  },
}

// TypeScript interfaces
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
  const { 
    getAllEnhancedContractTypes, 
    getEnhancedContractTypeConfig, 
    loading: configLoading, 
    error: configError 
  } = useContractConfig();
  
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] || "en";
  const { toast } = useToast();

  // State management
  const [useEnhancedForm, setUseEnhancedForm] = useState(false)
  const [showAIInsights, setShowAIInsights] = useState(true)
  const [selectedContractType, setSelectedContractType] = useState<string>("")
  const [activeCategory, setActiveCategory] = useState<string>("all")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

  // Keep initial insights separate for cleaner management
  const initialInsights: ContractInsight[] = [
    {
      type: "info",
      title: "Enhanced Schema Validation",
      description: "All contracts are validated against Oman labor law requirements and business rules.",
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
  ]

  // AI Insights and Recommendations
  const [insights, setInsights] = useState<ContractInsight[]>(initialInsights)

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

  // ALL HOOKS MUST BE CALLED BEFORE ANY EARLY RETURNS
  const handleContractTypeSelect = useCallback((type: string) => {
    try {
      setIsLoading(true)
      setError(null)
      setSelectedContractType(type)
      // Update insights based on contract type
      updateInsightsForContractType(type)
      
      toast({
        title: "Contract Type Selected",
        description: "Selected " + (getEnhancedContractTypeConfig(type)?.name || type) + " contract template.",
      })
    } catch (error) {
      console.error("Error selecting contract type:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      setError("Failed to select contract type: " + errorMessage)
      toast({
        title: "Selection Failed",
        description: "Failed to select contract type. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast, getEnhancedContractTypeConfig])

  const updateInsightsForContractType = useCallback((type: string) => {
    try {
      const typeConfig = getEnhancedContractTypeConfig(type)
      if (typeConfig) {
        // Create the new insights specific to the selected contract
        const contractSpecificInsights: ContractInsight[] = [
          {
            type: "info",
            title: (typeConfig.name || "Contract") + " Contract Selected",
            description: typeConfig.description || "Contract template selected",
            priority: "medium" as const,
          },
          {
            type: "success",
            title: "Template Ready",
            description: "This template includes " + (typeConfig.fields?.length || 0) + " configured fields.",
            priority: "high" as const,
          },
        ]
        // Set the insights state to be the initial general insights plus the new specific ones
        setInsights([...initialInsights, ...contractSpecificInsights])
      } else {
        // If no specific type is selected, revert to only the initial insights
        setInsights(initialInsights)
      }
    } catch (error) {
      console.error("Error updating insights:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      setError("Failed to update contract insights: " + errorMessage)
    }
  }, [initialInsights, getEnhancedContractTypeConfig])

  const updateFormProgress = useCallback((sectionName: string, isCompleted: boolean) => {
    try {
      setFormProgress(prevProgress => {
        // Find the section and update its 'completed' status
        const updatedSections = prevProgress.sections.map(section =>
          section.name === sectionName ? { ...section, completed: isCompleted } : section
        )

        // Count the number of newly completed sections
        const completedCount = updatedSections.filter(section => section.completed).length

        // Calculate the new percentage
        const percentage = Math.round((completedCount / prevProgress.total) * 100)

        // Return the new state object
        return {
          ...prevProgress,
          completed: completedCount,
          percentage: percentage,
          sections: updatedSections,
        }
      })

      // Provide feedback for progress updates
      if (isCompleted) {
        toast({
          title: "Section Completed",
          description: `${sectionName} section has been completed.`,
        })
      }
    } catch (error) {
      console.error("Error updating form progress:", error)
      const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
      setError("Failed to update form progress: " + errorMessage)
    }
  }, [toast])

  // Contract type categories
  const contractCategories = [
    { id: "employment", label: "Employment", icon: Users, count: 4 },
    { id: "service", label: "Service", icon: Briefcase, count: 2 },
    { id: "consulting", label: "Consulting", icon: Brain, count: 1 },
    { id: "partnership", label: "Partnership", icon: Users, count: 1 },
    { id: "nda", label: "NDA", icon: Lock, count: 1 },
  ]

  // Contract types with enhanced configuration and filtering
  // Initialize all contract types first with error handling
  const allContractTypes = (() => {
    try {
      return getAllEnhancedContractTypes()
    } catch (error) {
      console.error("Failed to load contract types:", error)
      setError("Failed to load contract types. Please refresh the page.")
      return []
    }
  })()

  // Filter the contract types based on the active category
  const filteredContractTypes = allContractTypes.filter(
    (type) => activeCategory === "all" || type.category === activeCategory
  )
  
  // Group the filtered types by category for rendering
  const contractTypesConfig = filteredContractTypes.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = []
    }
    acc[type.category].push(type)
    return acc
  }, {} as Record<string, any[]>)

  // Best practices
  const bestPractices = [
    "Ensure all party information is accurate and up-to-date",
    "Verify contract dates align with business requirements",
    "Review job title and department classifications",
    "Confirm work location and arrangement details",
    "Validate compensation structure and benefits",
    "Include all required legal clauses and terms",
  ]

  // EARLY RETURNS MOVED AFTER ALL HOOKS
  // Early return for loading states
  if (configLoading) {
    return (
      <AuthenticatedLayout locale={locale}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-center min-h-screen"
        >
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-lg font-medium">Loading contract generator...</p>
            <p className="text-sm text-muted-foreground mt-2">
              Loading configuration...
            </p>
          </div>
        </motion.div>
      </AuthenticatedLayout>
    )
  }

  // Early return for error states
  if (configError) {
    return (
      <AuthenticatedLayout locale={locale}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-6 p-6"
        >
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load required components. Please refresh the page.
              <br />
              Error: {configError}
            </AlertDescription>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </Alert>
        </motion.div>
      </AuthenticatedLayout>
    )
  }

  return (
    <AuthenticatedLayout locale={locale}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
      {/* Error Display */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => {
                setError(null)
                window.location.reload()
              }}
            >
              Retry
            </Button>
          </Alert>
        </motion.div>
      )}

      {/* Header */}
      <div className="space-y-4 text-center">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
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
        <FeatureCard
          formType={featureComparison.standard}
          isSelected={!useEnhancedForm}
          onClick={() => setUseEnhancedForm(false)}
        />
        <FeatureCard
          formType={featureComparison.enhanced}
          isSelected={useEnhancedForm}
          onClick={() => setUseEnhancedForm(true)}
        />
      </motion.div>

      {/* Contract Generation Insights */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
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
                      section.completed ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-600"
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
                    <div className="text-xs text-muted-foreground">{section.required ? "Required" : "Optional"}</div>
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Contract Types
            </CardTitle>
            <CardDescription>Each contract type has unique templates, fields, and business rules</CardDescription>
          </CardHeader>
          <CardContent>
            {/* Filter Buttons */}
            <div className="mb-6 flex flex-wrap gap-2">
              <Button
                variant={activeCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory("all")}
              >
                All Types
              </Button>
              {contractCategories.map((category) => (
                <Button
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveCategory(category.id)}
                >
                  <category.icon className="mr-2 h-4 w-4" />
                  {category.label}
                </Button>
              ))}
            </div>

            {/* Contract Type Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Object.keys(contractTypesConfig).length > 0 ? (
                Object.entries(contractTypesConfig).map(([category, types]) => (
                  <div key={category} className="space-y-3">
                    <h4 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">{category}</h4>
                    <div className="space-y-2">
                      {(types as any[]).map((type: any) => (
                        <div
                          key={type.id}
                          className={`cursor-pointer rounded-lg border p-3 transition-all duration-200 hover:border-primary ${
                            selectedContractType === type.id ? "border-primary bg-primary/5" : ""
                          } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                          onClick={() => !isLoading && handleContractTypeSelect(type.id)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium">{type.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {type.fields.length} configured fields
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
                ))
              ) : (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  <FileText className="mx-auto h-12 w-12 mb-4 opacity-50" />
                  <p>No contract types found in this category.</p>
                  <p className="text-xs mt-1">Try selecting a different category or "All Types".</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* AI Insights and Recommendations */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8 }}>
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
                        {insight.type === "success" && <CheckCircle className="mt-0.5 h-4 w-4 text-green-600" />}
                        {insight.type === "warning" && <AlertTriangle className="mt-0.5 h-4 w-4 text-yellow-600" />}
                        {insight.type === "error" && <AlertTriangle className="mt-0.5 h-4 w-4 text-red-600" />}
                        {insight.type === "info" && <Info className="mt-0.5 h-4 w-4 text-blue-600" />}
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
                        <div className="mt-1 text-xs text-green-600">💰 Estimated savings: {rec.estimatedSavings}</div>
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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}>
        {useEnhancedForm ? (
          <DynamicEnhancedContractForm
            onSuccess={() => {
              setError(null)
              toast({
                title: "Contract Generated",
                description: "Your contract has been successfully generated and saved.",
              })
            }}
            onError={(error) => {
              console.error("Enhanced form error:", error)
              const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
              setError("Contract generation failed: " + errorMessage)
              toast({
                title: "Generation Failed",
                description: errorMessage,
                variant: "destructive",
              })
            }}
          />
        ) : (
          <DynamicUnifiedContractGeneratorForm
            mode="advanced"
            showAdvanced={true}
            autoRedirect={false}
            onFormSubmit={() => {
              setError(null)
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
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.0 }}>
          <DynamicContractIntelligence contractId={selectedContractType || "sample-contract-123"} />
        </motion.div>
      )}
    </motion.div>
    </AuthenticatedLayout>
  )
}