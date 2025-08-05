"use client"

import { useState, useCallback, useEffect } from "react"
import { usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import dynamic from 'next/dynamic'

// UI Components first (these are usually safe)
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { useToast } from "@/components/ui/use-toast"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"

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
  Clock,
  Shield,
  Zap,
  TrendingUp,
  Star,
  ArrowRight,
  Filter,
  Settings,
  Download,
  Eye,
  Edit3,
  Calendar,
  DollarSign,
  Globe,
  BookOpen,
  Target,
  Award,
  Lightbulb,
  Rocket,
  BarChart3,
  ChevronRight,
  Home,
  Building,
  FileCheck,
  BarChart,
  Cog
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

// Enhanced Feature comparison component
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
  <motion.div
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    transition={{ duration: 0.2 }}
  >
    <Card
      className={`relative overflow-hidden border-2 transition-all duration-300 cursor-pointer group ${
        isSelected 
          ? "border-blue-500 bg-blue-50/50 shadow-lg ring-2 ring-blue-500/20" 
          : "border-slate-200 hover:border-blue-300 hover:shadow-md bg-white/70 backdrop-blur-sm"
      }`}
      onClick={onClick}
    >
      {/* Selection Indicator */}
      {isSelected && (
        <div className="absolute top-4 right-4 p-1 bg-blue-500 rounded-full">
          <CheckCircle className="h-4 w-4 text-white" />
        </div>
      )}
      
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-blue-50/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      
      <CardHeader className="relative z-10 pb-4">
        <CardTitle className="flex items-center gap-3 text-xl">
          <div className={`p-2 rounded-lg ${
            formType.title === "Production Ready" 
              ? "bg-green-100 text-green-600" 
              : "bg-purple-100 text-purple-600"
          }`}>
            {formType.title === "Production Ready" ? (
              <Shield className="h-5 w-5" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
          </div>
          <div>
            <div className="font-semibold">{formType.title}</div>
            <Badge 
              variant={formType.status === "active" ? "default" : "secondary"}
              className="mt-1"
            >
              {formType.status === "active" ? "Ready" : "Preview"}
            </Badge>
          </div>
        </CardTitle>
        <CardDescription className="text-base leading-relaxed">
          {formType.description}
        </CardDescription>
      </CardHeader>
      <CardContent className="relative z-10 pt-0">
        <div className="space-y-3">
          {formType.features.map((feature, index) => (
            <motion.div 
              key={index} 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <div className="p-1 bg-green-100 rounded-full">
                <CheckCircle className="h-3 w-3 text-green-600" />
              </div>
              <span className="text-sm text-slate-700">{feature}</span>
            </motion.div>
          ))}
        </div>
        
        {/* Action Button */}
        <Button 
          variant={isSelected ? "default" : "outline"} 
          className="w-full mt-6 group-hover:shadow-md transition-all"
        >
          {isSelected ? (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Currently Selected
            </>
          ) : (
            <>
              <ArrowRight className="mr-2 h-4 w-4" />
              Select This Option
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  </motion.div>
)

// Enhanced Feature comparison data
const featureComparison = {
  standard: {
    title: "Production Ready",
    description: "Battle-tested form with enterprise-grade validation and full compliance support",
    features: [
      "Advanced schema validation with real-time feedback",
      "Complete Oman labor law compliance checking", 
      "Smart field requirements with conditional logic",
      "Multi-language support (Arabic & English)",
      "Comprehensive error handling & recovery",
      "Enterprise security & data protection",
      "Bulk processing & template management",
      "Full audit trail & change tracking",
    ],
    status: "active" as const,
  },
  enhanced: {
    title: "Advanced Preview",
    description: "Next-generation interface with AI-powered insights and modern workflow design",
    features: [
      "Sectioned workflow with intelligent progress tracking",
      "AI-powered contract analysis & recommendations",
      "Smart auto-completion with historical data",
      "Dynamic salary & benefit recommendations", 
      "Advanced analytics & performance insights",
      "Modern UI with enhanced user experience",
      "Predictive field completion",
      "Advanced collaboration tools (Coming Soon)",
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
  const [activeTab, setActiveTab] = useState<string>("overview")
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

  // Tab configuration for professional navigation
  const tabsConfig = [
    {
      id: "overview",
      label: "Overview",
      icon: Home,
      description: "Dashboard and quick start"
    },
    {
      id: "templates",
      label: "Templates",
      icon: FileText,
      description: "Browse contract templates"
    },
    {
      id: "generator",
      label: "Generate Contract",
      icon: Edit3,
      description: "Create new contract"
    },
    {
      id: "analytics",
      label: "Analytics",
      icon: BarChart,
      description: "Insights and recommendations"
    },
    {
      id: "settings",
      label: "Settings",
      icon: Cog,
      description: "Configure preferences"
    }
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

  // EARLY RETURNS MOVED AFTER ALL HOOKS
  // Early return for loading states
  if (configLoading) {
    return (
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
    )
  }

  // Early return for error states
  if (configError) {
    return (
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
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-8"
        >
          {/* Error Display */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -20, scale: 0.95 }} 
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.3 }}
              >
                <Alert variant="destructive" className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-5 w-5" />
                  <AlertDescription className="ml-2">
                    {error}
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-4 h-8"
                      onClick={() => {
                        setError(null)
                        window.location.reload()
                      }}
                    >
                      <Zap className="mr-2 h-3 w-3" />
                      Retry
                    </Button>
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Hero Header Section */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1, duration: 0.6 }}
            className="relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-purple-600/5 to-indigo-600/10 rounded-3xl"></div>
            <div className="relative bg-white/70 backdrop-blur-sm rounded-3xl border border-white/20 shadow-xl p-12">
              {/* Background Pattern */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full -translate-y-48 translate-x-48"></div>
              
              <div className="relative z-10 text-center space-y-6">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.6 }}
                >
                  <div className="flex items-center justify-center mb-4">
                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                      <Rocket className="h-8 w-8 text-white" />
                    </div>
                  </div>
                  <h1 className="font-heading text-4xl font-bold md:text-5xl lg:text-6xl bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 bg-clip-text text-transparent">
                    Advanced Contract Generator
                  </h1>
                  <p className="mt-4 text-lg md:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
                    Create professional bilingual contracts with AI-powered insights, advanced validation, 
                    and compliance with Oman labor law requirements
                  </p>
                </motion.div>

                {/* Stats Row */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8 max-w-2xl mx-auto"
                >
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">50+</div>
                    <div className="text-sm text-slate-600">Contract Templates</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">99.9%</div>
                    <div className="text-sm text-slate-600">Legal Compliance</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-indigo-600">3min</div>
                    <div className="text-sm text-slate-600">Average Generation</div>
                  </div>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Main Tabbed Interface */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                {/* Enhanced Tab Navigation */}
                <div className="border-b border-slate-200/60 bg-white/50 rounded-t-lg">
                  <TabsList className="grid grid-cols-5 w-full h-auto p-2 bg-transparent">
                    {tabsConfig.map((tab) => (
                      <TabsTrigger
                        key={tab.id}
                        value={tab.id}
                        className="flex flex-col items-center gap-2 p-4 h-auto data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                      >
                        <tab.icon className="h-5 w-5" />
                        <div className="text-center">
                          <div className="text-sm font-medium">{tab.label}</div>
                          <div className="text-xs text-slate-500 hidden md:block">{tab.description}</div>
                        </div>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {/* Tab Content */}
                <div className="p-6">
                  {/* Overview Tab */}
                  <TabsContent value="overview" className="mt-0 space-y-6">
                    <OverviewSection 
                      formProgress={formProgress}
                      insights={insights}
                      recommendations={recommendations}
                      bestPractices={bestPractices}
                    />
                  </TabsContent>

                  {/* Templates Tab */}
                  <TabsContent value="templates" className="mt-0 space-y-6">
                    <TemplatesSection
                      contractCategories={contractCategories}
                      activeCategory={activeCategory}
                      setActiveCategory={setActiveCategory}
                      contractTypesConfig={contractTypesConfig}
                      selectedContractType={selectedContractType}
                      handleContractTypeSelect={handleContractTypeSelect}
                      isLoading={isLoading}
                    />
                  </TabsContent>

                  {/* Generator Tab */}
                  <TabsContent value="generator" className="mt-0 space-y-6">
                    <GeneratorSection
                      useEnhancedForm={useEnhancedForm}
                      setUseEnhancedForm={setUseEnhancedForm}
                      featureComparison={featureComparison}
                      DynamicEnhancedContractForm={DynamicEnhancedContractForm}
                      DynamicUnifiedContractGeneratorForm={DynamicUnifiedContractGeneratorForm}
                      setError={setError}
                      toast={toast}
                    />
                  </TabsContent>

                  {/* Analytics Tab */}
                  <TabsContent value="analytics" className="mt-0 space-y-6">
                    <AnalyticsSection
                      showAIInsights={showAIInsights}
                      setShowAIInsights={setShowAIInsights}
                      selectedContractType={selectedContractType}
                      DynamicContractIntelligence={DynamicContractIntelligence}
                    />
                  </TabsContent>

                  {/* Settings Tab */}
                  <TabsContent value="settings" className="mt-0 space-y-6">
                    <SettingsSection />
                  </TabsContent>
                </div>
              </Tabs>
            </Card>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

// Section Components for Tabbed Interface
const OverviewSection = ({ 
  formProgress, 
  insights, 
  recommendations, 
  bestPractices 
}: {
  formProgress: FormProgress,
  insights: ContractInsight[],
  recommendations: SmartRecommendation[],
  bestPractices: string[]
}) => (
  <div className="grid gap-6 lg:grid-cols-3">
    {/* Real-time Insights */}
    <div className="lg:col-span-2">
      <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="text-xl">AI-Powered Insights</div>
              <div className="text-sm text-slate-500 font-normal">Real-time analysis and recommendations</div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Progress Tracking */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Target className="h-4 w-4 text-blue-500" />
                Form Completion Progress
              </span>
              <span className="text-sm text-slate-600">
                {formProgress.completed} of {formProgress.total} sections completed
              </span>
            </div>
            <div className="relative">
              <Progress value={formProgress.percentage} className="h-3 bg-slate-100" />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full opacity-80 transition-all duration-500 h-3"
                style={{ width: `${Math.min(formProgress.percentage, 100)}%` }}
              />
            </div>
            <div className="text-xs text-slate-500">
              {formProgress.percentage === 100 ? "🎉 Ready to generate!" : `${100 - formProgress.percentage}% remaining`}
            </div>
          </div>

          {/* Smart Insights Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {insights.map((insight, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * index }}
                className={`p-4 rounded-xl border-l-4 ${
                  insight.type === "success"
                    ? "border-green-400 bg-green-50/50"
                    : insight.type === "warning"
                      ? "border-yellow-400 bg-yellow-50/50"
                      : insight.type === "error"
                        ? "border-red-400 bg-red-50/50"
                        : "border-blue-400 bg-blue-50/50"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-1 rounded-lg ${
                    insight.type === "success" ? "bg-green-100" :
                    insight.type === "warning" ? "bg-yellow-100" :
                    insight.type === "error" ? "bg-red-100" : "bg-blue-100"
                  }`}>
                    {insight.type === "success" && <CheckCircle className="h-4 w-4 text-green-600" />}
                    {insight.type === "warning" && <AlertTriangle className="h-4 w-4 text-yellow-600" />}
                    {insight.type === "error" && <AlertTriangle className="h-4 w-4 text-red-600" />}
                    {insight.type === "info" && <Info className="h-4 w-4 text-blue-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{insight.title}</div>
                    <div className="text-xs text-slate-600 mt-1">{insight.description}</div>
                    <Badge variant="outline" className="mt-2 text-xs">
                      {insight.priority} priority
                    </Badge>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-200">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">98%</div>
              <div className="text-xs text-slate-600">Accuracy Rate</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-green-600">2.3min</div>
              <div className="text-xs text-slate-600">Avg. Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">15+</div>
              <div className="text-xs text-slate-600">Validations</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-indigo-600">24/7</div>
              <div className="text-xs text-slate-600">Support</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Quick Actions Sidebar */}
    <div className="space-y-6">
      {/* Smart Recommendations */}
      <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            Smart Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.slice(0, 3).map((rec, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="p-3 rounded-lg border border-slate-200 bg-white/50"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="text-sm font-medium">{rec.title}</div>
                <Badge variant="outline" className="text-xs">
                  {rec.impact}
                </Badge>
              </div>
              <div className="text-xs text-slate-600 mb-2">{rec.description}</div>
              {rec.estimatedSavings && (
                <div className="text-xs text-green-600 font-medium">
                  💰 Saves: {rec.estimatedSavings}
                </div>
              )}
            </motion.div>
          ))}
          <Button variant="outline" size="sm" className="w-full">
            <TrendingUp className="mr-2 h-3 w-3" />
            View All Insights
          </Button>
        </CardContent>
      </Card>

      {/* Best Practices */}
      <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Award className="h-5 w-5 text-blue-500" />
            Best Practices
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {bestPractices.slice(0, 4).map((practice, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                </div>
                <span className="text-xs text-slate-700">{practice}</span>
              </div>
            ))}
          </div>
          <Button variant="outline" size="sm" className="w-full mt-4">
            <BookOpen className="mr-2 h-3 w-3" />
            View Guide
          </Button>
        </CardContent>
      </Card>
    </div>
  </div>
)

const TemplatesSection = ({
  contractCategories,
  activeCategory,
  setActiveCategory,
  contractTypesConfig,
  selectedContractType,
  handleContractTypeSelect,
  isLoading
}: {
  contractCategories: any[],
  activeCategory: string,
  setActiveCategory: (category: string) => void,
  contractTypesConfig: Record<string, any[]>,
  selectedContractType: string,
  handleContractTypeSelect: (type: string) => void,
  isLoading: boolean
}) => (
  <div>
    <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <div>Professional Contract Templates</div>
            <div className="text-sm text-slate-500 font-normal">Choose from our comprehensive template library</div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Enhanced Filter Buttons */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Filter className="h-5 w-5 text-slate-500" />
            <span className="text-sm font-medium text-slate-700">Filter by Category:</span>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant={activeCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveCategory("all")}
              className={`${activeCategory === "all" ? "bg-gradient-to-r from-blue-600 to-purple-600" : ""}`}
            >
              <Globe className="mr-2 h-4 w-4" />
              All Templates
            </Button>
            {contractCategories.map((category) => (
              <Button
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveCategory(category.id)}
                className={`${activeCategory === category.id ? "bg-gradient-to-r from-blue-600 to-purple-600" : ""}`}
              >
                <category.icon className="mr-2 h-4 w-4" />
                {category.label}
                <Badge variant="secondary" className="ml-2 text-xs">
                  {category.count}
                </Badge>
              </Button>
            ))}
          </div>
        </div>

        {/* Enhanced Contract Type Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {Object.keys(contractTypesConfig).length > 0 ? (
            Object.entries(contractTypesConfig).map(([category, types]) => (
              <div key={category} className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-1 w-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                    {category}
                  </h4>
                </div>
                <div className="space-y-3">
                  {(types as any[]).map((type: any) => (
                    <motion.div
                      key={type.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={`group cursor-pointer rounded-xl border-2 p-4 transition-all duration-300 ${
                        selectedContractType === type.id 
                          ? "border-blue-500 bg-blue-50/50 shadow-lg ring-2 ring-blue-500/20" 
                          : "border-slate-200 hover:border-blue-300 hover:shadow-md bg-white/70"
                      } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
                      onClick={() => !isLoading && handleContractTypeSelect(type.id)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="font-semibold text-slate-900 group-hover:text-blue-900 transition-colors">
                            {type.name}
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                            <BarChart3 className="h-3 w-3" />
                            {type.fields.length} configured fields
                          </div>
                        </div>
                        {selectedContractType === type.id && (
                          <div className="p-1 bg-blue-500 rounded-full">
                            <CheckCircle className="h-4 w-4 text-white" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant="outline" 
                          className="text-xs bg-white/50"
                        >
                          {type.category}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Eye className="mr-1 h-3 w-3" />
                          Preview
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="p-4 bg-slate-50 rounded-full w-fit mx-auto mb-4">
                <FileText className="h-12 w-12 text-slate-400" />
              </div>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No Templates Found</h3>
              <p className="text-slate-600 mb-4">No contract types found in this category.</p>
              <Button variant="outline" onClick={() => setActiveCategory("all")}>
                <Globe className="mr-2 h-4 w-4" />
                View All Templates
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  </div>
)

const GeneratorSection = ({
  useEnhancedForm,
  setUseEnhancedForm,
  featureComparison,
  DynamicEnhancedContractForm,
  DynamicUnifiedContractGeneratorForm,
  setError,
  toast
}: {
  useEnhancedForm: boolean,
  setUseEnhancedForm: (value: boolean) => void,
  featureComparison: any,
  DynamicEnhancedContractForm: any,
  DynamicUnifiedContractGeneratorForm: any,
  setError: (error: string | null) => void,
  toast: any
}) => (
  <div className="space-y-6">
    {/* Form Type Selector */}
    <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
      <CardHeader className="text-center pb-6">
        <CardTitle className="flex items-center justify-center gap-2 text-2xl">
          <Settings className="h-6 w-6 text-blue-600" />
          Choose Your Experience
        </CardTitle>
        <CardDescription className="text-base">
          Select the form type that best suits your workflow and requirements
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={useEnhancedForm ? "enhanced" : "standard"} className="w-full">
          <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-slate-100/70">
            <TabsTrigger
              value="standard"
              onClick={() => setUseEnhancedForm(false)}
              className="flex items-center gap-3 h-12 text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Shield className="h-5 w-5" />
              Production Ready
            </TabsTrigger>
            <TabsTrigger
              value="enhanced"
              onClick={() => setUseEnhancedForm(true)}
              className="flex items-center gap-3 h-12 text-base data-[state=active]:bg-white data-[state=active]:shadow-sm"
            >
              <Sparkles className="h-5 w-5" />
              Advanced Preview
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </CardContent>
    </Card>

    {/* Enhanced Feature Comparison */}
    <div className="grid gap-6 md:grid-cols-2">
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
    </div>

    {/* Main Form */}
    <Card className="border-0 shadow-xl bg-white/70 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-3 text-2xl">
          <div className="p-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg">
            <Edit3 className="h-6 w-6 text-white" />
          </div>
          <div>
            <div>Contract Generation Form</div>
            <div className="text-sm text-slate-500 font-normal">
              {useEnhancedForm ? "Advanced Preview Interface" : "Production-Ready Interface"}
            </div>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {useEnhancedForm ? (
          <DynamicEnhancedContractForm
            onSuccess={() => {
              setError(null)
              toast({
                title: "🎉 Contract Generated Successfully",
                description: "Your contract has been generated and saved with all validations passed.",
              })
            }}
            onError={(error: any) => {
              console.error("Enhanced form error:", error)
              const errorMessage = error instanceof Error ? error.message : "An unknown error occurred."
              setError("Contract generation failed: " + errorMessage)
              toast({
                title: "❌ Generation Failed",
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
                title: "✅ Contract Saved Successfully",
                description: "Your contract has been saved and is ready for review.",
              })
            }}
          />
        )}
      </CardContent>
    </Card>
  </div>
)

const AnalyticsSection = ({
  showAIInsights,
  setShowAIInsights,
  selectedContractType,
  DynamicContractIntelligence
}: {
  showAIInsights: boolean,
  setShowAIInsights: (show: boolean) => void,
  selectedContractType: string,
  DynamicContractIntelligence: any
}) => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-2xl font-bold">AI Analytics & Intelligence</h2>
        <p className="text-slate-600">Advanced contract analytics and smart insights</p>
      </div>
      <Button
        variant="outline"
        onClick={() => setShowAIInsights(!showAIInsights)}
      >
        {showAIInsights ? "Hide" : "Show"} AI Insights
      </Button>
    </div>

    <AnimatePresence>
      {showAIInsights && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }} 
          animate={{ opacity: 1, y: 0 }} 
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6 }}
        >
          <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50/50 to-blue-50/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-2xl">
                <div className="p-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg">
                  <Brain className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div>AI Contract Intelligence</div>
                  <div className="text-sm text-slate-500 font-normal">Advanced analytics and smart recommendations</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DynamicContractIntelligence contractId={selectedContractType || "sample-contract-123"} />
            </CardContent>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  </div>
)

const SettingsSection = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-2xl font-bold">Contract Generator Settings</h2>
      <p className="text-slate-600">Configure your preferences and system settings</p>
    </div>

    <div className="grid gap-6 md:grid-cols-2">
      {/* Language Settings */}
      <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-500" />
            Language Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Default Language</label>
            <select className="w-full p-2 border border-slate-200 rounded-lg">
              <option value="en">English</option>
              <option value="ar">Arabic</option>
              <option value="bilingual">Bilingual</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Currency Format</label>
            <select className="w-full p-2 border border-slate-200 rounded-lg">
              <option value="omr">Omani Rial (OMR)</option>
              <option value="usd">US Dollar (USD)</option>
              <option value="eur">Euro (EUR)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Notifications
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Email Notifications</label>
            <input type="checkbox" className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Contract Reminders</label>
            <input type="checkbox" className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">AI Insights Alerts</label>
            <input type="checkbox" className="rounded" />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-500" />
            Security & Privacy
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Two-Factor Authentication</label>
            <Button variant="outline" size="sm">
              Enable 2FA
            </Button>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Data Retention</label>
            <select className="w-full p-2 border border-slate-200 rounded-lg">
              <option value="30">30 days</option>
              <option value="90">90 days</option>
              <option value="365">1 year</option>
              <option value="forever">Forever</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Settings */}
      <Card className="border-0 shadow-lg bg-white/60 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cog className="h-5 w-5 text-slate-500" />
            Advanced Options
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Debug Mode</label>
            <input type="checkbox" className="rounded" />
          </div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Auto-save Drafts</label>
            <input type="checkbox" className="rounded" defaultChecked />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Theme</label>
            <select className="w-full p-2 border border-slate-200 rounded-lg">
              <option value="light">Light</option>
              <option value="dark">Dark</option>
              <option value="auto">Auto</option>
            </select>
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Action Buttons */}
    <div className="flex gap-4 pt-6 border-t border-slate-200">
      <Button className="bg-gradient-to-r from-blue-600 to-purple-600">
        Save Settings
      </Button>
      <Button variant="outline">
        Reset to Defaults
      </Button>
      <Button variant="outline">
        Export Configuration
      </Button>
    </div>
  </div>
)