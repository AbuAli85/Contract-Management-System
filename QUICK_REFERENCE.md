# SmartPro Portal Improvements - Quick Reference Guide

## 🚀 New Features At A Glance

### Data Integrity & Validation

```typescript
// Check data integrity
import { runFullDataIntegrityCheck } from '@/lib/metrics';
const report = await runFullDataIntegrityCheck();

// Validate metrics before display
import { validateMetrics } from '@/lib/metrics';
const validation = validateMetrics(metrics);
if (!validation.isValid) {
  console.error('Invalid metrics:', validation.errors);
}
```

### Navigation with Smart Badges

```tsx
import { NavigationItem } from '@/components/navigation/NavigationItem';
import { useNavigationBadges } from '@/hooks/useNavigationBadges';

function MyNav() {
  const { badges } = useNavigationBadges();

  return (
    <NavigationItem
      label='Promoters'
      href='/promoters'
      icon={Users}
      badge={badges.promoters} // Shows critical/expiring counts with tooltip
    />
  );
}
```

### Form Completion Tracking

```tsx
import { useFormCompletion } from '@/hooks/useFormCompletion';
import { FormCompletionIndicator } from '@/components/forms/FormCompletionIndicator';

function MyForm() {
  const [formData, setFormData] = useState({});
  const completion = useFormCompletion({
    formData,
    requiredFields: ['name', 'email', 'phone'],
    optionalFields: ['address', 'notes'],
  });

  return (
    <>
      <FormCompletionIndicator {...completion} showDetails />
      {/* Your form fields */}
    </>
  );
}
```

### Bilingual Support (RTL)

```tsx
import {
  BilingualContainer,
  BilingualCard,
} from '@/components/layout/BilingualContainer';

function MyComponent({ locale }) {
  return (
    <BilingualContainer locale={locale}>
      <BilingualCard
        locale={locale}
        title='عنوان' // Automatically right-aligned for Arabic
        content={<p>المحتوى</p>}
      />
    </BilingualContainer>
  );
}
```

### Accessible Components

```tsx
import { AccessibleButton } from '@/components/accessibility/AccessibleButton';
import { AccessibleFormField } from '@/components/accessibility/AccessibleForm';

function MyUI() {
  return (
    <>
      <AccessibleButton
        ariaLabel='Save contract'
        icon={Save}
        onClick={handleSave}
        kbd='⌘S'
      >
        Save
      </AccessibleButton>

      <AccessibleFormField
        id='email'
        label='Email'
        required
        error={errors.email}
        hint="We'll never share your email"
      >
        <Input {...register('email')} />
      </AccessibleFormField>
    </>
  );
}
```

### Keyboard Shortcuts

```tsx
import {
  KeyboardShortcuts,
  useCommonShortcuts,
} from '@/components/accessibility/KeyboardShortcuts';

function MyApp() {
  const shortcuts = useCommonShortcuts();
  // Ctrl+K: Search
  // Ctrl+H: Home
  // /: Focus search
  // ?: Show shortcuts help

  return <KeyboardShortcuts shortcuts={shortcuts} />;
}
```

### Responsive Layout

```tsx
import { ResponsiveSidebar } from '@/components/layout/ResponsiveSidebar';
import {
  MetricsGrid,
  ResponsiveContainer,
} from '@/components/layout/ResponsiveGrid';

function Dashboard() {
  return (
    <>
      <ResponsiveSidebar>
        {/* Collapses to hamburger on mobile */}
      </ResponsiveSidebar>

      <ResponsiveContainer>
        <MetricsGrid>
          {/* Auto-adjusts: 1 col mobile, 2 tablet, 4 desktop */}
          <MetricCard />
          <MetricCard />
          <MetricCard />
          <MetricCard />
        </MetricsGrid>
      </ResponsiveContainer>
    </>
  );
}
```

### Global Search

```tsx
import { GlobalSearch } from '@/components/search/GlobalSearch';

function Header() {
  return (
    <GlobalSearch
      placeholder='Search contracts, promoters, parties...'
      onResultSelect={result => {
        console.log('Selected:', result);
      }}
    />
  );
}
```

### Real-time Updates

```tsx
import { useRealtimeUpdates } from '@/hooks/useRealtimeUpdates';
import { RealtimeDashboard } from '@/components/realtime/RealtimeDashboard';

// Auto-refresh when data changes
function MyComponent() {
  useRealtimeUpdates({
    table: 'contracts',
    onChange: payload => {
      refetchData();
    },
  });
}

// Or wrap entire dashboard
function Dashboard() {
  return (
    <RealtimeDashboard>
      <DashboardContent />
    </RealtimeDashboard>
  );
}
```

### Performance Optimization

