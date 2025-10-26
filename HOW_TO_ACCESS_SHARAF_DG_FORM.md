# 🎯 How to Access Sharaf DG Form - Quick Guide

**Total Time:** 2 minutes

---

## ✅ The Form is Now in Your Sidebar!

I've updated **all 3 sidebar components** to include the Sharaf DG link:

- ✅ `components/sidebar.tsx`
- ✅ `components/simple-sidebar.tsx`
- ✅ `components/permission-aware-sidebar.tsx`

---

## 🚀 How to Access (3 Ways)

### Method 1: Via Sidebar (Easiest) ⭐

1. **Start your dev server:**
   ```bash
   npm run dev
   ```

2. **Open your app:**
   ```
   http://localhost:3000
   ```

3. **Login** (if not already logged in)

4. **Look at the sidebar** (left side of screen)

5. **Find "Contract Management" section:**
   ```
   📋 Contract Management
      ├─ eXtra Contracts
      ├─ General Contracts [NEW]
      ├─ Sharaf DG Deployment [PDF] ⭐ ← HERE!
      ├─ View Contracts
      └─ Pending Contracts
   ```

6. **Click "Sharaf DG Deployment"** → Form loads!

### Method 2: Direct URL

Just navigate to:
```
http://localhost:3000/en/contracts/sharaf-dg
```

Or with other locales:
```
http://localhost:3000/ar/contracts/sharaf-dg  (Arabic)
http://localhost:3000/contracts/sharaf-dg     (Default)
```

### Method 3: Via Contracts Menu

1. Click "View Contracts" in sidebar
2. Look for "Create" or "New" button
3. Select "Sharaf DG Deployment" from dropdown (if you add it)

---

## 🔍 Visual Guide

### What You Should See

#### Sidebar Menu:
```
┌─────────────────────────────────────┐
│  📊 Dashboard                       │
├─────────────────────────────────────┤
│  📋 Contract Management             │
│     ├ ⚡ eXtra Contracts            │
│     ├ 📝 General Contracts [NEW]   │
│     ├ 🏢 Sharaf DG Deployment [PDF]│ ← THIS!
│     ├ 📁 View Contracts             │
│     ├ ⏳ Pending Contracts          │
│     └ ✅ Approved Contracts         │
├─────────────────────────────────────┤
│  👥 Promoters                       │
│  🏢 Manage Parties                  │
│  📊 Analytics                       │
└─────────────────────────────────────┘
```

#### When You Click It:
```
┌─────────────────────────────────────────────────┐
│  🏢 Sharaf DG Deployment Letter Generator       │
│  Create deployment letters for promoters        │
│  assigned to Sharaf DG contracts. The system    │
│  will automatically generate a bilingual PDF.   │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  👤 Step 1: Select Promoter                     │
│  [Dropdown: Select promoter...]                 │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  🏢 Step 2: Select Parties                      │
│  [Dropdown: Employer...]                        │
│  [Dropdown: Client (Sharaf DG)...]              │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│  📄 Step 3: Contract Details                    │
│  [Contract Number, Dates, Job, Location...]     │
└─────────────────────────────────────────────────┘

             [Create Contract]
```

---

## ✅ Quick Verification (30 seconds)

Run these checks:

### Check 1: Files Exist
```bash
# In your project root
ls components/SharafDGDeploymentForm.tsx
ls app/[locale]/contracts/sharaf-dg/page.tsx

# Both should exist
```

### Check 2: Sidebar Updated
```bash
# Check sidebar has the entry
grep -i "sharaf" components/sidebar.tsx
grep -i "sharaf" components/simple-sidebar.tsx
grep -i "sharaf" components/permission-aware-sidebar.tsx

# All three should show matches
```

### Check 3: Server Running
```bash
# Should see:
# ✓ Ready in Xs
# ○ Compiling /...
# ✓ Compiled successfully
```

### Check 4: No TypeScript Errors
```bash
npm run build

# Should complete without errors
```

---

