'use client'

import { usePathname } from 'next/navigation'
import { UserProfile } from '@/auth/components/user-profile'
import { AuthenticatedLayout } from '@/components/authenticated-layout'

export default function ProfilePage() {
  const pathname = usePathname()
  const locale = pathname && pathname.startsWith('/en/') ? 'en' : pathname && pathname.startsWith('/ar/') ? 'ar' : 'en'
  
  return (
    <AuthenticatedLayout locale={locale}>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900 mb-6">
                User Profile
              </h3>
              
              <UserProfile />
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
} 