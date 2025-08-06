"use client"

import { Suspense } from "react"
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// Simple loading component
const LoadingForm = () => (
  <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading Contract Generator
        </CardTitle>
        <CardDescription>
          Please wait while we load the contract generation form...
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Initializing form components...</p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
)

// Dynamic import with error handling
const UnifiedContractGeneratorForm = dynamic(
  () => import("@/components/unified-contract-generator-form"),
  { 
    loading: LoadingForm,
    ssr: false 
  }
)

export default function GenerateContractPage() {
  return (
    <div className="min-h-screen bg-gray-50/30">
      <div className="container mx-auto py-6">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Generate New Contract
          </h1>
          <p className="text-gray-600">
            Create comprehensive employment contracts with intelligent templates
          </p>
        </div>
        
        <Suspense fallback={<LoadingForm />}>
          <UnifiedContractGeneratorForm 
            mode="advanced"
            autoRedirect={false}
            showAdvanced={false}
          />
        </Suspense>
      </div>
    </div>
  )
}