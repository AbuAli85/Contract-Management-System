'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/src/components/auth/simple-auth-provider'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const params = useParams()
  const locale = params.locale as string
  const { user } = useAuth()
  
  // Debug logging
  console.log('🧭 Sidebar: Rendering with props', { isOpen, locale, user: !!user })

  const navigationItems = [
    {
      title: 'Dashboard',
      href: `/${locale}/dashboard`,
      icon: '📊',
      description: 'Overview and analytics'
    },
    {
      title: 'Generate Contract',
      href: `/${locale}/generate-contract`,
      icon: '📄',
      description: 'Create new contracts'
    },
    {
      title: 'Contracts',
      href: `/${locale}/contracts`,
      icon: '📋',
      description: 'View all contracts'
    },
    {
      title: 'Manage Parties',
      href: `/${locale}/manage-parties`,
      icon: '👥',
      description: 'Manage contract parties'
    },
    {
      title: 'Manage Promoters',
      href: `/${locale}/manage-promoters`,
      icon: '🎯',
      description: 'Manage promoters'
    },
    {
      title: 'Promoter Analysis',
      href: `/${locale}/promoter-analysis`,
      icon: '📈',
      description: 'Analytics and reports'
    },
    {
      title: 'User Management',
      href: `/${locale}/dashboard/users`,
      icon: '👤',
      description: 'Manage system users'
    },
    {
      title: 'Settings',
      href: `/${locale}/dashboard/settings`,
      icon: '⚙️',
      description: 'System settings'
    },
    {
      title: 'Notifications',
      href: `/${locale}/dashboard/notifications`,
      icon: '🔔',
      description: 'View notifications'
    },
    {
      title: 'Audit Logs',
      href: `/${locale}/dashboard/audit`,
      icon: '📝',
      description: 'System audit logs'
    }
  ]

  const testPages = [
    {
      title: 'Auth Debug',
      href: `/${locale}/auth-debug`,
      icon: '🔐',
      description: 'Debug authentication state'
    },
    {
      title: 'Sidebar Test',
      href: `/${locale}/sidebar-test`,
      icon: '🧭',
      description: 'Test sidebar navigation'
    },
    {
      title: 'Sidebar Debug',
      href: `/${locale}/sidebar-debug`,
      icon: '🐛',
      description: 'Debug sidebar issues'
    },
    {
      title: 'Layout Test',
      href: `/${locale}/layout-test`,
      icon: '🧪',
      description: 'Test simple layout'
    },
    {
      title: 'Content Test',
      href: `/${locale}/simple-content-test`,
      icon: '📄',
      description: 'Test content rendering'
    },
    {
      title: 'Test Working',
      href: `/${locale}/test-working`,
      icon: '✅',
      description: 'Test page'
    },
    {
      title: 'Server Test',
      href: `/${locale}/server-test`,
      icon: '🖥️',
      description: 'Server component test'
    }
  ]

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={`
        fixed top-0 left-0 h-full w-64 bg-white shadow-lg z-50 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:shadow-none
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-4 border-b border-gray-200">
            <Link href={`/${locale}`} className="flex items-center space-x-2">
              <span className="text-2xl">📋</span>
              <span className="text-xl font-bold text-gray-800">ContractGen</span>
            </Link>
            {user && (
              <div className="mt-2 text-sm text-gray-600">
                <p>Welcome, {user.email}</p>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Main Navigation
              </h3>
              
              {navigationItems.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  onClick={() => {
                    console.log('🧭 Sidebar: Navigating to', item.href)
                    // Close sidebar on mobile after navigation
                    if (window.innerWidth < 768) {
                      onClose()
                    }
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              ))}
            </div>

            {/* Test Pages */}
            <div className="mt-8 space-y-2">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                Test Pages
              </h3>
              
              {testPages.map((item) => (
                <Link
                  key={item.title}
                  href={item.href}
                  className="flex items-center space-x-3 px-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      onClose()
                    }
                  }}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1">
                    <div className="font-medium">{item.title}</div>
                    <div className="text-xs text-gray-500">{item.description}</div>
                  </div>
                </Link>
              ))}
            </div>
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              <p>Contract Management System</p>
              <p>Version 1.0.0</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 