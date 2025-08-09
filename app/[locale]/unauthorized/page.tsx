"use client"

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, Home, ArrowLeft, Mail } from 'lucide-react'
import Link from 'next/link'

export default function UnauthorizedPage() {
  // Don't use RBAC hooks on unauthorized page to avoid provider errors

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
            <Shield className="h-6 w-6 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Access Denied</CardTitle>
          <CardDescription>
            You don't have permission to access this page
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              This page requires specific permissions that your account doesn't have.
            </AlertDescription>
          </Alert>

          <div className="text-center text-sm text-gray-600">
            <p>Access to this resource is restricted based on your permissions.</p>
          </div>

          <div className="space-y-2">
            <Link href="/" className="block">
              <Button className="w-full" variant="default">
                <Home className="h-4 w-4 mr-2" />
                Go to Homepage
              </Button>
            </Link>
            
            <Button 
              className="w-full" 
              variant="outline"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>

          <div className="text-center pt-4 border-t">
            <p className="text-sm text-gray-500 mb-2">
              Need access to this page?
            </p>
            <Link href="/contact" className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800">
              <Mail className="h-3 w-3 mr-1" />
              Contact Administrator
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}