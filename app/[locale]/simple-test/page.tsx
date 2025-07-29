'use client'

import { useParams } from 'next/navigation'

export default function SimpleTestPage() {
  const params = useParams()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Simple Test Page</h1>
      <p className="mb-4">This is a simple test to verify Next.js 15 routing is working.</p>
      
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Route Parameters:</h2>
        <pre className="text-sm">{JSON.stringify(params, null, 2)}</pre>
      </div>
      
      <div className="mt-4">
        <p className="text-green-600">✅ If you can see this page, routing is working!</p>
      </div>
    </div>
  )
}