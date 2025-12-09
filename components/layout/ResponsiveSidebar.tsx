'use client';

import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from '@/components/ui/sheet';

export interface ResponsiveSidebarProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
}

/**
 * Responsive Sidebar Component
 *
 * - Mobile: Hidden by default, opens as overlay sheet
 * - Tablet/Desktop: Always visible, docked to side
 *
 * @example
 * ```tsx
 * <ResponsiveSidebar title="Navigation">
 *   <NavigationItems />
 * </ResponsiveSidebar>
 * ```
 */
export function ResponsiveSidebar({
  children,
  className,
  title = 'Menu',
}: ResponsiveSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setIsOpen(!isOpen)}
        className='lg:hidden fixed top-4 start-4 z-50 bg-white shadow-md hover:bg-gray-50'
        aria-label='Toggle menu'
        aria-expanded={isOpen}
        aria-controls='mobile-sidebar'
      >
        {isOpen ? (
          <X className='h-5 w-5' aria-hidden='true' />
        ) : (
          <Menu className='h-5 w-5' aria-hidden='true' />
        )}
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className='lg:hidden fixed inset-0 bg-black/50 z-40 transition-opacity'
          onClick={() => setIsOpen(false)}
          aria-hidden='true'
        />
      )}

      {/* Sidebar - Mobile (Sheet) */}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent
          side='left'
          className='lg:hidden w-64 p-0'
          id='mobile-sidebar'
        >
          <SheetTitle className='sr-only'>{title}</SheetTitle>
          <nav
            className='h-full overflow-y-auto bg-white'
            aria-label='Main navigation'
          >
            {children}
          </nav>
        </SheetContent>
      </Sheet>

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col',
          'fixed inset-y-0 start-0',
          'w-64 bg-white border-e border-gray-200',
          'overflow-y-auto',
          'z-30',
          className
        )}
        aria-label='Main navigation'
      >
        {children}
      </aside>

      {/* Spacer for desktop layout */}
      <div
        className='hidden lg:block lg:w-64 flex-shrink-0'
        aria-hidden='true'
      />
    </>
  );
}

/**
 * Collapsible Sidebar variant
 * Can be collapsed on desktop
 */
export function CollapsibleSidebar({
  children,
  className,
  defaultCollapsed = false,
  onCollapsedChange,
}: ResponsiveSidebarProps & {
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(defaultCollapsed);

  const handleToggleCollapsed = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    onCollapsedChange?.(newState);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <Button
        variant='ghost'
        size='icon'
        onClick={() => setIsOpen(!isOpen)}
        className='lg:hidden fixed top-4 start-4 z-50 bg-white shadow-md'
        aria-label='Toggle menu'
      >
        {isOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
      </Button>

      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className='lg:hidden fixed inset-0 bg-black/50 z-40'
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar - Mobile */}
      <div
        className={cn(
          'lg:hidden fixed inset-y-0 start-0 z-40',
          'w-64 bg-white shadow-xl',
          'transform transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {children}
      </div>

      {/* Sidebar - Desktop */}
      <aside
        className={cn(
          'hidden lg:flex lg:flex-col',
          'fixed inset-y-0 start-0 z-30',
          'bg-white border-e border-gray-200',
          'transition-all duration-300 ease-in-out',
          isCollapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        <Button
          variant='ghost'
          size='icon'
          onClick={handleToggleCollapsed}
          className='absolute top-4 end-4'
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <Menu className='h-4 w-4' />
          ) : (
            <X className='h-4 w-4' />
          )}
        </Button>
        <div className={cn('overflow-y-auto', isCollapsed && 'px-2')}>
          {children}
        </div>
      </aside>

      {/* Spacer */}
      <div
        className={cn(
          'hidden lg:block flex-shrink-0',
          'transition-all duration-300',
          isCollapsed ? 'lg:w-16' : 'lg:w-64'
        )}
      />
    </>
  );
}
