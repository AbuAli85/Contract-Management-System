"use client"

import { Suspense, Component } from "react"
import dynamic from 'next/dynamic'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

// Custom Error Boundary component
class ErrorBoundary extends Component<
  { children: React.ReactNode; fallback?: React.ComponentType<{ error: Error; resetErrorBoundary: () => void }> },
  { hasError: boolean; error?: Error }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Contract Generator Page Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || ErrorFallback
      return <FallbackComponent error={this.state.error!} resetErrorBoundary={() => this.setState({ hasError: false })} />
    }
    return this.props.children
  }
}

// Error fallback component
function ErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Loader2 className="h-5 w-5" />
            Contract Generator Error
          </CardTitle>
          <CardDescription>
            There was an error loading the contract generator.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-medium text-red-800 mb-2">Error Details:</h3>
              <p className="text-sm text-red-700">{error.message}</p>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={resetErrorBoundary}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Try Again
              </button>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Reload Page
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

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

// Dynamic import with enhanced error handling
const UnifiedContractGeneratorForm = dynamic(
  () => import("@/components/unified-contract-generator-form").catch(error => {
    console.error('Failed to load contract generator form:', error)
    return {
      default: () => (
        <div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Component Load Error</CardTitle>
              <CardDescription>
                Failed to load the contract generator form component.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Error: {error.message}
              </p>
              <button 
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Reload Page
              </button>
            </CardContent>
          </Card>
        </div>
      )
    }
  }),
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
        
        <ErrorBoundary fallback={ErrorFallback}>
          <Suspense fallback={<LoadingForm />}>
            <UnifiedContractGeneratorForm 
              mode="advanced"
              autoRedirect={false}
              showAdvanced={false}
            />
          </Suspense>
        </ErrorBoundary>
      </div>
    </div>
  )
}