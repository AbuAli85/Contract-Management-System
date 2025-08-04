"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useAuth } from "@/lib/auth-service"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle, FileText, Settings } from "lucide-react"

export default function GenerateContractPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const pathname = usePathname()
  const locale = pathname?.split("/")[1] || "en"

  // State management
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedForm, setSelectedForm] = useState<string>("unified")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    // Set client flag
    setIsClient(true)
    
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Contract - UI Components Test
          </CardTitle>
          <CardDescription>
            Testing UI components to isolate initialization errors
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

          {/* Form Display - Temporarily disabled */}
          <div className="mt-6">
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Form components are temporarily disabled to isolate the initialization error. 
                If this page loads without errors, the issue is in the form components.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

