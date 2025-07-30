"use client"

import React from "react"

interface SimpleLayoutProps {
  children: React.ReactNode
}

export function SimpleLayout({ children }: SimpleLayoutProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* App title for auth pages */}
      <div className="bg-card shadow-sm border-b border-border flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-center py-4">
            <h1 className="text-2xl font-bold text-card-foreground">
              Contract Management System
            </h1>
          </div>
        </div>
      </div>
      
      {/* Main content - flex-grow to fill remaining space */}
      <main className="flex-1 flex items-center justify-center">
        {children}
      </main>
    </div>
  )
} 