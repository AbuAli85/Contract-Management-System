"use client"

import React, { useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import { useAuth } from "@/lib/auth-service"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const params = useParams()
  const locale = params.locale as string
  const { user, loading, mounted } = useAuth()

  // Debug logging - only log when there are issues
  if (!user && mounted && !loading) {
    console.log("🧭 Sidebar: No user available after auth complete", {
      isOpen,
      locale,
      loading,
      mounted,
    })
  }

  const navigationItems = [
    {
      title: "Dashboard",
      href: `/${locale}/dashboard`,
      icon: "📊",
      description: "Overview and analytics",
    },
    {
      title: "Generate Contract",
      href: `/${locale}/generate-contract`,
      icon: "📄",
      description: "Create new contracts",
    },
    {
      title: "Contracts",
      href: `/${locale}/contracts`,
      icon: "📋",
      description: "View all contracts",
    },
    {
      title: "Manage Parties",
      href: `/${locale}/manage-parties`,
      icon: "👥",
      description: "Manage contract parties",
    },
    {
      title: "Manage Promoters",
      href: `/${locale}/manage-promoters`,
      icon: "🎯",
      description: "Manage promoters",
    },
    {
      title: "Promoter Analysis",
      href: `/${locale}/promoter-analysis`,
      icon: "📈",
      description: "Analytics and reports",
    },
    {
      title: "User Management",
      href: `/${locale}/dashboard/users`,
      icon: "👤",
      description: "Manage system users",
    },
    {
      title: "Settings",
      href: `/${locale}/dashboard/settings`,
      icon: "⚙️",
      description: "System settings",
    },
    {
      title: "Notifications",
      href: `/${locale}/dashboard/notifications`,
      icon: "🔔",
      description: "View notifications",
    },
    {
      title: "Audit Logs",
      href: `/${locale}/dashboard/audit`,
      icon: "📝",
      description: "System audit logs",
    },
  ]

  // Test pages removed - system is working properly
  const testPages: Array<{ title: string; href: string; icon: string; description: string }> = []

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={onClose} />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 z-50 h-full w-64 transform bg-card shadow-lg transition-transform duration-300 ease-in-out ${isOpen ? "translate-x-0" : "-translate-x-full"} md:static md:translate-x-0 md:shadow-none`}
      >
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="border-b border-border p-4">
            <Link href={`/${locale}`} className="flex items-center space-x-2">
              <span className="text-2xl">📋</span>
              <span className="text-xl font-bold text-card-foreground">ContractGen</span>
            </Link>
            {user && (
              <div className="mt-2 text-sm text-muted-foreground">
                <p>Welcome, {user.email}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Main Navigation
              </h3>

              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center space-x-3 rounded-lg px-3 py-2 text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                  onClick={() => {
                    console.log("🧭 Sidebar: Navigating to", item.href)
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 768) {
                      onClose()
                    }
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-muted-foreground">{item.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <div className="text-xs text-muted-foreground">
              <p>Contract Management System</p>
              <p>Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
