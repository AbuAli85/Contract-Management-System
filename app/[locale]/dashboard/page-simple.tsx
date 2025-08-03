/**
 * Temporary simplified dashboard page to identify ReferenceError issue
 * This replaces the complex dashboard temporarily to isolate the error
 */

"use client"

import { Suspense } from "react"
import { DashboardAuthGuard } from "@/components/dashboard-auth-guard"

function SimpleDashboard() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-gray-600">Simple dashboard to test for ReferenceError issues.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Promoters</h3>
          <p className="text-2xl font-bold text-purple-600">Loading...</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Parties</h3>
          <p className="text-2xl font-bold text-green-600">Loading...</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Contracts</h3>
          <p className="text-2xl font-bold text-blue-600">Loading...</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="font-semibold">Notifications</h3>
          <p className="text-2xl font-bold text-orange-600">Loading...</p>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <DashboardAuthGuard>
      <Suspense fallback={<div>Loading dashboard...</div>}>
        <SimpleDashboard />
      </Suspense>
    </DashboardAuthGuard>
  )
}
