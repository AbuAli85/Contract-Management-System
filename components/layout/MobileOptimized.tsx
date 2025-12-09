'use client';

import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Mobile-optimized table wrapper
 * Converts table to cards on mobile
 */
export function ResponsiveTable({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <div className='inline-block min-w-full align-middle'>
        <div className='overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg'>
          {children}
        </div>
      </div>
    </div>
  );
}

/**
 * Mobile-friendly action buttons
 * Stacks buttons vertically on mobile
 */
export function ResponsiveActions({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col sm:flex-row',
        'gap-2 sm:gap-4',
        'items-stretch sm:items-center',
        className
      )}
    >
      {children}
    </div>
  );
}

/**
 * Mobile-optimized form layout
 */
export function ResponsiveForm({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <form className={cn('space-y-4 sm:space-y-6', className)}>{children}</form>
  );
}

/**
 * Show/hide based on screen size
 */
export function HideOnMobile({
  children,
  breakpoint = 'md',
}: {
  children: React.ReactNode;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const classes = {
    sm: 'hidden sm:block',
    md: 'hidden md:block',
    lg: 'hidden lg:block',
    xl: 'hidden xl:block',
  };

  return <div className={classes[breakpoint]}>{children}</div>;
}

export function ShowOnMobile({
  children,
  breakpoint = 'md',
}: {
  children: React.ReactNode;
  breakpoint?: 'sm' | 'md' | 'lg' | 'xl';
}) {
  const classes = {
    sm: 'sm:hidden',
    md: 'md:hidden',
    lg: 'lg:hidden',
    xl: 'xl:hidden',
  };

  return <div className={classes[breakpoint]}>{children}</div>;
}

/**
 * Mobile-optimized spacing
 */
export function ResponsiveSpacing({
  children,
  size = 'md',
  className,
}: {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const spacingClasses = {
    sm: 'space-y-2 sm:space-y-3',
    md: 'space-y-4 sm:space-y-6',
    lg: 'space-y-6 sm:space-y-8',
  };

  return <div className={cn(spacingClasses[size], className)}>{children}</div>;
}

/**
 * Responsive modal/dialog
 * Full screen on mobile, centered on desktop
 */
export function ResponsiveModal({
  children,
  isOpen,
  onClose,
  title,
  className,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
  className?: string;
}) {
  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 overflow-y-auto'>
      <div className='flex min-h-screen items-end sm:items-center justify-center p-0 sm:p-4'>
        {/* Backdrop */}
        <div
          className='fixed inset-0 bg-black/50 transition-opacity'
          onClick={onClose}
          aria-hidden='true'
        />

        {/* Modal */}
        <div
          className={cn(
            'relative bg-white',
            'w-full sm:max-w-lg',
            'h-screen sm:h-auto',
            'sm:rounded-lg',
            'shadow-xl',
            'transform transition-all',
            className
          )}
          role='dialog'
          aria-modal='true'
          aria-labelledby='modal-title'
        >
          <div className='sticky top-0 bg-white border-b px-4 py-3 sm:px-6'>
            <h3 id='modal-title' className='text-lg font-medium'>
              {title}
            </h3>
            <button
              onClick={onClose}
              className='absolute top-3 end-3 p-2 hover:bg-gray-100 rounded'
              aria-label='Close modal'
            >
              <svg
                className='h-5 w-5'
                fill='none'
                viewBox='0 0 24 24'
                stroke='currentColor'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M6 18L18 6M6 6l12 12'
                />
              </svg>
            </button>
          </div>

          <div className='px-4 py-5 sm:p-6 overflow-y-auto max-h-[calc(100vh-120px)] sm:max-h-[70vh]'>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
