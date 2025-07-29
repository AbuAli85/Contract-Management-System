'use client'

import React, { useState, useEffect } from 'react'
import { Sidebar } from '@/components/sidebar'
import { MobileMenuButton } from '@/components/mobile-menu-button'
import { useAuth } from '@/src/components/auth/simple-auth-provider'
import { useParams, usePathname } from 'next/navigation'

interface AppLayoutWithSidebarProps {
  children: React.ReactNode
}

export function AppLayoutWithSidebar({ children }: AppLayoutWithSidebarProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isLandingPage, setIsLandingPage] = useState(false)
  const [forceRender, setForceRender] = useState(false)
  const { user, loading, mounted } = useAuth()
  const params = useParams()
  const pathname = usePathname()
  const locale = params.locale as string
  
  // Check if we're on the landing page (root route)
  useEffect(() => {
    const isLanding = pathname === `/${locale}`
    setIsLandingPage(isLanding)
  }, [pathname, locale])

  // Force render after 1 second to prevent infinite loading
  useEffect(() => {
    const timer = setTimeout(() => {
      if (loading || !mounted) {
        setForceRender(true)
      }
    }, 1000) // Reduced to 1 second for faster rendering
    
    return () => clearTimeout(timer)
  }, [loading, mounted])

  // Temporarily disable loading state to fix rendering issues
  const shouldShowLoading = false

  // Only log when there are issues
  if (!user && mounted && !loading) {
    console.log('🧭 AppLayoutWithSidebar: No user after auth complete', { 
      user: !!user, 
      loading, 
      mounted, 
      pathname
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu button - only show if not landing page */}
      {!isLandingPage && (
        <div className="md:hidden fixed top-4 left-4 z-50">
          <MobileMenuButton 
            isOpen={sidebarOpen} 
            onToggle={() => setSidebarOpen(!sidebarOpen)} 
          />
        </div>
      )}

      {/* Sidebar - only show if not landing page */}
      {!isLandingPage && (
        <Sidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
      )}
      
      

      {/* Main content */}
      <div className={`min-h-screen ${!isLandingPage ? 'md:ml-64' : ''}`}>
        {/* Top header - only show if not landing page */}
        {!isLandingPage && (
          <header className="bg-white shadow-sm border-b border-gray-200">
            <div className="px-4 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <h1 className="text-lg font-semibold text-gray-900">
                    Contract Management System
                  </h1>
                </div>
                <div className="flex items-center space-x-4">
                  {user && (
                    <div className="text-sm text-gray-600">
                      <span>Welcome, {user.email}</span>
                    </div>
                  )}
                  <a 
                    href={`/${locale}/auth/logout`}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    Logout
                  </a>
                </div>
              </div>
            </div>
          </header>
        )}

                 {/* Page content */}
         <main className="p-6">
           {/* Render children */}
           <div className="children-container">
             {children}
           </div>
         </main>
      </div>
    </div>
  )
} 