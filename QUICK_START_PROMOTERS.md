# Quick Start: Using the New Promoters System

## Overview
The promoters system has been streamlined to provide a better user experience. Here's how to use it:

---

## Main Pages

### 1. Promoters Intelligence Hub (`/promoters`)
**Your main page for viewing and managing all promoters**

#### Features:
- 📊 **Metrics Cards** (clickable for quick filtering):
  - Total Promoters
  - Active Promoters  
  - Document Alerts
  - Compliance Rate

- 🔍 **Search & Filters**:
  - Search by name, email, phone, ID
  - Filter by status (Active/Warning/Critical/Inactive)
  - Filter by document health (Expired/Expiring/Missing)
  - Filter by assignment (Assigned/Unassigned)

- 👁️ **View Modes**:
  - **Table** - Detailed list with all information
  - **Grid** - Compact cards for quick overview
  - **Cards** - Detailed cards with full contact info

- 🔄 **Pagination**:
  - Navigate through all promoters
  - Adjust page size (10, 20, 50, 100)
  - See total count: "X records on this page (of Y total)"

#### How to Access:
1. Click "Promoters" in the sidebar
2. Or navigate to `/[locale]/promoters`

---

### 2. Promoter Detail Page (`/manage-promoters/[id]`)
**View complete information about a single promoter**

#### Tabs:
1. **Personal**
   - Basic information
   - Contact details
   - Document status (ID, Passport)
   - Document upload/download

2. **Professional**
   - Contract information
   - Working status
   - Professional background
   - CV/Resume

3. **Advanced**
   - Attendance & Performance
   - Reports & Analytics
   - Performance Ranking
   - CRM data
   - Financial information
   - Skills & Certifications

4. **Activity**
   - Activity timeline
   - Audit logs (admin only)

#### How to Access:
1. From Intelligence Hub, click "View" (eye icon) on any promoter
2. Or navigate to `/[locale]/manage-promoters/[promoter-id]`

---

### 3. Edit Promoter (`/manage-promoters/[id]/edit`)
**Edit promoter information**

#### How to Access:
1. From Intelligence Hub, click "Edit" (pencil icon) on any promoter
2. From Detail Page, click "Edit" button
3. Or navigate to `/[locale]/manage-promoters/[promoter-id]/edit`

---

### 4. Add New Promoter (`/manage-promoters/new`)
**Add a new promoter to the system**

#### How to Access:
1. Click "Add Promoter" in the sidebar
2. From Intelligence Hub, click "+ Add Promoter" button
3. Or navigate to `/[locale]/manage-promoters/new`

---

## Common Tasks

### Task 1: View All Promoters
```
Sidebar → Promoters → See Intelligence Hub
```

### Task 2: Find Promoters with Expiring Documents
```
Sidebar → Promoters → Click "Document Alerts" card
OR
Sidebar → Promoters → Use Document Filter → Select "Expiring"
```

### Task 3: View Promoter Details
```
Sidebar → Promoters → Find promoter → Click "View" button
```

### Task 4: Edit Promoter Information
```
Sidebar → Promoters → Find promoter → Click "Edit" button
```

### Task 5: Add New Promoter
```
Sidebar → Add Promoter → Fill form → Save
```

### Task 6: Export Promoters
```
Sidebar → Promoters → Apply filters (optional) → Click "Export" button
```

### Task 7: Check Promoter Documents
```
Sidebar → Promoters → View promoter → Personal tab → See document status
```

### Task 8: Switch View Modes
```
Sidebar → Promoters → Click Table/Grid/Cards tabs at top
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + R` | Refresh data |
| `Cmd/Ctrl + N` | Add new promoter |
| `Escape` | Clear selection |

---

## Status Indicators

### Overall Status Badges
- 🟢 **Active** - All good, no issues
- 🟡 **Warning** - Documents expiring soon
- 🔴 **Critical** - Documents expired
- ⚪ **Inactive** - Not currently active

### Document Status
- 🟢 **Valid** - Document valid for > threshold days
- 🟡 **Expiring** - Document expires within threshold
- 🔴 **Expired** - Document expired
- ⚪ **Missing** - No document provided

---

## Tips & Tricks

### 1. Quick Filtering with Metrics Cards
Click any metrics card to instantly filter:
- **Total Promoters** → Shows all
- **Active** → Shows assigned active promoters only
- **Alerts** → Shows promoters with document issues
- **Compliance** → Shows compliant promoters

### 2. Persistent View Mode
Your view mode preference (Table/Grid/Cards) is saved automatically

### 3. Shareable Links
Pagination state is in the URL - share links to specific pages

### 4. Bulk Actions
- Select multiple promoters with checkboxes
- Click "Select All" to select all on current page
- Use bulk actions bar for batch operations

### 5. Navigate Between Promoters
On detail page, use "Quick Promoter Search" to jump to another promoter without going back to the list

---

## Troubleshooting

### Issue: "No promoters found"
- Check your filters - click "Clear Filters" to reset
- Verify you have permission to view promoters
- Contact admin if problem persists

### Issue: "Permission Denied"
- Ask admin to grant `promoter:read` permission
- Admin should run: `scripts/grant-promoter-permissions.sql`

### Issue: Can't see document status
- Make sure you're in Table or Cards view
- Document status is shown in the "Documents" column/section

### Issue: Count seems wrong
- Count shows total in database (e.g., 112 total)
- Page shows subset (e.g., 20 per page)
- Example: "20 records on this page (of 112 total)"

---

## Migration Notes

### If You Were Using Old `/manage-promoters` Page:

The old simple list page now redirects to the Intelligence Hub automatically. You'll get:
- ✅ All the same data
- ✅ Plus advanced features (search, filters, sorting)
- ✅ Plus multiple view modes
- ✅ Plus better pagination

**Nothing to worry about - it just got better!**

---

## Need Help?

- Check the Intelligence Hub tooltips (hover over icons)
- All actions have confirmation dialogs
- Error messages explain what went wrong
- Admin can check browser console for details

---

## Summary

| What You Want to Do | Where to Go |
|---------------------|-------------|
| View all promoters | `/promoters` |
| View one promoter | `/manage-promoters/[id]` |
| Edit promoter | `/manage-promoters/[id]/edit` |
| Add promoter | `/manage-promoters/new` |

**Main Rule:** Start at `/promoters` (Intelligence Hub) for everything!

---

Last Updated: October 21, 2025

