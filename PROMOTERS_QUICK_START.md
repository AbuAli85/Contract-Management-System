# Enhanced Promoters View - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### 1. **Import the Component**

```typescript
import { EnhancedPromotersView } from '@/components/enhanced-promoters-view';
```

### 2. **Use in Your Page**

```typescript
export default function PromotersPage({ params }: { params: { locale: string } }) {
  return <EnhancedPromotersView locale={params.locale} />;
}
```

### 3. **That's It!**

The component handles everything: data fetching, filtering, sorting, and actions.

---

## ✨ What You Get

### UI Features

- ✅ Professional gradient header
- ✅ Stat cards with animations
- ✅ Advanced filtering
- ✅ Multi-column sorting
- ✅ Color-coded status indicators
- ✅ Responsive design

### Functionality

- ✅ View promoter profiles
- ✅ Edit promoter details
- ✅ Send notifications
- ✅ Archive records with confirmation
- ✅ Bulk actions (select/filter)
- ✅ Real-time error feedback

### User Experience

- ✅ Keyboard shortcuts (⌘V, ⌘E)
- ✅ Tooltips on hover
- ✅ Loading states
- ✅ Toast notifications
- ✅ Confirmation dialogs
- ✅ Mobile responsive

---

## 🔧 Configuration

### Customize Notification Days

```typescript
// In your constants file
export const PROMOTER_NOTIFICATION_DAYS = {
  ID_EXPIRY: 30, // Days before ID expires
  PASSPORT_EXPIRY: 90, // Days before passport expires
};
```

### Customize Colors

```typescript
// In the component file
const OVERALL_STATUS_BADGES = {
  active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  warning: 'bg-amber-50 text-amber-600 border-amber-100',
  critical: 'bg-red-50 text-red-600 border-red-100',
  inactive: 'bg-slate-100 text-slate-500 border-slate-200',
};
```

---

## 📱 Features Overview

### Smart Filtering

```
Search: By name, email, phone, role, company
Lifecycle: All → Operational → Attention → Critical → Inactive
Document Health: All → Expired → Expiring → Missing
Assignment: All → Assigned → Unassigned
```

### Sorting

```
Click any column header to sort:
- Name (alphabetically)
- Documents (by days remaining)
- Status (critical to active)
- Created (by date)
```

### Quick Actions Menu

```
Click the three-dots (•••) button on any row:

📋 View & Edit
  ├─ 👁️ View profile (⌘V)
  └─ ✏️ Edit details (⌘E)

⚠️ At Risk (if documents expiring/missing)
  └─ 🔔 Remind to renew docs

🚨 Critical (if documents expired)
  └─ ⚡ Urgent notification

👤 Unassigned (if no employer)
  └─ 🏢 Assign to company

💬 Communication
  └─ 📧 Send notification

🗑️ Destructive
  └─ 📦 Archive record (with confirmation)
```

---

## 🎯 Common Tasks

### View a Promoter's Profile

1. Click anywhere on the promoter row OR
2. Click the three-dots button and select "View profile" OR
3. Press ⌘V keyboard shortcut

### Edit Promoter Details

1. Click the three-dots button and select "Edit details" OR
2. Press ⌘E keyboard shortcut OR
3. For unassigned promoters: Click "Assign to company"

### Send a Notification

1. Click the three-dots button
2. Select the notification type:
   - "Remind to renew docs" (if at risk)
   - "Urgent notification" (if critical)
   - "Send notification" (always available)

### Archive a Promoter

1. Click the three-dots button
2. Select "Archive record"
3. Confirm in the dialog that appears

### Filter Promoters

1. Use the filter section at the top
2. Search by name, email, or role
3. Filter by lifecycle, document health, or assignment
4. Click "Reset filters" to clear all

### Sort Promoters

1. Click any column header to sort
2. Click again to reverse sort direction
3. Sort indicators show direction (↑ for ascending, ↓ for descending)

---

## 📊 Understanding the Display

### Status Indicators

- 🔴 **Critical** - Requires immediate attention (expired documents)
- 🟡 **Warning** - Needs attention soon (expiring documents)
- 🟢 **Operational** - Everything is fine
- ⚪ **Inactive** - Not currently active

### Document Status

- ✓ **Valid** - Document is valid
- ⏰ **Expiring** - Document expiring soon
- ✗ **Expired** - Document has expired
- ❌ **Missing** - No document uploaded