```tsx
// Memoized components
import {
  MetricCard,
  DataTableRow,
} from '@/lib/performance/optimized-components';

// Lazy-loaded heavy components
import { LazyLineChart, LazyDataTable } from '@/lib/performance/lazy-imports';

// Optimized images
import { OptimizedImage, AvatarImage } from '@/lib/performance/image-loader';

function MyPage() {
  return (
    <>
      <MetricCard title='Sales' value={1234} /> {/* Memoized */}
      <LazyLineChart data={chartData} /> {/* Loaded on demand */}
      <OptimizedImage src='/logo.png' alt='Logo' width={200} height={50} />
    </>
  );
}
```

## 📊 API Endpoints

### Badge Counts

```
GET /api/navigation/badge-counts
Returns: {
  promoters: { critical: number, expiring: number },
  contracts: { pendingApprovals: number, expiringSoon: number },
  parties: { pendingVerification: number },
  notifications: { unread: number }
}
```

### Metrics Validation

```
GET /api/metrics/validate
Returns: Full data integrity report (admin only)

POST /api/metrics/validate
Body: { metrics: {...} }
Returns: Validation results
```

### Global Search

```
GET /api/search?q=query&limit=5
Returns: {
  results: SearchResult[],
  count: number,
  query: string
}
```

## 🎨 Tailwind RTL Classes

Use direction-agnostic classes for RTL support:

```css
/* Instead of ml-4 use: */ ms-4  /* margin-start */
/* Instead of mr-4 use: */ me-4  /* margin-end */
/* Instead of pl-4 use: */ ps-4  /* padding-start */
/* Instead of pr-4 use: */ pe-4  /* padding-end */
/* Instead of text-left use: */ text-start
/* Instead of text-right use: */ text-end
```

## ⌨️ Keyboard Shortcuts

| Shortcut            | Action                       |
| ------------------- | ---------------------------- |
| `Ctrl+K` or `Cmd+K` | Open global search           |
| `Ctrl+H` or `Cmd+H` | Go to dashboard              |
| `/`                 | Focus search input           |
| `Shift+?`           | Show keyboard shortcuts help |
| `Esc`               | Close modal/dropdown         |
| `↑↓`                | Navigate search results      |
| `Enter`             | Select search result         |

## 🧪 Testing Utilities

```typescript
// __tests__/lib/metrics.test.ts
import { validateMetrics, checkDataConsistency } from '@/lib/metrics';

describe('Metrics', () => {
  it('validates metrics correctly', () => {
    const validation = validateMetrics(mockMetrics);
    expect(validation.isValid).toBe(true);
  });
});
```

## 📱 Mobile Breakpoints

```typescript
// Tailwind breakpoints
sm: '640px'   // Mobile landscape
md: '768px'   // Tablet
lg: '1024px'  // Desktop
xl: '1280px'  // Large desktop
2xl: '1536px' // Extra large
```

## ♿ Accessibility Checklist

✅ ARIA labels on all interactive elements  
✅ Keyboard navigation support  
✅ Skip to main content link  
✅ Screen reader announcements  
✅ Focus management  
✅ Color contrast (WCAG AA)  
✅ Form validation errors  
✅ Loading states

## 🔧 Configuration

### Enable Real-time (Supabase)

Realtime is automatically enabled. To use:

1. Ensure Supabase Realtime is enabled in project settings
2. Subscribe to table changes using `useRealtimeUpdates` hook

### Enable Search

Search is automatically available. No configuration needed.

### Enable RTL

1. Set locale to 'ar' in URL: `/ar/dashboard`
2. Components automatically adjust direction

## 📦 New Dependencies

```json
{
  "tailwindcss-rtl": "^0.9.0",
  "use-debounce": "^10.0.6"
}
```

## 🐛 Troubleshooting

### Metrics validation fails

```typescript
// Check console for validation errors
const report = await runFullDataIntegrityCheck();
console.log('Validation:', report.metricsValidation);
console.log('Consistency:', report.consistencyChecks);
```

### Real-time not working

1. Check Supabase Realtime is enabled
2. Check browser console for WebSocket errors
3. Verify table has RLS policies that allow SELECT

### Search not returning results

1. Check user has permission to view data
2. Verify search query is at least 2 characters
3. Check API route `/api/search` is accessible

## 📚 Additional Resources

- Full Implementation Summary: `IMPLEMENTATION_SUMMARY.md`
- Original Guide: Implementation guide document provided
- Component Documentation: See JSDoc comments in source files
- Type Definitions: Check `*.d.ts` files for type information

## 🎯 Quick Wins

1. **Add validation to dashboard**: Import `validateMetrics` and check before display
2. **Add form progress**: Use `useFormCompletion` hook on any form
3. **Make component mobile-friendly**: Wrap in `ResponsiveContainer`
4. **Add real-time updates**: Wrap page in `RealtimeDashboard`
5. **Optimize images**: Replace `<img>` with `<OptimizedImage>`

---

**Need help?** Check the full documentation in `IMPLEMENTATION_SUMMARY.md`
