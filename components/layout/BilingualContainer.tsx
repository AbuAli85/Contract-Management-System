'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import { getDirection, getFontFamily } from '@/lib/i18n/rtl';

export interface BilingualContainerProps {
  locale: string;
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
}

/**
 * Container component that automatically handles RTL/LTR layout
 *
 * @example
 * ```tsx
 * <BilingualContainer locale="ar">
 *   <p>This text will be right-aligned and use Arabic font</p>
 * </BilingualContainer>
 * ```
 */
export function BilingualContainer({
  locale,
  children,
  className,
  as: Component = 'div',
}: BilingualContainerProps) {
  const direction = getDirection(locale);
  const fontFamily = getFontFamily(locale);

  return (
    <Component dir={direction} className={cn(fontFamily, className)}>
      {children}
    </Component>
  );
}

/**
 * Card component with bilingual support
 */
export function BilingualCard({
  locale,
  title,
  subtitle,
  content,
  className,
}: {
  locale: string;
  title: string;
  subtitle?: string;
  content: React.ReactNode;
  className?: string;
}) {
  const direction = getDirection(locale);
  const fontFamily = getFontFamily(locale);

  return (
    <div
      dir={direction}
      className={cn(
        'rounded-lg border bg-card text-card-foreground shadow-sm',
        fontFamily,
        className
      )}
    >
      <div className='p-6 space-y-4'>
        <div>
          <h3
            className={cn(
              'text-lg font-bold mb-2',
              direction === 'rtl' ? 'text-right' : 'text-left'
            )}
          >
            {title}
          </h3>
          {subtitle && (
            <p
              className={cn(
                'text-sm text-muted-foreground',
                direction === 'rtl' ? 'text-right' : 'text-left'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
        <div className={direction === 'rtl' ? 'text-right' : 'text-left'}>
          {content}
        </div>
      </div>
    </div>
  );
}

/**
 * Text component with automatic alignment based on locale
 */
export function BilingualText({
  locale,
  children,
  className,
  as: Component = 'p',
}: BilingualContainerProps) {
  const direction = getDirection(locale);
  const fontFamily = getFontFamily(locale);
  const alignment = direction === 'rtl' ? 'text-right' : 'text-left';

  return (
    <Component dir={direction} className={cn(fontFamily, alignment, className)}>
      {children}
    </Component>
  );
}

/**
 * Flex container that reverses on RTL
 */
export function BilingualFlex({
  locale,
  children,
  className,
  reverse = true,
}: BilingualContainerProps & { reverse?: boolean }) {
  const direction = getDirection(locale);
  const fontFamily = getFontFamily(locale);
  const flexDirection =
    reverse && direction === 'rtl' ? 'flex-row-reverse' : 'flex-row';

  return (
    <div
      dir={direction}
      className={cn('flex', flexDirection, fontFamily, className)}
    >
      {children}
    </div>
  );
}

/**
 * Grid container with RTL support
 */
export function BilingualGrid({
  locale,
  children,
  className,
  cols = 1,
}: BilingualContainerProps & { cols?: number }) {
  const direction = getDirection(locale);
  const fontFamily = getFontFamily(locale);

  return (
    <div
      dir={direction}
      className={cn('grid gap-4', `grid-cols-${cols}`, fontFamily, className)}
    >
      {children}
    </div>
  );
}
