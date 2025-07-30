"use client"

import React, { useState } from "react"
import { ProfessionalSidebar } from "./professional-sidebar"
import { ProfessionalHeader } from "./professional-header"

interface ProfessionalLayoutProps {
  children: React.ReactNode
  title?: string
  subtitle?: string
  showSearch?: boolean
  showActions?: boolean
}

export function ProfessionalLayout({
  children,
  title,
  subtitle,
  showSearch = true,
  showActions = true,
}: ProfessionalLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <ProfessionalSidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <ProfessionalHeader
          onMenuToggle={toggleSidebar}
          title={title}
          subtitle={subtitle}
          showSearch={showSearch}
          showActions={showActions}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-6">{children}</div>
        </main>
      </div>
    </div>
  )
}
