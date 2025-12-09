/**
 * Lazy-loaded Component Imports
 *
 * Use dynamic imports for heavy components to reduce initial bundle size
 */

import dynamic from 'next/dynamic';
import React from 'react';

// Charts (usually heavy)
export const LazyLineChart = dynamic(
  () => import('@/components/charts/LineChart').then(mod => mod.LineChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false, // Disable SSR for charts
  }
);

export const LazyBarChart = dynamic(
  () => import('@/components/charts/BarChart').then(mod => mod.BarChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

export const LazyPieChart = dynamic(
  () => import('@/components/charts/PieChart').then(mod => mod.PieChart),
  {
    loading: () => <ChartSkeleton />,
    ssr: false,
  }
);

// Advanced dashboard components
export const LazyAdvancedDashboard = dynamic(
  () =>
    import('@/components/advanced/advanced-dashboard').then(
      mod => mod.AdvancedDashboard
    ),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false,
  }
);

// Rich text editor (very heavy)
export const LazyRichTextEditor = dynamic(
  () =>
    import('@/components/editor/RichTextEditor').then(
      mod => mod.RichTextEditor
    ),
  {
    loading: () => <EditorSkeleton />,
    ssr: false,
  }
);

// PDF viewer
export const LazyPDFViewer = dynamic(
  () => import('@/components/pdf/PDFViewer').then(mod => mod.PDFViewer),
  {
    loading: () => <PDFSkeleton />,
    ssr: false,
  }
);

// Data table with advanced features
export const LazyDataTable = dynamic(
  () => import('@/components/tables/DataTable').then(mod => mod.DataTable),
  {
    loading: () => <TableSkeleton />,
  }
);

// Image gallery
export const LazyImageGallery = dynamic(
  () => import('@/components/media/ImageGallery').then(mod => mod.ImageGallery),
  {
    loading: () => <GallerySkeleton />,
    ssr: false,
  }
);

// Skeleton components
function ChartSkeleton() {
  return (
    <div className='animate-pulse bg-gray-200 rounded-lg h-64 flex items-center justify-center'>
      <div className='text-gray-400'>Loading chart...</div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {[...Array(4)].map((_, i) => (
          <div key={i} className='animate-pulse bg-gray-200 rounded-lg h-32' />
        ))}
      </div>
      <div className='animate-pulse bg-gray-200 rounded-lg h-96' />
    </div>
  );
}

function EditorSkeleton() {
  return (
    <div className='animate-pulse space-y-2'>
      <div className='bg-gray-200 h-10 rounded' />
      <div className='bg-gray-200 h-64 rounded' />
    </div>
  );
}

function PDFSkeleton() {
  return (
    <div className='animate-pulse bg-gray-200 rounded-lg h-[600px] flex items-center justify-center'>
      <div className='text-gray-400'>Loading PDF...</div>
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className='animate-pulse space-y-2'>
      <div className='bg-gray-200 h-10 rounded' />
      {[...Array(5)].map((_, i) => (
        <div key={i} className='bg-gray-200 h-16 rounded' />
      ))}
    </div>
  );
}

function GallerySkeleton() {
  return (
    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
      {[...Array(8)].map((_, i) => (
        <div
          key={i}
          className='animate-pulse bg-gray-200 rounded-lg aspect-square'
        />
      ))}
    </div>
  );
}

/**
 * Preload a component
 * Useful for prefetching components that will likely be needed
 */
export function preloadComponent(componentPath: string) {
  return () => import(componentPath);
}
