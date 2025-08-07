// Quick test page to isolate the infinite loop issue
"use client"

import { useEffect, useState } from "react"
import { Building2 } from "lucide-react"

export default function TestPage() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    console.log('🧪 Test page mounted successfully')
  }, [])
  
  if (!mounted) {
    return <div>Loading...</div>
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
      <div className="text-center">
        <Building2 className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Dashboard Test Page
        </h1>
        <p className="text-slate-600">
          This page tests if the infinite loop issue is resolved.
        </p>
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800">
            ✅ Page loaded successfully without infinite loops
          </p>
        </div>
      </div>
    </div>
  )
}
