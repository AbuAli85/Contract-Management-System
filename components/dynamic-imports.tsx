"use client"

import React, { Suspense, lazy } from "react"
import { Loader2 } from "lucide-react"

// Loading component for dynamic imports
const DynamicLoading = () => (
  <div className="flex items-center justify-center p-4">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
  </div>
)

// Dynamic imports for heavy components
export const DynamicContractsTable = lazy(() => 
  import("./contracts/ContractsTable")
)

export const DynamicContractGeneratorForm = lazy(() => 
  import("./unified-contract-generator-form")
)

export const DynamicDashboard = lazy(() => 
  import("./dashboard")
)

// Wrapper component for dynamic imports with Suspense
export const withSuspense = <P extends object>(
  Component: React.ComponentType<P>,
  fallback?: React.ReactNode
) => {
  const WrappedComponent = (props: P) => (
    <Suspense fallback={fallback || <DynamicLoading />}>
      <Component {...props} />
    </Suspense>
  )
  
  WrappedComponent.displayName = `withSuspense(${Component.displayName || Component.name})`
  return WrappedComponent
}

// Simple preload function
export const preloadComponent = (importFn: () => Promise<unknown>) => {
  return () => {
    importFn()
  }
}

// Export preload functions
export const preloadContractsTable = preloadComponent(() => 
  import("./contracts/ContractsTable")
)

export const preloadContractGenerator = preloadComponent(() => 
  import("./unified-contract-generator-form")
)

export const preloadDashboard = preloadComponent(() => 
  import("./dashboard")
) 