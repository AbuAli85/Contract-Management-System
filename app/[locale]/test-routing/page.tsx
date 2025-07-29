'use client'

import { useParams } from 'next/navigation'

export default function TestRoutingPage() {
  const params = useParams()
  const locale = params.locale as string

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold">Routing Test Page</h1>
        <p className="text-muted-foreground">This page tests if routing and content display are working properly.</p>
      </div>

      <div className="text-center">
        <p>Locale: {locale}</p>
        <p>Page loaded successfully!</p>
      </div>
    </div>
  )
}