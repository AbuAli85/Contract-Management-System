"use client"

import type React from "react"
import type { ReactNode } from "react"
import { useState, useEffect } from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { PermissionAwareSidebar } from "@/components/permission-aware-sidebar"
import { PermissionAwareHeader } from "@/components/permission-aware-header"
import { RBACProvider } from "@/src/components/auth/rbac-provider"
import { useAuth } from "@/src/components/auth/auth-provider"

interface DashboardLayoutProps {
  children: ReactNode
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [mounted, setMounted] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    setMounted(true)
  }, [])

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed)
  }

  if (!mounted) {
    return null
  }

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
      <RBACProvider user={user}>
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
      </RBACProvider>
    </ThemeProvider>
  )
}
