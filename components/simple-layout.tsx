"use client"

import React from "react"

interface SimpleLayoutProps {
  children: React.ReactNode
}

export function SimpleLayout({ children }: SimpleLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main content - no header for auth pages */}
      <main className="min-h-screen">
        {children}
      </main>
    </div>
  )
} 