## 🎯 One-Minute Test

**Fastest way to verify everything works:**

```bash
# 1. Start server (if not running)
npm run dev

# 2. Open browser
open http://localhost:3000/en/contracts/sharaf-dg

# 3. Check page loads
# ✅ Form visible
# ✅ Dropdowns work
# ✅ No errors in console (F12)

# SUCCESS! ✅
```

---

## 🐛 Troubleshooting

### "Can't find the link in sidebar"

**Possible causes:**
1. **Wrong sidebar component in use**
   - Check `app/[locale]/layout.tsx` to see which sidebar is imported
   - I updated all 3, but you might be using a different one

2. **Cache issue**
   ```bash
   rm -rf .next
   npm run dev
   ```

3. **Permission restriction**
   - Check if your user has `contract:create` permission
   - Try with admin account

### "Page shows 404"

**Solutions:**
```bash
# 1. Restart dev server
npm run dev

# 2. Check file exists
ls app/[locale]/contracts/sharaf-dg/page.tsx

# 3. Check for TypeScript errors
npm run build
```

### "Sidebar shows but nothing happens when I click"

**Check:**
1. Browser console for errors (F12)
2. Network tab for failed requests
3. Next.js terminal for errors

---

## 📱 Mobile Access

On mobile devices:

1. **Click hamburger menu** (☰ top-left)
2. **Scroll to Contract Management**
3. **Tap "Sharaf DG Deployment"**
4. **Form should load**

---

## 🎨 What the Badge Looks Like

The sidebar entry shows:
```
🏢 Sharaf DG Deployment [PDF]
   └─ Badge color: Blue/Secondary
   └─ Indicates automated PDF generation
```

---

## ✅ Final Verification Checklist

Before marking as "complete":

- [ ] Can access via sidebar
- [ ] Can access via direct URL
- [ ] Form loads without errors
- [ ] All dropdowns populate
- [ ] Can create test contract
- [ ] Can generate test PDF
- [ ] Download works
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Works in different browsers

---

## 🎯 Quick Test Script

Run this in browser console on the page:

```javascript
// Test 1: Check component loaded
console.log('Form loaded:', !!document.querySelector('form'));

// Test 2: Check dropdowns exist
console.log('Promoter dropdown:', !!document.querySelector('[id="promoter"]'));
console.log('Employer dropdown:', !!document.querySelector('[id="employer"]'));
console.log('Client dropdown:', !!document.querySelector('[id="client"]'));

// Test 3: Check API routes
fetch('/api/contracts/test/generate-pdf')
  .then(r => console.log('API route exists:', r.status !== 404))
  .catch(e => console.log('API error:', e.message));

// If all return true, form is working! ✅
```

---

## 📞 Still Can't Find It?

### Option 1: Search in App

If your app has a search feature:
1. Press Ctrl+K or Cmd+K
2. Type "Sharaf"
3. Should show "Sharaf DG Deployment"

### Option 2: Check Which Sidebar Is Active

```bash
# Find which sidebar is imported in your layout
grep -A5 "import.*Sidebar" app/[locale]/layout.tsx
```

Share the output and I'll help you update the correct one!

### Option 3: Add to Different Sidebar

If you're using a custom sidebar I haven't updated, add this:

```typescript
{
  title: 'Sharaf DG Deployment',
  href: '/contracts/sharaf-dg',  // or '/en/contracts/sharaf-dg'
  icon: Building2,
  description: 'Deployment letters with PDF',
  badge: 'PDF',
}
```

---

## ✅ Summary

**Route:** `/contracts/sharaf-dg` or `/en/contracts/sharaf-dg`  
**Sidebar:** Updated in all 3 sidebar components  
**Location:** Under "Contract Management" section  
**Badge:** "PDF" (blue/secondary)  
**Icon:** Building2 (🏢)  

**Just start your dev server and look for it in the sidebar!** 🚀

---

**Need more help?** Run through `SHARAF_DG_TESTING_GUIDE.md` for complete testing!

