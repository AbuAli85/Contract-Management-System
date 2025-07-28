// app/[locale]/generate-contract/page.tsx
"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { useAuth } from "@/src/components/auth/auth-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Settings, Sparkles, FileText, Info, CheckCircle, AlertTriangle } from "lucide-react"
import EnhancedContractForm from "@/components/enhanced-contract-form"


// Enhanced utilities for contract insights
import { 
  analyzeContractDuration, 
  validateContractData,
  formatDuration,
  getContractTypeRecommendations 
} from "@/lib/contract-utils"
import { CONTRACT_FORM_SECTIONS, getRequiredFields } from "@/lib/schema-generator"
import { CONTRACT_TYPES } from "@/constants/contract-options"
import { getContractTypesByCategory, getEnhancedContractTypeConfig, contractTypes, type ContractTypeConfig } from "@/lib/contract-type-config"

// Contract insights component
function ContractInsights() {
  const [insights, setInsights] = useState({
    totalRequiredFields: 0,
    completedFields: 0,
    completionPercentage: 0,
    recommendations: [] as string[]
  })

  useEffect(() => {
    const requiredFields = getRequiredFields()
    const recommendations = [
      "Ensure all party information is accurate and up-to-date",
      "Verify contract dates align with business requirements", 
      "Review job title and department classifications",
      "Confirm work location and arrangement details"
    ]

    setInsights({
      totalRequiredFields: requiredFields.length,
      completedFields: 0,
      completionPercentage: 0,
      recommendations
    })
  }, [])

  return (
    <Card className="bg-blue-50/50 border-blue-200">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Info className="h-5 w-5 text-blue-600" />
          Contract Generation Insights
        </CardTitle>
        <CardDescription>
          Smart recommendations and validation insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span>Form Completion</span>
            <span className="font-medium">{insights.completionPercentage}%</span>
          </div>
          <Progress value={insights.completionPercentage} className="h-2" />
          <p className="text-xs text-muted-foreground">
            {insights.completedFields} of {insights.totalRequiredFields} required fields completed
          </p>
        </div>

        <div className="space-y-2">
          <h4 className="font-medium text-sm flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            Best Practices
          </h4>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {insights.recommendations.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-green-600 font-bold">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            All contracts are validated against Oman labor law requirements and business standards.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )
}

// Form sections overview component
function FormSectionsOverview() {
  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Form Sections
        </CardTitle>
        <CardDescription>
          Overview of contract generation sections
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CONTRACT_FORM_SECTIONS.map((section, index) => (
            <div
              key={section.id}
              className={`p-3 rounded-lg border transition-all ${
                section.required 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-muted/30 border-muted'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                  section.required 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted-foreground text-muted'
                }`}>
                  {index + 1}
                </div>
                <h4 className="font-medium text-sm">{section.title}</h4>
                {section.required && (
                  <Badge variant="secondary" className="text-xs">Required</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">{section.description}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {section.fields.length} field{section.fields.length !== 1 ? 's' : ''}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Contract Types Overview component
function ContractTypesOverview() {
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [selectedType, setSelectedType] = useState<string | null>(null)

  const categories = ['employment', 'service', 'freelance', 'consulting', 'partnership', 'nda', 'custom']
  
  const getDisplayedTypes = () => {
    if (selectedCategory === "all") {
      return contractTypes
    }
    return getContractTypesByCategory(selectedCategory)
  }

  const displayedTypes = getDisplayedTypes()

  return (
    <Card>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <FileText className="h-5 w-5 text-primary" />
          Contract Types
          <Badge variant="secondary">{contractTypes.length} Types</Badge>
        </CardTitle>
        <CardDescription>
          Each contract type has unique templates, fields, and business rules
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Category Filter */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedCategory === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedCategory("all")}
            className="text-xs"
          >
            All Types
          </Button>
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(category)}
              className="text-xs"
            >
              {category}
            </Button>
          ))}
        </div>

        {/* Contract Types Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
          {displayedTypes.map((config) => (
            <div
              key={config.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer hover:bg-muted/50 ${
                selectedType === config.id ? 'ring-2 ring-primary' : 'bg-muted/20'
              }`}
              onClick={() => setSelectedType(selectedType === config.id ? null : config.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-sm">{config.name}</h4>
                    {config.category === 'employment' && (
                      <Badge className="text-xs border border-input bg-background">Employment</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{config.description}</p>
                  
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">Required Fields:</span>
                      <Badge className="text-xs bg-secondary text-secondary-foreground">
                        {config.validation?.requiredFields?.length || 0}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-medium">Total Fields:</span>
                      <Badge className="text-xs bg-secondary text-secondary-foreground">
                        {config.fields?.length || 0}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {selectedType === config.id && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  <div>
                    <h5 className="text-xs font-medium mb-1">Required Fields:</h5>
                    <div className="flex flex-wrap gap-1">
                      {config.validation?.requiredFields?.slice(0, 4).map((field, idx) => (
                        <Badge key={idx} className="text-xs border border-input bg-background">
                          {field}
                        </Badge>
                      ))}
                      {(config.validation?.requiredFields?.length || 0) > 4 && (
                        <Badge className="text-xs border border-input bg-background">
                          +{(config.validation?.requiredFields?.length || 0) - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h5 className="text-xs font-medium mb-1">Field Types:</h5>
                    <div className="flex flex-wrap gap-1">
                      {config.fields?.slice(0, 4).map((field, idx) => (
                        <Badge key={idx} className="text-xs border border-input bg-background">
                          {field.type}
                        </Badge>
                      ))}
                      {(config.fields?.length || 0) > 4 && (
                        <Badge className="text-xs border border-input bg-background">
                          +{(config.fields?.length || 0) - 4} more
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-1">
                    {config.category === 'employment' && <Badge className="text-xs border border-input bg-background">Employment</Badge>}
                    {config.requiresApproval && <Badge className="text-xs border border-input bg-background">Requires Approval</Badge>}
                    {config.isActive && <Badge className="text-xs border border-input bg-background">Active</Badge>}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="text-center text-xs text-muted-foreground">
          Click on any contract type to see detailed requirements and business rules
        </div>
      </CardContent>
    </Card>
  )
}

export default function GenerateContractPage() {
  const [useEnhancedForm, setUseEnhancedForm] = useState(false) // Default to standard form
  const [showInsights, setShowInsights] = useState(true)
  const pathname = usePathname()
  const locale = pathname && pathname.startsWith('/en/') ? 'en' : pathname && pathname.startsWith('/ar/') ? 'ar' : 'en'
  
  // Add authentication check
  const { user, loading } = useAuth()
  
  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please log in to access the contract generation page.</p>
          <Button asChild>
            <Link href="/login">Go to Login</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="space-y-6"
      >
      {/* Header */}
      <div className="text-center space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h1 className="font-heading text-3xl font-bold md:text-4xl">
            Create New Contract
          </h1>
          <p className="text-lg text-muted-foreground mt-2">
            Generate professional bilingual contracts with enhanced validation and insights
          </p>
        </motion.div>

        {/* Form Type Selector */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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

        {/* Feature Comparison */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto"
        >
          <Card className={`relative transition-all ${!useEnhancedForm ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Standard Form
                {!useEnhancedForm && <Badge variant="default">Active</Badge>}
              </CardTitle>
              <CardDescription>
                Enhanced with advanced validation and business rules
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ul className="space-y-1 text-muted-foreground">
                <li>✓ Enhanced schema validation</li>
                <li>✓ Business rule enforcement</li>
                <li>✓ Smart field requirements</li>
                <li>✓ Date validation & constraints</li>
                <li>✓ Comprehensive error handling</li>
                <li>✓ Ready for production use</li>
              </ul>
            </CardContent>
          </Card>

          <Card className={`relative transition-all ${useEnhancedForm ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-muted-foreground" />
                Enhanced Form
                {useEnhancedForm && <Badge variant="default">Active</Badge>}
              </CardTitle>
              <CardDescription>
                Advanced interface with sectioned workflow (In Development)
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <ul className="space-y-1 text-muted-foreground">
                <li>• Sectioned form with progress tracking</li>
                <li>• Real-time contract insights</li>
                <li>• Smart auto-completion</li>
                <li>• Salary recommendations</li>
                <li>• Advanced analytics</li>
                <li>• Coming soon...</li>
              </ul>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Insights and Form Sections Overview */}
      {showInsights && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          <ContractInsights />
          <FormSectionsOverview />
          <ContractTypesOverview />
        </motion.div>
      )}

      {/* Enhanced Contract Generation Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="rounded-lg bg-card shadow-xl"
      >
        <div className="p-6 md:p-8">
          <EnhancedContractForm 
            onSuccess={(contractId) => {
              console.log('Contract generated successfully:', contractId)
            }}
            onError={(error) => {
              console.error('Contract generation failed:', error)
            }}
          />
        </div>
      </motion.div>

      {/* Help Section */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center space-y-4"
      >
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Enhanced Validation & Insights</h3>
            </div>
            <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
              Our contract generation system now includes enhanced schema validation with comprehensive 
              business rules, improved error handling, and smart field requirements. Choose from {contractTypes.length} different 
              contract types, each with unique templates, placeholders, and validation rules. The form automatically 
              validates dates, party relationships, and ensures all critical information is captured correctly.
            </p>
            <div className="mt-4 flex flex-wrap justify-center gap-2">
              <Badge variant="outline">Enhanced Schema</Badge>
              <Badge variant="outline">Business Rules</Badge>
              <Badge variant="outline">{contractTypes.length} Contract Types</Badge>
              <Badge variant="outline">Smart Validation</Badge>
              <Badge variant="outline">Error Prevention</Badge>
              <Badge variant="outline">Oman Compliance</Badge>
            </div>
            <div className="mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowInsights(!showInsights)}
              >
                {showInsights ? 'Hide' : 'Show'} Contract Insights
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </motion.div>
  )
}

// Force dynamic rendering to prevent SSR issues with useAuth
export const dynamic = 'force-dynamic'
