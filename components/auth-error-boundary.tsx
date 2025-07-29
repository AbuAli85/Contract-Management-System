'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, RefreshCw, Home, LogOut } from 'lucide-react'
import { useAuth } from '@/src/components/auth/auth-provider'
import { useRouter } from 'next/navigation'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  resetOnPropsChange?: boolean
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('🔴 AuthErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error,
      errorInfo
    })

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // Log to error reporting service in production
    if (process.env.NODE_ENV === 'production') {
      // You can integrate with services like Sentry, LogRocket, etc.
      console.error('Production error:', {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString()
      })
    }
  }

  componentDidUpdate(prevProps: Props) {
    // Reset error state when props change if resetOnPropsChange is true
    if (this.props.resetOnPropsChange && prevProps !== this.props) {
      this.setState({ hasError: false, error: undefined, errorInfo: undefined })
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // You can render any custom fallback UI
      return this.props.fallback || <AuthErrorFallback error={this.state.error} onReset={this.handleReset} />
    }

    return this.props.children
  }
}

interface AuthErrorFallbackProps {
  error?: Error
  onReset: () => void
}

function AuthErrorFallback({ error, onReset }: AuthErrorFallbackProps) {
  const { signOut } = useAuth()
  const router = useRouter()

  const handleSignOut = async () => {
    try {
      await signOut()
      router.push('/auth/login')
    } catch (error) {
      console.error('Error signing out:', error)
      // Force redirect even if signOut fails
      router.push('/auth/login')
    }
  }

  const handleGoHome = () => {
    router.push('/dashboard')
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-xl font-semibold text-gray-900">
            Authentication Error
          </CardTitle>
          <CardDescription className="text-gray-600">
            Something went wrong with the authentication system. Please try one of the options below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-3">
              <p className="text-sm text-red-700">
                <strong>Error:</strong> {error.message}
              </p>
              {process.env.NODE_ENV === 'development' && error.stack && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-red-600">Show stack trace</summary>
                  <pre className="mt-2 text-xs text-red-600 whitespace-pre-wrap">{error.stack}</pre>
                </details>
              )}
            </div>
          )}
          
          <div className="space-y-3">
            <Button 
              onClick={onReset} 
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            
            <Button 
              onClick={handleRefresh} 
              className="w-full"
              variant="outline"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Page
            </Button>
            
            <Button 
              onClick={handleGoHome} 
              className="w-full"
              variant="outline"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
            
            <Button 
              onClick={handleSignOut} 
              className="w-full"
              variant="destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </div>
          
          <div className="text-center text-xs text-gray-500">
            <p>If the problem persists, please contact support.</p>
            <p className="mt-1">Error ID: {Date.now()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Hook to use error boundary functionality
export function useAuthErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error, errorInfo: ErrorInfo) => {
    setError(error)
    console.error('Auth error caught by hook:', error, errorInfo)
  }, [])

  const resetError = React.useCallback(() => {
    setError(null)
  }, [])

  return {
    error,
    handleError,
    resetError,
    hasError: !!error
  }
}

// Higher-order component to wrap components with error boundary
export function withAuthErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithAuthErrorBoundary(props: P) {
    return (
      <AuthErrorBoundary fallback={fallback}>
        <Component {...props} />
      </AuthErrorBoundary>
    )
  }
}

// Specific error boundary for auth forms
export function AuthFormErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <AuthErrorBoundary
      fallback={
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Authentication Form Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>There was an error with the authentication form. Please try refreshing the page.</p>
              </div>
              <div className="mt-4">
                <Button
                  onClick={() => window.location.reload()}
                  size="sm"
                  variant="outline"
                >
                  Refresh Page
                </Button>
              </div>
            </div>
          </div>
        </div>
      }
    >
      {children}
    </AuthErrorBoundary>
  )
}