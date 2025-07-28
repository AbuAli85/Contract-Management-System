'use client'

import { useState, useEffect } from 'react'

export default function DebugSystemPage() {
  const [errors, setErrors] = useState<string[]>([])
  const [status, setStatus] = useState<string>('Checking...')

  useEffect(() => {
    const checkSystem = async () => {
      const issues: string[] = []
      
      try {
        // Test 1: Basic React functionality
        setStatus('Testing basic functionality...')
        
        // Test 2: Check if AuthProvider is available
        try {
          const { useAuth } = await import('@/src/components/auth/auth-provider')
          issues.push('✅ AuthProvider import works')
        } catch (error) {
          issues.push(`❌ AuthProvider import failed: ${error}`)
        }
        
        // Test 3: Check if providers are working
        try {
          const { Providers } = await import('@/app/providers')
          issues.push('✅ Providers import works')
        } catch (error) {
          issues.push(`❌ Providers import failed: ${error}`)
        }
        
        // Test 4: Check if basic components work
        try {
          const { Button } = await import('@/components/ui/button')
          issues.push('✅ UI components work')
        } catch (error) {
          issues.push(`❌ UI components failed: ${error}`)
        }
        
        // Test 5: Check environment
        issues.push(`✅ Environment: ${process.env.NODE_ENV}`)
        issues.push(`✅ Base URL: ${typeof window !== 'undefined' ? window.location.origin : 'Server'}`)
        
        setStatus('System check complete')
      } catch (error) {
        issues.push(`❌ System check failed: ${error}`)
        setStatus('System check failed')
      }
      
      setErrors(issues)
    }
    
    checkSystem()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          System Debug Page
        </h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Status: {status}</h2>
          
          <div className="space-y-2">
            {errors.map((error, index) => (
              <div key={index} className="text-sm">
                {error}
              </div>
            ))}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Quick Fixes</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">1. Clear Browser Cache</h3>
              <p className="text-sm text-gray-600">Press Ctrl+Shift+R to hard refresh</p>
            </div>
            <div>
              <h3 className="font-semibold">2. Restart Development Server</h3>
              <p className="text-sm text-gray-600">Stop and restart npm run dev</p>
            </div>
            <div>
              <h3 className="font-semibold">3. Check Console Errors</h3>
              <p className="text-sm text-gray-600">Open browser console (F12) and check for errors</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Navigation</h2>
          <div className="flex gap-4">
            <a href="/" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Go Home
            </a>
            <a href="/en/auth/login" className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
              Login Page
            </a>
            <a href="/test-simple" className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
              Simple Test
            </a>
          </div>
        </div>
      </div>
    </div>
  )
} 