# Design System Style Guide

## Color System

### Semantic Color Palette

Our application uses a **5-color semantic system** to ensure consistency and improve usability.

| Color                  | Usage                                      | Examples                                             |
| ---------------------- | ------------------------------------------ | ---------------------------------------------------- |
| **🔴 Red (Critical)**  | Errors, expired items, critical alerts     | Expired documents, system errors, critical status    |
| **🟡 Amber (Warning)** | Warnings, items expiring soon              | Documents expiring in 30 days, attention needed      |
| **🟢 Green (Success)** | Success states, valid items, active status | Active promoters, valid documents, success messages  |
| **🔵 Blue (Info)**     | Information, primary actions, navigation   | Info messages, primary buttons, navigation items     |
| **⚪ Gray (Neutral)**  | Neutral, inactive states                   | Disabled items, inactive status, neutral information |

### Color Implementation

```typescript
// Use semantic colors from design system
import { SEMANTIC_COLORS, getStatusColor } from '@/lib/design-system/colors';

// For status badges
<StatusBadge status="success">Active</StatusBadge>
<StatusBadge status="warning">Expiring Soon</StatusBadge>
<StatusBadge status="critical">Expired</StatusBadge>

// For custom components
const colors = SEMANTIC_COLORS.success;
<div className={colors.background}>
  <span className={colors.text}>Success message</span>
</div>
```

### Status Mappings

#### Document Status

- `valid` → Green (Success)
- `expiring` → Amber (Warning)
- `expired` → Red (Critical)
- `missing` → Gray (Neutral)

#### Overall Status

- `active` → Green (Success)
- `warning` → Amber (Warning)
- `critical` → Red (Critical)
- `inactive` → Gray (Neutral)

#### Notification Types

- `error` → Red (Critical)
- `warning` → Amber (Warning)
- `success` → Green (Success)
- `info` → Blue (Info)
- `neutral` → Gray (Neutral)

---

## Component Guidelines

### Status Badges

Use the `StatusBadge` component for consistent status indicators:

```tsx
import { StatusBadge, DocumentStatusBadge, OverallStatusBadge } from '@/components/ui/status-badge';

// Generic status badge
<StatusBadge status="success">Active</StatusBadge>

// Pre-configured badges
<DocumentStatusBadge status="valid">Valid</DocumentStatusBadge>
<OverallStatusBadge status="active">Active</OverallStatusBadge>
```

### Button Colors

Apply semantic colors to buttons based on their action:

```tsx
// Primary actions (info/blue)
<Button className="bg-blue-600 hover:bg-blue-700">Save</Button>

// Success actions (green)
<Button className="bg-green-600 hover:bg-green-700">Approve</Button>

// Warning actions (amber)
<Button className="bg-amber-600 hover:bg-amber-700">Review</Button>

// Danger actions (red)
<Button className="bg-red-600 hover:bg-red-700">Delete</Button>
```

### Tab Navigation

Use consistent colors for tab states:

```tsx
// Active tab (info/blue)
className = 'bg-blue-100 text-blue-700 border-blue-200';

// Inactive tab (neutral/gray)
className = 'bg-gray-50 text-gray-600 border-gray-200';
```

### Filter Labels

Apply semantic colors based on filter purpose:

```tsx
// Attention filters (warning/amber)
className = 'bg-amber-100 text-amber-800';

// General filters (info/blue)
className = 'bg-blue-100 text-blue-800';

// Critical filters (critical/red)
className = 'bg-red-100 text-red-800';
```

---

## Prohibited Colors

### ❌ Don't Use These Colors

- **Pink** - No semantic meaning
- **Purple** - No semantic meaning
- **Teal** - No semantic meaning
- **Cyan** - No semantic meaning
- **Indigo** - No semantic meaning
- **Violet** - No semantic meaning

### ❌ Don't Use Random Colors

- Colors without semantic meaning
- More than 5 colors in one interface
- Decorative colors that don't convey information
- Colors that contradict their semantic meaning

---

## Accessibility

### Color Contrast

All colors meet WCAG AA contrast requirements:

