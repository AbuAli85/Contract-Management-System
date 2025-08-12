'use client';

import { useState, useEffect } from 'react';

export default function DebugEnvPage() {
  const [envVars, setEnvVars] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check environment variables in browser
    const env = {
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NODE_ENV: process.env.NODE_ENV,
    };

    console.log('🔍 Environment variables in browser:', env);
    setEnvVars(env);
    setLoading(false);
  }, []);

  if (loading) {
    return <div className='container mx-auto p-8'>Loading...</div>;
  }

  return (
    <div className='container mx-auto p-8 max-w-2xl'>
      <h1 className='text-3xl font-bold mb-8'>
        🔍 Environment Variables Debug
      </h1>

      <div className='space-y-4'>
        <div className='border rounded-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>Environment Variables</h2>
          <div className='space-y-2'>
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_URL:</strong>
              <span
                className={
                  envVars?.NEXT_PUBLIC_SUPABASE_URL
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {envVars?.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'NOT SET'}
              </span>
            </div>
            <div>
              <strong>NEXT_PUBLIC_SUPABASE_ANON_KEY:</strong>
              <span
                className={
                  envVars?.NEXT_PUBLIC_SUPABASE_ANON_KEY
                    ? 'text-green-600'
                    : 'text-red-600'
                }
              >
                {envVars?.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET'}
              </span>
            </div>
            <div>
              <strong>NODE_ENV:</strong> {envVars?.NODE_ENV}
            </div>
          </div>
        </div>

        <div className='border rounded-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>Raw Values</h2>
          <pre className='text-sm bg-gray-100 p-4 rounded overflow-auto'>
            {JSON.stringify(envVars, null, 2)}
          </pre>
        </div>

        <div className='border rounded-lg p-6'>
          <h2 className='text-xl font-semibold mb-4'>Recommendations</h2>
          <ul className='list-disc list-inside space-y-2'>
            {!envVars?.NEXT_PUBLIC_SUPABASE_URL && (
              <li className='text-red-600'>
                ❌ NEXT_PUBLIC_SUPABASE_URL is not set
              </li>
            )}
            {!envVars?.NEXT_PUBLIC_SUPABASE_ANON_KEY && (
              <li className='text-red-600'>
                ❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is not set
              </li>
            )}
            {envVars?.NEXT_PUBLIC_SUPABASE_URL &&
              envVars?.NEXT_PUBLIC_SUPABASE_ANON_KEY && (
                <li className='text-green-600'>
                  ✅ All required environment variables are set
                </li>
              )}
          </ul>
        </div>
      </div>
    </div>
  );
}
