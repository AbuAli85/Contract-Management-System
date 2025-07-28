'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function TestRedirectPage() {
  const [countdown, setCountdown] = useState(5)
  const [redirecting, setRedirecting] = useState(false)

  const testRedirect = () => {
    setRedirecting(true)
    console.log('🧪 Test: Redirecting to dashboard...')
    window.location.href = '/en/dashboard'
  }

  const testRouterRedirect = () => {
    setRedirecting(true)
    console.log('🧪 Test: Using router to redirect...')
    // This will be handled by the middleware
    window.location.href = '/en/auth/login'
  }

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (countdown === 0) {
      console.log('🧪 Test: Auto-redirecting to dashboard...')
      window.location.href = '/en/dashboard'
    }
  }, [countdown])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Redirect Test Page</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <p className="text-lg mb-4">
              {countdown > 0 
                ? `Auto-redirecting to dashboard in ${countdown} seconds...`
                : 'Redirecting...'
              }
            </p>
            
            <div className="space-y-2">
              <Button 
                onClick={testRedirect} 
                disabled={redirecting}
                className="w-full"
              >
                Test Direct Redirect to Dashboard
              </Button>
              
              <Button 
                onClick={testRouterRedirect} 
                disabled={redirecting}
                variant="outline"
                className="w-full"
              >
                Test Redirect to Login (should redirect to dashboard if authenticated)
              </Button>
            </div>

            <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
              <p><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Loading...'}</p>
              <p><strong>Status:</strong> {redirecting ? 'Redirecting...' : 'Ready'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 