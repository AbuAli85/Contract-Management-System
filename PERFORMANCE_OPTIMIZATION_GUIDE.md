# Performance Optimization Guide

**Date:** October 27, 2025  
**Priority:** MEDIUM  
**Status:** READY FOR IMPLEMENTATION

## Executive Summary

This guide outlines performance optimization strategies for the SmartPro Promoters Portal, focusing on code splitting, lazy loading, asset optimization, and runtime performance improvements.

---

## 📊 Current Performance Baseline

**Targets (Lighthouse):**
- Performance: > 90
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s
- Total Blocking Time (TBT): < 200ms
- Cumulative Layout Shift (CLS): < 0.1

---

## 🚀 Optimization Strategies

### 1. Code Splitting & Lazy Loading

#### Dynamic Imports for Heavy Components

```tsx
// Before: All components loaded upfront
import { PromoterAnalytics } from '@/components/promoter-analytics-dashboard';
import { EnhancedCharts } from '@/components/dashboard/enhanced-dashboard-charts';
import { DataTable } from '@/components/ui/data-table';

// After: Dynamic imports for heavy components
import dynamic from 'next/dynamic';

const PromoterAnalytics = dynamic(
  () => import('@/components/promoter-analytics-dashboard'),
  {
    loading: () => <AnalyticsSkeleton />,
    ssr: false, // Disable SSR if not needed
  }
);

const EnhancedCharts = dynamic(
  () => import('@/components/dashboard/enhanced-dashboard-charts').then(mod => ({ default: mod.EnhancedDashboardCharts })),
  { loading: () => <ChartsSkeleton /> }
);

const DataTable = dynamic(
  () => import('@/components/ui/data-table'),
  { loading: () => <TableSkeleton /> }
);
```

#### Route-Based Code Splitting

```tsx
// Already handled by Next.js automatically
// Each page in app/[locale]/* is a separate chunk

// Further optimize by splitting large pages
// app/[locale]/analytics/page.tsx
export default function AnalyticsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <AnalyticsContent />
    </Suspense>
  );
}

// Separate component file for code splitting
async function AnalyticsContent() {
  const data = await fetchAnalyticsData();
  return <AnalyticsCharts data={data} />;
}
```

#### Component-Level Lazy Loading

```tsx
// Lazy load tabs/sections that aren't immediately visible
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { lazy, Suspense } from 'react';

const DocumentsTab = lazy(() => import('./tabs/DocumentsTab'));
const AnalyticsTab = lazy(() => import('./tabs/AnalyticsTab'));
const HistoryTab = lazy(() => import('./tabs/HistoryTab'));

export function PromoterDetails() {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="documents">Documents</TabsTrigger>
        <TabsTrigger value="analytics">Analytics</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
      </TabsList>
      
      <TabsContent value="overview">
        {/* Render immediately */}
        <OverviewContent />
      </TabsContent>
      
      <TabsContent value="documents">
        <Suspense fallback={<TabSkeleton />}>
          <DocumentsTab />
        </Suspense>
      </TabsContent>
      
      <TabsContent value="analytics">
        <Suspense fallback={<TabSkeleton />}>
          <AnalyticsTab />
        </Suspense>
      </TabsContent>
      
      <TabsContent value="history">
        <Suspense fallback={<TabSkeleton />}>
          <HistoryTab />
        </Suspense>
      </TabsContent>
    </Tabs>
  );
}
```

---

### 2. Image Optimization

#### Use Next.js Image Component

```tsx
// Before: Standard img tag
<img src="/avatar.jpg" alt="User" width="40" height="40" />

// After: Optimized Next.js Image
import Image from 'next/image';

<Image
  src="/avatar.jpg"
  alt="User"
  width={40}
  height={40}
  loading="lazy"
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRg..." // or use plaiceholder
/>
```

#### Configure Image Optimization

```js
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
};
```

#### Lazy Load Images

```tsx
// Lazy load images below the fold
<Image
  src={promoter.avatar}
  alt={promoter.name}
  width={200}
  height={200}
  loading="lazy" // Browser-native lazy loading
  onLoadingComplete={() => console.log('Image loaded')}
/>
```

---

### 3. Bundle Size Optimization

#### Analyze Bundle

```bash
# Install bundle analyzer
npm install --save-dev @next/bundle-analyzer

# Add to next.config.js
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  // ... other config
});

# Run analysis
ANALYZE=true npm run build
```

#### Tree Shaking & Dead Code Elimination

```tsx
// Before: Import entire library
import _ from 'lodash';
import * as dateFns from 'date-fns';

// After: Import only what you need
import debounce from 'lodash/debounce';
import { format, parseISO } from 'date-fns';
```

#### Replace Large Dependencies

```tsx
// Before: Moment.js (large, mutable)
import moment from 'moment';
const date = moment().format('YYYY-MM-DD');

// After: date-fns (tree-shakeable, immutable)
import { format } from 'date-fns';
const date = format(new Date(), 'yyyy-MM-dd');
```

---

### 4. Runtime Performance

