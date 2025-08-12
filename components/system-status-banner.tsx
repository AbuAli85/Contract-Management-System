'use client';

import { useEffect, useState } from 'react';

export function SystemStatusBanner() {
  const [mounted, setMounted] = useState(false);
  const [showBanner, setShowBanner] = useState(true);

  // Only mount on client side to avoid hydration issues
  useEffect(() => {
    setMounted(true);

    // Auto-hide after 3 seconds in production
    const timer = setTimeout(() => {
      setShowBanner(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // Don't render during SSR or if banner is hidden
  if (!mounted || !showBanner) {
    return null;
  }

  return (
    <div className='bg-blue-50 border-blue-200 text-blue-800 border px-4 py-2 text-sm font-medium text-center relative'>
      🔄 Hybrid Authentication System Active - Full functionality enabled
      <button
        onClick={() => setShowBanner(false)}
        className='absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-800 hover:opacity-70 text-lg font-bold leading-none'
        aria-label='Close banner'
      >
        ×
      </button>
    </div>
  );
}
