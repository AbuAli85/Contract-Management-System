"use client"

import { useState } from "react"

export default function GenerateContractPage() {
  const [loading, setLoading] = useState(false)

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Generate Contract
          </h1>
          <p className="text-gray-600">
            Create and manage employment contracts with our advanced form system.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="text-center py-12">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Contract Generation System
            </h2>
            <p className="text-gray-600 mb-6">
              This is a minimal version to test initialization.
            </p>
            <button
              onClick={() => setLoading(!loading)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              {loading ? "Loading..." : "Test Button"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