### Assignment Status

- ✓ **Assigned** - Has an employer assigned
- ○ **Unassigned** - No employer assigned

---

## 🛠️ Troubleshooting

### Promoters Not Loading?

1. Check browser console (F12)
2. Verify API endpoint is responding: `/api/promoters`
3. Check authentication token
4. Try refreshing the page

### Actions Not Working?

1. Ensure backend API endpoints are implemented:
   - `PUT /api/promoters/:id/archive`
   - `POST /api/promoters/:id/notify`
2. Check network tab for failed requests
3. Look for error toasts (bottom right)

### Slow Performance?

1. Try filtering/searching to reduce data
2. Check page limit (default: 50)
3. Verify database indexes are in place
4. Check network connection

### Menu Items Missing?

1. At Risk items only show if documents are expiring/missing
2. Critical items only show if documents are expired
3. Unassigned items only show if no employer

---

## 🔌 API Requirements

### Endpoints Needed

```
GET    /api/promoters           (already working)
PUT    /api/promoters/:id/archive (needs implementation)
POST   /api/promoters/:id/notify  (needs implementation)
```

### See Also

- `API_ENDPOINTS_REQUIRED.md` - Complete API specifications
- `PROMOTERS_IMPLEMENTATION_GUIDE.md` - Developer guide

---

## 📚 Documentation

| Document                               | Purpose                 |
| -------------------------------------- | ----------------------- |
| **PROMOTERS_UI_ENHANCEMENTS.md**       | Visual/UI improvements  |
| **PROMOTERS_QUICK_VISUAL_SUMMARY.md**  | Before/after comparison |
| **PROMOTERS_IMPLEMENTATION_GUIDE.md**  | Developer guide         |
| **API_ENDPOINTS_REQUIRED.md**          | API specifications      |
| **PROMOTERS_ENHANCEMENTS_COMPLETE.md** | Completion summary      |

---

## 💡 Tips & Tricks

### Keyboard Shortcuts

- `⌘V` - View profile
- `⌘E` - Edit details
- `Alt+M` - Open more options menu

### Quick Filters

- Search for email: "john@"
- Search for role: "manager"
- Filter by status: Select in dropdown
- Reset all: Click "Reset filters"

### Bulk Actions

1. Use checkbox to select promoters
2. Selected count shows at top
3. Bulk action bar appears below header

### Export Data

- Click "Export view" button
- Downloads CSV of filtered results
- Includes all visible columns

---

## 🎓 Learning Resources

### Understanding the Components

- `EnhancedPromotersView` - Main component
- `EnhancedActionsMenu` - Actions dropdown
- `EnhancedPromoterRow` - Table row
- `EnhancedStatCard` - Stat cards

### Understanding the Data

- Each promoter has documents (ID, Passport)
- Each promoter has an assignment (company/employer)
- Each promoter has a status (active, inactive, etc.)
- Documents have expiry dates

### Understanding the Flow

```
User opens promoters view
  ↓
Component fetches promoter data
  ↓
Promoter data transformed for display
  ↓
Table rendered with all records
  ↓
User interacts (filter, sort, action)
  ↓
Component handles action
  ↓
API call made (if needed)
  ↓
Toast notification shown
  ↓
Data refreshed if needed
```

---

## ✅ Checklist Before Deployment

- [ ] Backend API endpoints implemented
- [ ] Database fields exist (archived_at, etc.)
- [ ] Email/notification service configured
- [ ] Authentication middleware in place
- [ ] Error logging configured
- [ ] Tests pass (functional, accessibility)
- [ ] Cross-browser testing done
- [ ] Mobile testing done
- [ ] Performance testing done
- [ ] Security review done

---

## 📞 Quick Help

### I see an error message...

1. Read the error carefully
2. Check if it's a permission error (401/403)
3. Check if the API endpoint exists
4. Look in browser console for more details

### The component is loading forever...

1. Check network tab in DevTools
2. Verify API endpoint URL is correct
3. Check authentication token
4. Look for CORS errors

### Actions don't seem to do anything...

1. Ensure backend endpoints are implemented
2. Check network tab for failed requests
3. Check browser console for errors
4. Try refreshing and trying again

---

## 🎉 You're Ready!

The Enhanced Promoters View is ready to use. Start exploring the features and enjoy the improved user experience!

**Questions?** Refer to the comprehensive guides in the documentation folder.
