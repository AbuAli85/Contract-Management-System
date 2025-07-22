"use client"

import React, { useState } from "react"
import { PermissionAwareSidebar } from "./permission-aware-sidebar"
import { PermissionAwareHeader } from "./permission-aware-header"

interface PermissionAwareLayoutProps {
  children: React.ReactNode
}

export function PermissionAwareLayout({ children }: PermissionAwareLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <PermissionAwareSidebar 
        isCollapsed={isSidebarCollapsed} 
        onToggle={toggleSidebar}
      />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <PermissionAwareHeader 
          onSidebarToggle={toggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}

// Export individual components for use in other layouts
export { PermissionAwareSidebar } from "./permission-aware-sidebar"
export { PermissionAwareHeader } from "./permission-aware-header" 