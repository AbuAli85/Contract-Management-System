'use client'

import React from 'react'
import { ClientHeader } from '@/components/client-header'
import { ClientFooter } from '@/components/client-footer'
import { ClientProviders } from '@/components/client-providers'
import { useAuth } from '@/src/components/auth/simple-auth-provider'
import { Loader2 } from 'lucide-react'

interface AppLayoutProps {
  children: React.ReactNode
  locale: string
}

export function AppLayout({ children, locale }: AppLayoutProps) {
  const { user, loading, mounted } = useAuth()

  // Show loading while auth is initializing
  if (loading || !mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-8 w-8 mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <ClientProviders>
      <div className="min-h-screen bg-background">
        <ClientHeader locale={locale} />
        <main className="container mx-auto px-4 py-8">
          {children}
        </main>
        <ClientFooter />
      </div>
    </ClientProviders>
  )
} 