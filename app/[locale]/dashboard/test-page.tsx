"use client"

import { useParams } from "next/navigation"

export default function TestPage() {
  const params = useParams()

  return (
    <div className="p-8">
      <h1 className="mb-4 text-2xl font-bold">Dashboard Test Page</h1>
      <p className="mb-4">This is a test page to verify routing is working.</p>
      <div className="rounded bg-gray-100 p-4">
        <h2 className="mb-2 font-semibold">Route Parameters:</h2>
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
