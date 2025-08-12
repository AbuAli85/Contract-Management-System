'use client';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/app/providers';
import { useEnhancedRBAC } from '@/components/auth/enhanced-rbac-provider';
import { LogOut, User, Settings, Shield } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

export function PermissionAwareHeader() {
  const { user, supabase } = useAuth();
  const { userRole, hasPermission } = useEnhancedRBAC();

  const handleSignOut = async () => {
    if (supabase) {
      await supabase.auth.signOut();
    }
  };

  if (!user) return null;

  return (
    <header className='bg-white shadow-sm border-b'>
      <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
        <div className='flex justify-between items-center h-16'>
          {/* Logo/Brand */}
          <div className='flex items-center'>
            <Link href='/' className='text-xl font-bold text-gray-900'>
              Contract Management System
            </Link>
          </div>

          {/* Navigation */}
          <nav className='hidden md:flex space-x-8'>
            <Link
              href='/dashboard'
              className='text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium'
            >
              Dashboard
            </Link>

            {hasPermission('contracts.view') && (
              <Link
                href='/contracts'
                className='text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium'
              >
                Contracts
              </Link>
            )}

            {hasPermission('marketplace.view') && (
              <Link
                href='/marketplace'
                className='text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium'
              >
                Marketplace
              </Link>
            )}

            {hasPermission('workflow.view') && (
              <Link
                href='/workflow'
                className='text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium'
              >
                Workflow
              </Link>
            )}

            {hasPermission('crm.view') && (
              <Link
                href='/crm'
                className='text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium'
              >
                CRM
              </Link>
            )}
          </nav>

          {/* User Menu */}
          <div className='flex items-center space-x-4'>
            {/* Role Badge */}
            <div className='flex items-center space-x-2'>
              <Shield className='h-4 w-4 text-gray-500' />
              <span className='text-sm text-gray-700 capitalize'>
                {userRole || 'user'}
              </span>
            </div>

            {/* User Dropdown */}
            <div className='relative group'>
              <Button variant='ghost' className='flex items-center space-x-2'>
                <User className='h-4 w-4' />
                <span className='hidden md:block'>{user.email}</span>
              </Button>

              {/* Dropdown Menu */}
              <div className='absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200'>
                <Link
                  href='/profile'
                  className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                >
                  <User className='h-4 w-4 mr-2' />
                  Profile
                </Link>

                {hasPermission('settings.view') && (
                  <Link
                    href='/settings'
                    className='flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                  >
                    <Settings className='h-4 w-4 mr-2' />
                    Settings
                  </Link>
                )}

                <button
                  onClick={handleSignOut}
                  className='flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100'
                >
                  <LogOut className='h-4 w-4 mr-2' />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
