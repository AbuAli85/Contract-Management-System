"use client"

import { Sidebar } from "@/components/sidebar"
import { PermissionAwareHeader } from "@/components/permission-aware-header"
import { useState } from "react"

export default function TestSidebarPage({ params }: { params: { locale: string } }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <Sidebar isOpen={!isSidebarCollapsed} onClose={toggleSidebar} locale={params.locale} />

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <PermissionAwareHeader
          onSidebarToggle={toggleSidebar}
          isSidebarCollapsed={isSidebarCollapsed}
        />

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto p-6">
            <h1 className="text-2xl font-bold mb-4">Sidebar Test Page</h1>
            <p className="text-muted-foreground">
              This is a test page to check if the sidebar and navigation are working properly.
            </p>
            <div className="mt-4 p-4 bg-muted rounded">
              <h2 className="font-semibold mb-2">Test Content</h2>
              <p>If you can see this content with a sidebar and header, then the layout is working correctly.</p>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
} 