# Enhanced Promoters View - Implementation Guide

## 📋 Table of Contents
1. [Overview](#overview)
2. [Component Architecture](#component-architecture)
3. [Key Features](#key-features)
4. [Usage Guide](#usage-guide)
5. [Customization](#customization)
6. [Troubleshooting](#troubleshooting)

---

## Overview

The `EnhancedPromotersView` component is a sophisticated, feature-rich interface for managing promoter records. It combines data visualization, smart actions, and improved UX into a single cohesive system.

### File Location
```
components/enhanced-promoters-view.tsx
```

### Dependencies
- React 18+
- Next.js 14+
- TanStack React Query
- Shadcn UI Components
- Lucide Icons
- date-fns

---

## Component Architecture

### Main Components

#### 1. **EnhancedPromotersView**
The main component that orchestrates the entire view.

```typescript
export function EnhancedPromotersView({ locale }: PromotersViewProps)
```

**Responsibilities:**
- Fetching promoter data
- Managing filters and sorting
- Rendering header, metrics, and table
- Handling bulk actions

#### 2. **EnhancedActionsMenu**
Context-aware dropdown menu for individual promoter actions.

```typescript
function EnhancedActionsMenu({ promoter, onView, onEdit }: EnhancedActionsMenuProps)
```

**Features:**
- Dynamic action visibility based on status
- Keyboard shortcut hints
- Confirmation dialogs for destructive actions
- Toast notifications

#### 3. **EnhancedPromoterRow**
Individual row in the promoter table.

```typescript
function EnhancedPromoterRow({ promoter, isSelected, onSelect, onView, onEdit }: EnhancedPromoterRowProps)
```

**Features:**
- Status-based row styling
- Hover animations
- Tooltip integration
- Selection checkbox

#### 4. **EnhancedStatCard**
Summary statistics card.

```typescript
function EnhancedStatCard({ title, value, helper, icon, variant, trend }: EnhancedStatCardProps)
```

**Features:**
- Multiple style variants
- Hover animations
- Trend indicators
- Icon support

---

## Key Features

### 1. Context-Aware Actions Menu

The actions menu dynamically adapts based on promoter status:

```typescript
// At Risk Detection
const isAtRisk = 
  promoter.idDocument.status !== 'valid' || 
  promoter.passportDocument.status !== 'valid';

// Critical Detection
const isCritical = promoter.overallStatus === 'critical';

// Unassigned Detection
const isUnassigned = promoter.assignmentStatus === 'unassigned';
```

### 2. Confirmation Dialogs

Prevents accidental deletions:

```typescript
<AlertDialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Archive Record?</AlertDialogTitle>
      <AlertDialogDescription>
        Are you sure you want to archive {promoter.displayName}?
      </AlertDialogDescription>
    </AlertDialogHeader>
    {/* Actions */}
  </AlertDialogContent>
</AlertDialog>
```

### 3. Keyboard Shortcuts

Visual hints for power users:

```typescript
<kbd className='pointer-events-none ml-auto hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 md:flex'>
  <span className='text-xs'>⌘</span>V
</kbd>
```

### 4. Smart Filtering

Multiple filter dimensions:

```typescript
- Lifecycle (All, Operational, Attention, Critical, Inactive)
- Document Health (All, Expired, Expiring, Missing)
- Assignment (All, Assigned, Unassigned)
- Search (Name, email, phone, role, company)
```

### 5. Sorting

Multi-column sorting with visual indicators:

```typescript
- Name (alphabetical)
- Documents (by days remaining)
- Status (critical → active)
- Created (by date)
```

---

## Usage Guide

### Basic Implementation

```typescript
import { EnhancedPromotersView } from '@/components/enhanced-promoters-view';

export default function PromotersPage({ params }: { params: { locale: string } }) {
  return (
    <EnhancedPromotersView locale={params.locale} />
  );
}
```

### API Response Format

The component expects promoter data in this format:

```typescript
interface PromotersResponse {
  success: boolean;
  promoters: Promoter[];
  count: number;
  total: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
  timestamp: string;
}
```

### Promoter Data Structure

```typescript
interface Promoter {
  id: string;
  name_en: string;
  name_ar?: string;
  email: string;
  mobile_number?: string;
  phone?: string;
  status: string;
  employer_id?: string;
  job_title?: string;
  work_location?: string;
  profile_picture_url?: string;
  id_card_expiry_date?: string;
  passport_expiry_date?: string;
  created_at: string;
  parties?: {
    name_en?: string;
    name_ar?: string;
  };
}
```

---

## Customization

### Adding New Actions

To add a new action to the menu:

1. **Add the action handler:**
```typescript
const handleNewAction = () => {
  toast({
    title: 'Action Completed',
    description: `Action performed on ${promoter.displayName}`,
  });
};
```

2. **Add the menu item:**
```typescript
<DropdownMenuItem onClick={handleNewAction} className='cursor-pointer gap-2'>
  <YourIcon className='h-4 w-4 text-color-500' />
  <div className='flex-1'>
    <div className='font-medium'>Action Title</div>
    <div className='text-xs text-muted-foreground'>Description</div>
  </div>
</DropdownMenuItem>
```

### Customizing Colors

Update the status color constants:

```typescript
const OVERALL_STATUS_BADGES: Record<OverallStatus, string> = {
  active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
  critical: 'bg-red-50 text-red-600 border-red-100',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
};
```

### Adjusting Document Thresholds

Modify notification days in your constants:

```typescript
export const PROMOTER_NOTIFICATION_DAYS = {
  ID_EXPIRY: 30,      // Days before ID expires
  PASSPORT_EXPIRY: 90, // Days before passport expires
};
```

---

## Troubleshooting

### Issue: Promoters Not Displaying

**Check:**
1. API endpoint is responding correctly
2. Response format matches expected structure
3. Browser console for network errors
4. Check user permissions

**Debug:**
```typescript
console.log('🔄 Fetching promoters from API...');
console.log('📦 API Payload received:', payload);
```

### Issue: Actions Menu Not Showing

**Check:**
1. DropdownMenu component is imported
2. TooltipProvider is wrapping the component
3. CSS classes are applied correctly

### Issue: Sorting Not Working

**Check:**
1. sortField and sortOrder state are updating
2. handleSort function is connected
3. Data is being sorted in useMemo

### Issue: Filters Not Applied

**Check:**
1. Filter state is updating on change
2. filteredPromoters useMemo has correct dependencies
3. Filters are being applied in correct order

---

## Performance Optimization Tips

### 1. **Data Fetching**
```typescript
const { data: response } = useQuery({
  queryKey: ['promoters', page, limit],
  queryFn: () => fetchPromoters(page, limit),
  staleTime: 30_000,      // 30 seconds
  retry: 1,               // Only retry once
  refetchOnWindowFocus: false,
});
```

### 2. **Memoization**
```typescript
const dashboardPromoters = useMemo(() => {
  return promoters.map(/* transformation */);
}, [promoters]);
```

### 3. **Virtualization Ready**
The component is prepared for virtualization:
```typescript
// Commented out but available:
// const virtualizer = useVirtualizer({...});
```

---

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

---

## Accessibility Features

- ✅ WCAG 2.1 AA compliant
- ✅ Keyboard navigation support
- ✅ Screen reader friendly
- ✅ Color contrast compliance
- ✅ Semantic HTML structure
- ✅ ARIA labels on interactive elements

---

## Migration Guide

### From Old Promoters View

If migrating from an older promoters view:

1. **Update imports:**
```typescript
// Old
import { PromotersView } from '@/components/promoters-view';

// New
import { EnhancedPromotersView } from '@/components/enhanced-promoters-view';
```

2. **Update component usage:**
```typescript
// Old
<PromotersView locale={locale} />

// New
<EnhancedPromotersView locale={locale} />
```

3. **Ensure API endpoint returns required fields**

4. **Update any custom styles** if needed

---

## API Endpoint Requirements

### GET /api/promoters

**Query Parameters:**
- `page` (number): Page number (1-based)
- `limit` (number): Records per page (default: 50)
- `_t` (timestamp): Cache-busting parameter

**Response:**
```json
{
  "success": true,
  "promoters": [{...}],
  "count": 50,
  "total": 250,
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 250,
    "totalPages": 5,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

---

## Future Enhancement Opportunities

1. **Column Customization**
   - Allow users to show/hide columns
   - Persist column preferences

2. **Advanced Search**
   - Search operators (e.g., status:critical)
   - Saved searches

3. **Bulk Operations**
   - Bulk status updates
   - Bulk assign to company
   - Bulk send notifications

4. **Export Functionality**
   - Export to Excel
   - Export to PDF
   - Email export

5. **Real-time Updates**
   - WebSocket integration
   - Live sync indicators
   - Conflict resolution

6. **Analytics**
   - Document expiry trends
   - Assignment metrics
   - Compliance analytics

---

## Support & Maintenance

For issues or questions:
1. Check console logs (F12)
2. Review this guide
3. Check browser compatibility
4. Review API response format
5. Contact development team

---

## Version History

### v2.0.0 (Current)
- ✅ Context-aware actions
- ✅ Enhanced tooltips
- ✅ Confirmation dialogs
- ✅ Keyboard shortcuts
- ✅ Improved visual design
- ✅ Better accessibility

### v1.0.0 (Legacy)
- Basic promoter listing
- Simple actions menu
- Standard filtering

---

## License

Part of the Contract Management System project.
All rights reserved.