- **Text on colored backgrounds**: 4.5:1 minimum
- **Large text**: 3:1 minimum
- **Interactive elements**: 3:1 minimum

### Color Independence

Never rely solely on color to convey information:

```tsx
// ✅ Good - Color + Icon + Text
<StatusBadge status="critical">
  <AlertTriangle className="w-4 h-4" />
  Expired
</StatusBadge>

// ❌ Bad - Color only
<div className="bg-red-500 w-4 h-4" />
```

---

## Implementation Examples

### Before (Inconsistent)

```tsx
// Random colors with no meaning
<div className="bg-pink-100 text-pink-800">Tab 1</div>
<div className="bg-purple-100 text-purple-800">Tab 2</div>
<div className="bg-orange-100 text-orange-800">Tab 3</div>

// Inconsistent status colors
<span className="bg-emerald-50 text-emerald-600">Active</span>
<span className="bg-amber-50 text-amber-600">Warning</span>
<span className="bg-red-50 text-red-600">Critical</span>
```

### After (Consistent)

```tsx
// Semantic colors with clear meaning
<div className="bg-blue-100 text-blue-700">Active Tab</div>
<div className="bg-gray-50 text-gray-600">Inactive Tab</div>

// Consistent status colors
<StatusBadge status="success">Active</StatusBadge>
<StatusBadge status="warning">Warning</StatusBadge>
<StatusBadge status="critical">Critical</StatusBadge>
```

---

## Development Guidelines

### 1. Use Design System Colors

```typescript
// ✅ Good - Use semantic colors
import { SEMANTIC_COLORS } from '@/lib/design-system/colors';
const colors = SEMANTIC_COLORS.success;

// ❌ Bad - Hardcoded colors
className = 'bg-green-50 text-green-700';
```

### 2. Check Color Meaning

Before using a color, ask:

- What does this color mean to users?
- Is it consistent with other similar elements?
- Does it follow the semantic system?

### 3. Test Color Consistency

- Verify all similar elements use the same colors
- Check that colors have semantic meaning
- Ensure no more than 5 colors in one view

### 4. Use Status Components

```tsx
// ✅ Good - Use status components
<DocumentStatusBadge status="valid">Valid</DocumentStatusBadge>

// ❌ Bad - Custom status styling
<span className="bg-green-50 text-green-700">Valid</span>
```

---

## Migration Checklist

When updating components to use the new color system:

- [ ] Replace hardcoded colors with semantic colors
- [ ] Use `StatusBadge` components for status indicators
- [ ] Apply consistent colors to similar elements
- [ ] Remove random decorative colors
- [ ] Test color accessibility
- [ ] Verify semantic meaning is clear

---

## Benefits

### For Users

- **Intuitive**: Colors have clear, consistent meaning
- **Reduced cognitive load**: No need to learn new color meanings
- **Better accessibility**: High contrast, color-independent design

### For Developers

- **Consistent**: One source of truth for colors
- **Maintainable**: Easy to update colors globally
- **Scalable**: Clear guidelines for new components

### For Design

- **Professional**: Clean, cohesive visual design
- **Usable**: Colors support user tasks
- **Accessible**: Meets accessibility standards

---

## Quick Reference

### Color Classes

```css
/* Critical/Error */
.bg-red-50, .text-red-700, .border-red-200

/* Warning/Attention */
.bg-amber-50, .text-amber-700, .border-amber-200

/* Success/Active */
.bg-green-50, .text-green-700, .border-green-200

/* Info/Primary */
.bg-blue-50, .text-blue-700, .border-blue-200

/* Neutral/Inactive */
.bg-gray-50, .text-gray-700, .border-gray-200
```

### Component Usage

```tsx
// Status badges
<StatusBadge status="success">Active</StatusBadge>

// Document status
<DocumentStatusBadge status="valid">Valid</DocumentStatusBadge>

// Overall status
<OverallStatusBadge status="active">Active</OverallStatusBadge>
```

This design system ensures a **professional, intuitive, and consistent** user experience across the entire application.
