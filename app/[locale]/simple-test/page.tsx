'use client'

import { useParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, AlertCircle, Home, Settings } from 'lucide-react'
import Link from 'next/link'

export default function SimpleTestPage() {
  const params = useParams()
  const locale = params.locale as string

  return (
    <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold">Simple Test Page</h1>
          <p className="text-muted-foreground">Testing basic routing and content display</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Working Features
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Page loads successfully</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Content displayed correctly</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Page structure working</span>
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
                Navigation Test
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Test the navigation links below.
              </p>
              <div className="space-y-2">
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/${locale}`}>
                    <Home className="mr-2 h-4 w-4" />
                    Home Page
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href={`/${locale}/dashboard`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div><strong>Page:</strong> Simple Test Page</div>
              <div><strong>Locale:</strong> {locale}</div>
              <div><strong>URL:</strong> {typeof window !== 'undefined' ? window.location.pathname : 'Server-side'}</div>
              <div><strong>Timestamp:</strong> {new Date().toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-green-600 font-medium">
            ✅ If you can see this content, routing and layout are working correctly!
          </p>
        </div>
      </div>
    </div>
  )
}