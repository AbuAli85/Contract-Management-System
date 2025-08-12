'use client';

import React from 'react';

interface SimpleLayoutProps {
  children: React.ReactNode;
}

export function SimpleLayout({ children }: SimpleLayoutProps) {
  return (
    <div className='min-h-screen flex items-center justify-center bg-background px-4'>
      <div className='max-w-md w-full bg-card rounded-lg shadow-lg p-8 border border-border'>
        <div className='text-center mb-6'>
          <h1 className='text-2xl font-bold text-card-foreground'>
            Contract Management System
          </h1>
        </div>
        {children}
      </div>
    </div>
  );
}
