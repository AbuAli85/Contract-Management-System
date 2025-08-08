"use client"

import { useAuth } from "@/lib/auth-service"
import { useSupabase } from "@/app/providers"
import { useEffect, useState } from "react"

export default function DebugAuthPage() {
  const auth = useAuth()
  const supabase = useSupabase()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return <div>Loading debug page...</div>
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Authentication Debug</h1>
      
      <div className="space-y-4">
        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">useAuth Hook:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify({
              user: auth.user ? { id: auth.user.id, email: auth.user.email } : null,
              loading: auth.loading,
              mounted: auth.mounted
            }, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">useSupabase Hook:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify({
              user: supabase.user ? { id: supabase.user.id, email: supabase.user.email } : null,
              session: supabase.session ? { access_token: 'SET' } : null,
              loading: supabase.loading,
              supabase: supabase.supabase ? 'AVAILABLE' : 'NULL'
            }, null, 2)}
          </pre>
        </div>

        <div className="border p-4 rounded">
          <h2 className="font-semibold mb-2">Environment Variables:</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm">
            {JSON.stringify({
              NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET',
              NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
} 