#### Memoization

```tsx
import { useMemo, useCallback } from 'react';

export function PromotersList({ promoters }) {
  // Memoize expensive calculations
  const sortedPromoters = useMemo(() => {
    return promoters
      .sort((a, b) => a.name.localeCompare(b.name))
      .filter(p => p.status === 'active');
  }, [promoters]);

  // Memoize callbacks passed to children
  const handleEdit = useCallback((id: string) => {
    // Edit logic
  }, []);

  return (
    <div>
      {sortedPromoters.map(promoter => (
        <PromoterCard 
          key={promoter.id} 
          promoter={promoter}
          onEdit={handleEdit} // Stable reference
        />
      ))}
    </div>
  );
}
```

#### React.memo for Component Memoization

```tsx
import { memo } from 'react';

// Before: Re-renders on every parent render
export function PromoterCard({ promoter, onEdit }) {
  // Component logic
}

// After: Only re-renders when props change
export const PromoterCard = memo(function PromoterCard({ 
  promoter, 
  onEdit 
}: PromoterCardProps) {
  // Component logic
}, (prevProps, nextProps) => {
  // Custom comparison function (optional)
  return prevProps.promoter.id === nextProps.promoter.id &&
         prevProps.promoter.updatedAt === nextProps.promoter.updatedAt;
});
```

#### Virtualization for Long Lists

```tsx
// Install react-window
// npm install react-window

import { FixedSizeList } from 'react-window';

export function VirtualizedPromotersList({ promoters }) {
  const Row = ({ index, style }) => (
    <div style={style}>
      <PromoterCard promoter={promoters[index]} />
    </div>
  );

  return (
    <FixedSizeList
      height={600}
      itemCount={promoters.length}
      itemSize={100}
      width="100%"
    >
      {Row}
    </FixedSizeList>
  );
}
```

---

### 5. Data Fetching Optimization

#### Implement Request Deduplication

```tsx
// Already handled by React Query, but ensure proper config
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute
      cacheTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      retry: 1,
    },
  },
});
```

#### Prefetch Data

```tsx
// Prefetch on hover
import { useQueryClient } from '@tanstack/react-query';

export function PromoterLink({ promoterId }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['promoter', promoterId],
      queryFn: () => fetchPromoter(promoterId),
    });
  };

  return (
    <Link 
      href={`/promoters/${promoterId}`}
      onMouseEnter={handleMouseEnter}
    >
      View Details
    </Link>
  );
}
```

#### Parallel Data Fetching

```tsx
// Before: Sequential (slow)
const promoters = await fetchPromoters();
const contracts = await fetchContracts();
const metrics = await fetchMetrics();

// After: Parallel (fast)
const [promoters, contracts, metrics] = await Promise.all([
  fetchPromoters(),
  fetchContracts(),
  fetchMetrics(),
]);
```

---

### 6. Caching Strategies

#### Service Worker for Offline Support

```tsx
// app/layout.tsx
useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/sw.js')
      .then(reg => console.log('Service Worker registered'))
      .catch(err => console.error('Service Worker error:', err));
  }
}, []);
```

#### HTTP Caching Headers

```tsx
// app/api/*/route.ts
export async function GET(request: NextRequest) {
  const data = await fetchData();

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
    },
  });
}
```

---

### 7. Font Optimization

```tsx
// app/layout.tsx
import { Inter, Cairo } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap', // Avoid FOIT (Flash of Invisible Text)
  preload: true,
  variable: '--font-inter',
});

const cairo = Cairo({
  subsets: ['arabic'],
  display: 'swap',
  preload: true,
  variable: '--font-cairo',
});

export default function RootLayout({ children }) {
  return (
    <html className={`${inter.variable} ${cairo.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

---

## 📋 Implementation Checklist

### Phase 1: Low-Hanging Fruit (Week 1)
- [ ] Replace heavy imports with tree-shakeable alternatives
- [ ] Add loading="lazy" to images below the fold
- [ ] Memoize expensive calculations with useMemo
- [ ] Add React.memo to frequently rendered components
- [ ] Implement bundle analyzer and check for large dependencies

### Phase 2: Code Splitting (Week 2)
- [ ] Dynamic import heavy chart libraries
- [ ] Lazy load analytics components
- [ ] Split large pages into smaller chunks
- [ ] Implement progressive loading for tabs

### Phase 3: Advanced Optimizations (Week 3)
- [ ] Implement virtualization for long lists
- [ ] Add prefetching for common navigation paths
- [ ] Set up service worker for offline support
- [ ] Optimize font loading strategy
- [ ] Configure HTTP caching headers

---

## 🎯 Success Metrics

- [ ] Lighthouse Performance score > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.0s
- [ ] Total Blocking Time < 150ms
- [ ] Bundle size reduced by > 20%
- [ ] API response times < 500ms (p95)

---

## 📚 Resources

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [web.dev Performance](https://web.dev/performance/)
- [React Performance](https://react.dev/reference/react/useMemo)
- [Bundle Size Analysis](https://bundlephobia.com/)

