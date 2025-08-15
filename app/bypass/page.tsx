'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function BypassPage() {
  const router = useRouter();

  useEffect(() => {
    // Immediately set all bypass flags
    if (typeof window !== 'undefined') {
      localStorage.setItem('emergency-bypass', 'true');
      localStorage.setItem('dev-bypass', 'true');
      localStorage.setItem('force-bypass', 'true');
      
      console.log('🚨 All bypass flags set, redirecting to dashboard...');
      
      // Redirect to dashboard with bypass
      router.push('/en/dashboard?bypass=true');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto mb-4"></div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Emergency Bypass Activated
        </h1>
        <p className="text-gray-600 mb-4">
          Setting bypass flags and redirecting to dashboard...
        </p>
        <div className="text-sm text-gray-500">
          <p>✅ Emergency bypass: true</p>
          <p>✅ Dev bypass: true</p>
          <p>✅ Force bypass: true</p>
        </div>
      </div>
    </div>
  );
}

