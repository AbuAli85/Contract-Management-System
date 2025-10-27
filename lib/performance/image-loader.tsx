/**
 * Optimized Image Loading
 * 
 * Wrapper around Next.js Image with best practices
 * 
 * @webhint disable-next-line no-inline-styles
 * Note: Inline styles are intentionally used here for dynamic avatar sizing
 */

'use client';

import React from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  priority?: boolean;
  className?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  onLoadComplete?: () => void;
}

interface ImageStyleProps {
  width?: number;
  height?: number;
}

/**
 * Optimized Image Component
 * 
 * Automatically handles:
 * - Lazy loading
 * - AVIF/WebP formats
 * - Responsive sizing
 * - Blur placeholder
 * 
 * @example
 * ```tsx
 * <OptimizedImage
 *   src="/logo.png"
 *   alt="Company logo"
 *   width={200}
 *   height={50}
 *   priority
 * />
 * ```
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  priority = false,
  className,
  objectFit = 'cover',
  onLoadComplete,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = React.useState(true);
  const [hasError, setHasError] = React.useState(false);

  if (hasError) {
    const styleProps: ImageStyleProps = {};
    if (!fill && width) styleProps.width = width;
    if (!fill && height) styleProps.height = height;
    
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-gray-100 text-gray-400',
          className
        )}
        {...(styleProps.width || styleProps.height ? { style: styleProps } : {})}
      >
        <span className="text-sm">Image failed to load</span>
      </div>
    );
  }

  const imageProps: any = {
    src,
    alt,
    fill,
    priority,
    quality: 85,
    placeholder: "blur" as const,
    blurDataURL: "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAAIAAoDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCwAB//2Q==",
    onLoad: () => {
      setIsLoading(false);
      onLoadComplete?.();
    },
    onError: () => {
      setIsLoading(false);
      setHasError(true);
    },
  };

  if (!fill) {
    if (width !== undefined) imageProps.width = width;
    if (height !== undefined) imageProps.height = height;
  }

  // Only pass className if it's defined to avoid type errors
  if (className) {
    imageProps.className = className;
  }

  return (
    <div className={cn('relative', isLoading && 'animate-pulse bg-gray-200', className)}>
      <Image
        {...imageProps}
        style={{
          objectFit,
        }}
      />
    </div>
  );
}

/**
 * Avatar Image with fallback
 */
export function AvatarImage({
  src,
  alt,
  size = 40,
  fallback,
}: {
  src?: string;
  alt: string;
  size?: number;
  fallback?: string;
}) {
  // For dynamic sizes, we need inline styles
  // Note: Inline styles are required here for avatar sizing flexibility
  const sizeStyle: React.CSSProperties = { 
    width: size, 
    height: size,
    minWidth: size,
    minHeight: size,
  };
  
  if (!src && fallback) {
    // Dynamic size requires inline styles for avatar fallback
    return (
      <div
        className="flex items-center justify-center bg-gray-200 rounded-full text-gray-600 font-medium"
        style={sizeStyle}
        data-webhint-ignore="no-inline-styles"
      >
        {fallback}
      </div>
    );
  }

  if (!src) {
    // Dynamic size requires inline styles for avatar placeholder
    return (
      <div
        className="bg-gray-200 rounded-full"
        style={sizeStyle}
        data-webhint-ignore="no-inline-styles"
      />
    );
  }

  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className="rounded-full"
      objectFit="cover"
    />
  );
}

/**
 * Responsive image with multiple breakpoints
 */
export function ResponsiveImage({
  src,
  alt,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  priority = false,
  className,
}: {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
}) {
  const imageProps: OptimizedImageProps = {
    src,
    alt,
    fill: true,
    priority,
  };
  
  if (className) {
    imageProps.className = className;
  }

  return <OptimizedImage {...imageProps} />;
}

