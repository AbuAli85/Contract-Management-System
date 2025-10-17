'use client';

import { Loader2 } from 'lucide-react';

interface LoadingPageProps {
  message?: string;
  subMessage?: string;
}

export default function LoadingPage({ 
  message = "Loading...", 
  subMessage = "Please wait while we prepare your workspace" 
}: LoadingPageProps) {
  return (
    <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
      <div className="text-center">
        <div className="mb-6">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          {message}
        </h2>
        <p className="text-gray-600">
          {subMessage}
        </p>
      </div>
    </div>
  );
}
