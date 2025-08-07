import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

export class DOMErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    // Check if this is a DOM manipulation error
    const isDOMError = error.message.includes('insertBefore') || 
                      error.message.includes('removeChild') ||
                      error.message.includes('replaceChild') ||
                      error.message.includes('appendChild') ||
                      error.message.includes('Failed to execute')

    if (isDOMError) {
      console.warn('DOM manipulation error caught by boundary:', error.message)
      return { hasError: true, error }
    }

    // For non-DOM errors, let them propagate
    return { hasError: false }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log the error for debugging
    console.error('DOM Error Boundary caught an error:', error, errorInfo)

    // Call the onError callback if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }

    // For DOM errors, we can try to recover by forcing a re-render
    if (error.message.includes('insertBefore') || 
        error.message.includes('removeChild') ||
        error.message.includes('replaceChild') ||
        error.message.includes('appendChild') ||
        error.message.includes('Failed to execute')) {
      
      console.log('Attempting to recover from DOM error...')
      
      // Wait a bit and try to recover
      setTimeout(() => {
        this.setState({ hasError: false, error: undefined })
      }, 100)
    }
  }

  render() {
    if (this.state.hasError) {
      // Show fallback UI or a simple error message
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="p-4 border border-red-200 bg-red-50 rounded-md">
          <h3 className="text-sm font-medium text-red-800">
            Component temporarily unavailable
          </h3>
          <p className="mt-1 text-sm text-red-700">
            This component encountered a temporary issue and is being restored.
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: undefined })}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Try again
          </button>
        </div>
      )
    }

    return this.props.children
  }
}

// Hook version for functional components
export function useDOMErrorHandler() {
  const [hasError, setHasError] = React.useState(false)
  const [error, setError] = React.useState<Error | null>(null)

  const handleError = React.useCallback((error: Error) => {
    const isDOMError = error.message.includes('insertBefore') || 
                      error.message.includes('removeChild') ||
                      error.message.includes('replaceChild') ||
                      error.message.includes('appendChild') ||
                      error.message.includes('Failed to execute')

    if (isDOMError) {
      console.warn('DOM error handled by hook:', error.message)
      setError(error)
      setHasError(true)

      // Try to recover after a short delay
      setTimeout(() => {
        setHasError(false)
        setError(null)
      }, 100)
    }
  }, [])

  return {
    hasError,
    error,
    handleError,
    resetError: () => {
      setHasError(false)
      setError(null)
    }
  }
} 