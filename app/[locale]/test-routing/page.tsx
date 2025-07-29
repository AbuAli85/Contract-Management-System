'use client'

import { use } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle } from 'lucide-react'

export default function TestRoutingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)

  return (
    <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Routing Test Page</h1>
          <p className="text-muted-foreground">This page tests if routing and content display are working properly.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Success Indicators
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Page loaded successfully</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Page layout rendered</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Content displayed correctly</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Locale: {locale}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-500" />
                Test Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Try clicking the navigation links below to test if they work properly.
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/${locale}/dashboard`}>Go to Dashboard</a>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/${locale}/generate-contract`}>Go to Generate Contract</a>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <a href={`/${locale}/contracts`}>Go to Contracts</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Debug Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Current URL:</strong> {typeof window !== 'undefined' ? window.location.href : 'Server-side'}</div>
              <div><strong>Locale:</strong> {locale}</div>
              <div><strong>Timestamp:</strong> {new Date().toISOString()}</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}