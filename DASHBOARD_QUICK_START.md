# Customizable Dashboard - Quick Start

## 🚀 5-Minute Setup

### Step 1: Install Dependency
```bash
npm install react-grid-layout @types/react-grid-layout date-fns
```

### Step 2: Apply Migration
```bash
npx supabase migration up
```

Or run SQL manually in Supabase Dashboard:
- File: `supabase/migrations/20251022_add_dashboard_layouts.sql`

### Step 3: Add CSS Imports

In `app/layout.tsx`:
```tsx
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
```

### Step 4: Use Component

```tsx
// app/[locale]/dashboard/page.tsx
import { CustomizableDashboard } from '@/components/dashboard/CustomizableDashboard';

export default function DashboardPage() {
  return (
    <CustomizableDashboard userRole="admin" />
  );
}
```

## ✅ Done!

Visit `/en/dashboard` to see your customizable dashboard.

---

## 📚 Full Documentation
- **Complete Guide:** `CUSTOMIZABLE_DASHBOARD_GUIDE.md`
- **Installation Checklist:** `DASHBOARD_INSTALLATION_CHECKLIST.md`
- **Implementation Summary:** `DASHBOARD_IMPLEMENTATION_SUMMARY.md`

---

## 🎯 Features
✅ Drag-and-drop widgets  
✅ Resize widgets  
✅ Add/remove widgets  
✅ Layout persistence  
✅ Role-based defaults  
✅ Responsive design  
✅ 10 widget types  
✅ Auto-refresh  

---

**Setup Time:** 5-10 minutes  
**Status:** ✅ Production Ready

