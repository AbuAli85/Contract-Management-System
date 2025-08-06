"use client"

import React, { useState, useEffect } from "react"
import { Sidebar } from "./sidebar"
import { MobileMenuButton } from "./mobile-menu-button"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { 
  Bell, 
  Settings, 
  User
} from "lucide-react"

interface AppLayoutSimpleProps {
  children: React.ReactNode
}

export function AppLayoutSimple({ children }: AppLayoutSimpleProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Component mount detection
  useEffect(() => {
    setMounted(true)
  }, [])

  // Don't render until mounted to avoid hydration issues
  if (!mounted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button */}
      <div className="fixed left-4 top-4 z-50 md:hidden">
        <MobileMenuButton isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      </div>

      {/* Layout container */}
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content area */}
        <div className="flex-1 flex flex-col">
          {/* Top header */}
          <header className="sticky top-0 z-30 border-b border-border bg-card shadow-sm">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-3">
                    {/* Welcome message */}
                    <div className="hidden sm:block">
                      <p className="text-sm text-muted-foreground">
                        Welcome back, <span className="font-medium text-foreground">User</span>
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Notifications */}
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-4 w-4" />
                    <Badge 
                      variant="destructive" 
                      className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs"
                    >
                      0
                    </Badge>
                  </Button>

                  {/* User menu */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon">
                      <User className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Main content */}
          <main className="flex-1">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
