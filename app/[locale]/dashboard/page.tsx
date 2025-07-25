'use client'

import { AuthenticatedLayout } from '@/auth/components/authenticated-layout'
import { UserProfile } from '@/auth/components/user-profile'

export default function DashboardPage() {
  return (
    <AuthenticatedLayout>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">
                Dashboard
              </h1>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Welcome to your Dashboard
                  </h3>
                  <p className="text-gray-600">
                    This is a protected page that requires authentication.
                  </p>
                </div>
                
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    User Profile
                  </h3>
                  <UserProfile />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AuthenticatedLayout>
  )
} 