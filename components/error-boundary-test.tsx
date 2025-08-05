"use client"

import React from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, CheckCircle } from 'lucide-react'

class TestErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Test Error Boundary caught:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div>
                <h3 className="font-semibold text-red-800">Error Boundary Active</h3>
                <p className="text-sm text-red-700">
                  Error caught: {this.state.error?.message}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}

function ThrowErrorComponent() {
  const [shouldThrow, setShouldThrow] = React.useState(false)

  if (shouldThrow) {
    throw new Error('Test error for error boundary validation')
  }

  return (
    <Button 
      onClick={() => setShouldThrow(true)}
      variant="destructive"
    >
      Test Error Boundary
    </Button>
  )
}

export default function ErrorBoundaryTest() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Error Boundary Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-4">
            This component tests if error boundaries are working correctly.
          </p>
          
          <TestErrorBoundary>
            <ThrowErrorComponent />
          </TestErrorBoundary>
        </CardContent>
      </Card>
    </div>
  )
}
