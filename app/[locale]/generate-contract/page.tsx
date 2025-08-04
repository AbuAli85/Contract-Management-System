"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-service"
import { useToast } from "@/hooks/use-toast"
import { useSessionTimeout } from "@/hooks/use-session-timeout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, FileText, Settings } from "lucide-react"
import EnhancedContractForm from "@/components/enhanced-contract-form"
import UnifiedContractGeneratorForm from "@/components/unified-contract-generator-form"

// Separate component for session timeout to avoid conditional hook calls
function SessionTimeoutHandler({ user }: { user: any }) {
  const { toast } = useToast()
  
  useSessionTimeout({
    timeoutMinutes: 5,
    onTimeout: () => {
      toast({
        title: "Session Expired",
        description: "You have been automatically logged out due to inactivity.",
        variant: "destructive",
      })
    }
  })

  return null
}

export default function GenerateContractPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const params = useParams()
  const locale = (params?.locale as string) || "en"

  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedForm, setSelectedForm] = useState<string>("unified")
  const [isClient, setIsClient] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    // Set client flag
    setIsClient(true)
    
    // Ensure all hooks and contexts are properly initialized
    const initTimer = setTimeout(() => {
      setIsInitialized(true)
    }, 100)
    
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => {
      clearTimeout(timer)
      clearTimeout(initTimer)
    }
  }, [])

  // Don't render anything until properly initialized
  if (!isInitialized) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Contract
            </CardTitle>
            <CardDescription>
              Initializing contract generation tools...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Generate Contract
            </CardTitle>
            <CardDescription>
              Loading contract generation tools...
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Error Loading Contract Generator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
            <div className="mt-4 flex gap-2">
              <Button onClick={() => window.location.reload()}>
                Try Again
              </Button>
              <Button variant="outline" onClick={() => window.location.href = `/${locale}/dashboard`}>
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6">
      {/* Session timeout handler - only render on client side when user exists */}
      {isClient && user && <SessionTimeoutHandler user={user} />}
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Contract
          </CardTitle>
          <CardDescription>
            Choose your contract generation method
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className={`cursor-pointer transition-all ${
                selectedForm === "unified" 
                  ? "border-primary bg-primary/5" 
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedForm("unified")}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Unified Contract Generator
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Advanced contract generation with Make.com integration and comprehensive form validation.
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${
                selectedForm === "enhanced" 
                  ? "border-primary bg-primary/5" 
                  : "hover:border-primary/50"
              }`}
              onClick={() => setSelectedForm("enhanced")}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Enhanced Contract Form
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Feature-rich contract form with AI insights and advanced validation.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Selected Form Display */}
          <div className="mt-6">
            <Alert>
              <FileText className="h-4 w-4" />
              <AlertDescription>
                {selectedForm === "unified" 
                  ? "Unified Contract Generator selected - This form is integrated with Make.com backend and supports the Extra Contracts Template."
                  : "Enhanced Contract Form selected - This form includes AI insights and advanced validation features."
                }
              </AlertDescription>
            </Alert>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button 
              onClick={() => {
                toast({
                  title: "Form Selected",
                  description: `${selectedForm === "unified" ? "Unified" : "Enhanced"} contract form is ready to use.`,
                })
              }}
            >
              Continue with {selectedForm === "unified" ? "Unified" : "Enhanced"} Form
            </Button>
            <Button variant="outline" onClick={() => window.location.href = `/${locale}/dashboard`}>
              Back to Dashboard
            </Button>
          </div>

          {/* Form Display */}
          {selectedForm === "unified" && (
            <div className="mt-6">
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
            </div>
          )}

          {selectedForm === "enhanced" && (
            <div className="mt-6">
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
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

