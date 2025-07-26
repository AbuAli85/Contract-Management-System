'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'

export default function AuthCallbackPage() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('Processing authentication...')
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          setStatus('error')
          setMessage('Authentication failed. Please try again.')
          return
        }

        if (data.session) {
          setStatus('success')
          setMessage('Authentication successful! Redirecting to dashboard...')
          
          // Redirect to dashboard after a short delay
          setTimeout(() => {
            router.push('/en/dashboard')
          }, 2000)
        } else {
          // Check if this is an email confirmation
          const code = searchParams.get('code')
          const next = searchParams.get('next') || '/en/dashboard'
          
          if (code) {
            const { data: confirmData, error: confirmError } = await supabase.auth.exchangeCodeForSession(code)
            
            if (confirmError) {
              console.error('Email confirmation error:', confirmError)
              setStatus('error')
              setMessage('Email confirmation failed. Please try again.')
              return
            }

            if (confirmData.session) {
              setStatus('success')
              setMessage('Email confirmed successfully! Redirecting to dashboard...')
              
              setTimeout(() => {
                router.push(next)
              }, 2000)
            }
          } else {
            setStatus('error')
            setMessage('No authentication code found.')
          }
        }
      } catch (err) {
        console.error('Unexpected error:', err)
        setStatus('error')
        setMessage('An unexpected error occurred.')
      }
    }

    handleAuthCallback()
  }, [router, searchParams, supabase.auth])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {status === 'loading' && (
                <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
              )}
              {status === 'success' && (
                <CheckCircle className="h-12 w-12 text-green-600" />
              )}
              {status === 'error' && (
                <XCircle className="h-12 w-12 text-red-600" />
              )}
            </div>
            <CardTitle className="text-2xl">
              {status === 'loading' && 'Processing...'}
              {status === 'success' && 'Success!'}
              {status === 'error' && 'Error'}
            </CardTitle>
            <CardDescription className="text-center">
              {message}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            {status === 'error' && (
              <Button onClick={() => router.push('/en/auth/login')}>
                Go to Login
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 