'use client';

import React from 'react';

export default function EnvironmentCheck() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseAnonKey) {
    return null; // Environment is properly configured
  }

  return (
    <div className='min-h-screen bg-gray-50 flex items-center justify-center p-4'>
      <div className='w-full max-w-2xl bg-white rounded-lg shadow-md p-8'>
        <div className='text-center mb-6'>
          <h1 className='text-3xl font-bold text-red-600 mb-4'>🚨 Environment Configuration Required</h1>
          <p className='text-gray-600 text-lg'>
            Your application is missing required environment variables for Supabase authentication.
          </p>
        </div>

        <div className='space-y-6'>
          <div className='bg-yellow-50 border border-yellow-200 rounded-lg p-4'>
            <h2 className='text-lg font-semibold text-yellow-800 mb-2'>Missing Environment Variables:</h2>
            <div className='space-y-2 text-sm'>
              <div className='flex items-center space-x-2'>
                <span className={`w-3 h-3 rounded-full ${supabaseUrl ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <code className='bg-gray-100 px-2 py-1 rounded'>NEXT_PUBLIC_SUPABASE_URL</code>
                <span className={supabaseUrl ? 'text-green-600' : 'text-red-600'}>
                  {supabaseUrl ? '✓ Set' : '✗ Missing'}
                </span>
              </div>
              <div className='flex items-center space-x-2'>
                <span className={`w-3 h-3 rounded-full ${supabaseAnonKey ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <code className='bg-gray-100 px-2 py-1 rounded'>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>
                <span className={supabaseAnonKey ? 'text-green-600' : 'text-red-600'}>
                  {supabaseAnonKey ? '✓ Set' : '✗ Missing'}
                </span>
              </div>
            </div>
          </div>

          <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
            <h2 className='text-lg font-semibold text-blue-800 mb-2'>How to Fix:</h2>
            <ol className='list-decimal list-inside space-y-2 text-sm text-blue-700'>
              <li>Create a <code className='bg-blue-100 px-1 py-0.5 rounded'>.env.local</code> file in your project root</li>
              <li>Add your Supabase credentials:</li>
            </ol>
            <div className='mt-3 bg-gray-100 p-3 rounded text-sm font-mono'>
              <div>NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co</div>
              <div>NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here</div>
            </div>
            <p className='text-xs text-blue-600 mt-2'>
              You can find these values in your Supabase project dashboard under Settings → API
            </p>
          </div>

          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <h2 className='text-lg font-semibold text-green-800 mb-2'>After Setup:</h2>
            <ul className='list-disc list-inside space-y-1 text-sm text-green-700'>
              <li>Save the <code className='bg-green-100 px-1 py-0.5 rounded'>.env.local</code> file</li>
              <li>Restart your development server</li>
              <li>Refresh this page</li>
            </ul>
          </div>

          <div className='text-center'>
            <button
              onClick={() => window.location.reload()}
              className='bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            >
              🔄 Refresh Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
