"use client"

import React from 'react'
import { useAuth } from '@/lib/auth-service'
import { useSafePathname } from '@/hooks/use-safe-params'

export function DebugAuthState() {
  const { user, loading, mounted } = useAuth()
  const pathname = useSafePathname()

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-black text-white p-4 rounded-lg text-xs font-mono max-w-xs">
      <h3 className="font-bold mb-2">Debug State</h3>
      <div>User: {user ? '✅' : '❌'}</div>
      <div>Loading: {loading ? '⏳' : '✅'}</div>
      <div>Mounted: {mounted ? '✅' : '❌'}</div>
      <div>Path: {pathname || 'none'}</div>
      <div>User ID: {user?.id?.slice(0, 8) || 'none'}</div>
      <div>Email: {user?.email || 'none'}</div>
    </div>
  )
}
