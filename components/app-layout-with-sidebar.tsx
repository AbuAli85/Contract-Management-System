"use client"

import React, { useState } from "react"
import { useAuth } from "@/lib/auth-service"
import { useParams, usePathname } from "next/navigation"
import { Sidebar } from "./sidebar"
import { MobileMenuButton } from "./mobile-menu-button"

interface AppLayoutWithSidebarProps {
  children: React.ReactNode
}

export function AppLayoutWithSidebar({ children }: AppLayoutWithSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user } = useAuth()
  const params = useParams()
  const pathname = usePathname()
  const locale = params.locale as string

  // Check if we're on the landing page (root route)
  const isLandingPage = pathname === `/${locale}` || pathname === `/${locale}/`

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile menu button - only show if not landing page */}
      {!isLandingPage && (
        <div className="fixed left-4 top-4 z-50 md:hidden">
          <MobileMenuButton isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
        </div>
      )}

      {/* Sidebar - only show if not landing page */}
      {!isLandingPage && <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />}

      {/* Main content */}
      <div className={`min-h-screen ${!isLandingPage ? "md:ml-64" : ""}`}>
        {/* Top header - only show if not landing page */}
        {!isLandingPage && (
          <header className="border-b border-border bg-card shadow-sm">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-lg font-semibold text-card-foreground">
                    Contract Management System
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  {user && (
                    <div className="text-sm text-muted-foreground">
                      <span>Welcome, {user.email}</span>
                    </div>
                  )}
                  <a
                    href={`/${locale}/auth/logout`}
                    className="text-sm text-destructive hover:text-destructive/80"
                  >
                    Logout
                  </a>
                </div>
              </div>
            </div>
          </header>
        )}

        {/* Page content */}
        <main className={!isLandingPage ? "p-6" : ""}>
          <div className="children-container">{children}</div>
        </main>
      </div>
    </div>
  )
}
