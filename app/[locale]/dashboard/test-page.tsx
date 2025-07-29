'use client'

import { useParams } from 'next/navigation'

export default function TestPage() {
  const params = useParams()
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard Test Page</h1>
      <p className="mb-4">This is a test page to verify routing is working.</p>
      <div className="bg-gray-100 p-4 rounded">
        <h2 className="font-semibold mb-2">Route Parameters:</h2>
        <pre className="text-sm">{JSON.stringify(params, null, 2)}</pre>
      </div>
      <div className="mt-4">
        <a href={`/${params.locale}/dashboard`} className="text-blue-600 hover:underline">
          Back to Dashboard
        </a>
      </div>
    </div>
  )
}