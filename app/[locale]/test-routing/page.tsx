'use client'

import { useParams, usePathname } from 'next/navigation'

export default function TestRoutingPage() {
  const params = useParams()
  const pathname = usePathname()
  
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Routing Test Page</h1>
      
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Route Information</h2>
          <p><strong>Pathname:</strong> {pathname}</p>
          <p><strong>Params:</strong> {JSON.stringify(params, null, 2)}</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Navigation Links</h2>
          <div className="space-y-2">
            <a 
              href={`/${params.locale}/dashboard`} 
              className="block text-blue-600 hover:underline"
            >
              → Dashboard
            </a>
            <a 
              href={`/${params.locale}/debug-routing`} 
              className="block text-blue-600 hover:underline"
            >
              → Debug Routing
            </a>
            <a 
              href={`/${params.locale}/auth/login`} 
              className="block text-blue-600 hover:underline"
            >
              → Login
            </a>
          </div>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Status</h2>
          <p className="text-green-600">✅ Routing is working correctly!</p>
          <p className="text-sm text-gray-600 mt-2">
            If you can see this page, the Next.js 15 params handling is working properly.
          </p>
        </div>
      </div>
    </div>
  )
}