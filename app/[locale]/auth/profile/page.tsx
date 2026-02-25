'use client';

import { UserProfile } from '@/auth/components/user-profile';

export default function ProfilePage() {
  return (
    <div className='min-h-screen bg-gray-50 px-4 py-12 sm:px-6 lg:px-8'>
      <div className='mx-auto max-w-3xl'>
        <div className='rounded-lg bg-white shadow'>
          <div className='px-4 py-5 sm:p-6'>
            <h3 className='mb-6 text-lg font-medium leading-6 text-gray-900'>
              User Profile
            </h3>

            <UserProfile />
          </div>
        </div>
      </div>
    </div>
  );
}
