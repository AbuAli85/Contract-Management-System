"use client"

import { useState } from "react"

export default function TestSimplePage() {
  const [count, setCount] = useState(0)

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Simple Test Page</h1>
      <p className="mb-4">This is a minimal test page to check for initialization errors.</p>
      <button 
        onClick={() => setCount(count + 1)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Count: {count}
      </button>
    </div>
  )
} 