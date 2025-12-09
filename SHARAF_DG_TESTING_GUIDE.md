# ✅ Sharaf DG Form - Complete Testing Guide

**Purpose:** Verify that the Sharaf DG deployment form is fully integrated and working  
**Time:** 15-20 minutes

---

## 🎯 Testing Overview

We'll test:

1. ✅ Route accessibility
2. ✅ Sidebar navigation
3. ✅ Form loading
4. ✅ Data fetching
5. ✅ Validation
6. ✅ Contract creation
7. ✅ PDF generation
8. ✅ Download links

---

## 📋 Pre-Test Checklist

Before testing, ensure:

- [ ] **Database migration applied**

  ```bash
  supabase db push
  # Check for: 20251026_add_contract_pdf_fields.sql
  ```

- [ ] **Environment variables set** (in `.env.local`)

  ```bash
  MAKE_CONTRACT_PDF_WEBHOOK_URL=https://hook.eu2.make.com/...
  PDF_WEBHOOK_SECRET=your-secret-here
  CONTRACTS_API_URL=https://your-domain.com
  NEXT_PUBLIC_CONTRACTS_STORAGE_BUCKET=contracts
  ```

- [ ] **Development server running**

  ```bash
  npm run dev
  # Should be on http://localhost:3000
  ```

- [ ] **Logged in as admin or user with contract:create permission**

---

## 🧪 Test 1: Route Accessibility (2 min)

### Steps:

1. **Direct URL access:**

   ```
   Navigate to: http://localhost:3000/en/contracts/sharaf-dg
   ```

2. **Expected result:**
   - ✅ Page loads without errors
   - ✅ Form displays with three main sections
   - ✅ No 404 error
   - ✅ No console errors

3. **Alternative locales:**
   ```
   http://localhost:3000/ar/contracts/sharaf-dg  (Arabic)
   http://localhost:3000/contracts/sharaf-dg     (default)
   ```

### ❌ If page doesn't load:

**Check:**

- File exists: `app/[locale]/contracts/sharaf-dg/page.tsx`
- File exists: `components/SharafDGDeploymentForm.tsx`
- No TypeScript errors: `npm run build`
- Clear Next.js cache: `rm -rf .next && npm run dev`

---

## 🧪 Test 2: Sidebar Navigation (3 min)

### Steps:

1. **Open sidebar** (if collapsed, click hamburger menu)

2. **Look for "Sharaf DG Deployment" link** under "Contract Management" section

3. **Expected appearance:**

   ```
   📋 Contract Management
      ├─ eXtra Contracts
      ├─ General Contracts [NEW]
      ├─ Sharaf DG Deployment [PDF] ⭐ (This should appear!)
      ├─ View Contracts
      └─ ...
   ```

4. **Click the link**
   - Should navigate to `/contracts/sharaf-dg`
   - Active link should be highlighted
   - Page should load

### ❌ If link doesn't appear:

**Check which sidebar you're using:**

```bash
# Search for which sidebar is imported in your layout
grep -r "from.*sidebar" app/[locale]/layout.tsx
```

**Sidebars updated:**

- ✅ `components/sidebar.tsx`
- ✅ `components/simple-sidebar.tsx`
- ✅ `components/permission-aware-sidebar.tsx`

**If using different sidebar:** Add this entry:

```typescript
{
  title: 'Sharaf DG Deployment',
  href: '/contracts/sharaf-dg',
  icon: Building2,
  description: 'Deployment letters with PDF',
  badge: 'PDF',
}
```

---

## 🧪 Test 3: Form Loading & Data (5 min)

### Steps:

1. **Check dropdowns populate:**

   **Promoters dropdown:**
   - [ ] Opens when clicked
   - [ ] Shows list of promoters
   - [ ] Shows name in English and Arabic
   - [ ] Shows status badges
   - [ ] Searchable/filterable

   **Employer dropdown:**
   - [ ] Shows employer parties
   - [ ] Displays bilingual names

   **Client dropdown:**
   - [ ] Shows client parties
   - [ ] Includes Sharaf DG
   - [ ] "Sharaf DG" badge appears if name contains "sharaf"

2. **Select a promoter:**
   - [ ] Preview card appears below dropdown
   - [ ] Shows English and Arabic names
   - [ ] Shows ID card number
   - [ ] Shows passport number
   - [ ] Shows image status badges:
     - ✅ "ID Card ✓" if image exists
     - ✅ "Passport ✓" if image exists
     - ❌ "ID Card Missing" if no image
     - ❌ "Passport Missing" if no image

3. **Select parties:**
   - [ ] Side-by-side preview cards appear
   - [ ] Shows company names (EN/AR)
   - [ ] Shows CRN numbers

### ❌ If dropdowns are empty:

**Check database has data:**

```sql
-- Check promoters
SELECT COUNT(*) FROM promoters WHERE status_enum IN ('available', 'active');

-- Check parties
SELECT COUNT(*) FROM parties WHERE status = 'Active' AND type = 'Employer';
SELECT COUNT(*) FROM parties WHERE status = 'Active' AND type = 'Client';
```

**If no data:**

```sql
-- Create test data
INSERT INTO parties (name_en, name_ar, type, crn, status)
VALUES
  ('Falcon Eye Group', 'مجموعة عين الصقر', 'Employer', '1234567890', 'Active'),
  ('Sharaf DG', 'شرف دي جي', 'Client', '9876543210', 'Active');
```

---

## 🧪 Test 4: Form Validation (3 min)

### Steps:

1. **Try submitting empty form:**
   - Click "Create Contract" without filling fields
   - [ ] Should show validation errors
   - [ ] Toast notification appears
   - [ ] Lists all missing fields

2. **Fill required fields only:**
   - Select promoter (one WITHOUT images)
   - Select employer
   - Select client
   - Enter contract number: `TEST-SDG-001`
   - Enter dates
   - Enter job title: `Sales Promoter`
   - Enter work location: `Mall of Oman`
   - Click "Create Contract"

3. **Expected validation error:**
   - [ ] Should warn about missing promoter images
   - [ ] Should list: "Promoter ID Card Image, Promoter Passport Image"

4. **Select promoter WITH images:**
   - Change to promoter that has both images
   - Submit again
   - [ ] Should succeed if all other fields valid

### ❌ If validation doesn't work:

**Check console for errors:**

- Open browser DevTools (F12)
- Look for JavaScript errors
- Check Network tab for API errors

---

## 🧪 Test 5: Contract Creation (3 min)

### Steps:

1. **Fill complete valid form:**

   ```
   Promoter: [Select one with ID card & passport images]
   Employer: Falcon Eye Group
   Client: Sharaf DG
   Contract Number: TEST-SDG-2025-001
   Start Date: [Today's date]
   End Date: [30 days from today]
   Job Title: Sales Promoter
   Department: Electronics
   Work Location: Sharaf DG Mall of Oman
   Basic Salary: 350 (optional)
   ```

2. **Click "Create Contract":**
   - [ ] Button shows loading spinner
   - [ ] Toast shows "Contract Created"
   - [ ] Success message appears
   - [ ] Page scrolls to PDF section
   - [ ] "Generate PDF" button appears

3. **Verify in database:**
   ```sql
   SELECT
     id,
     contract_number,
     pdf_status,
     created_at
   FROM contracts
   WHERE contract_number = 'TEST-SDG-2025-001'
   ORDER BY created_at DESC
   LIMIT 1;
   ```

   - [ ] Record exists
   - [ ] `pdf_status` = 'pending' or NULL

### ❌ If contract doesn't create:

**Check API logs:**

```bash
# In browser DevTools → Network tab
# Look for POST to /api/contracts/...
# Check Response for error details
```

**Common issues:**

- Missing required fields in database
- Foreign key violations (promoter/party IDs invalid)
- Permissions issue (user can't create contracts)

---

## 🧪 Test 6: PDF Generation (5 min)

### Steps:

1. **Click "Generate Deployment Letter PDF":**
   - [ ] Button changes to "Generating..." with spinner
   - [ ] Status section appears
   - [ ] Shows progress checklist:
     - Fetching template
     - Filling information
     - Embedding images
     - Generating PDF
     - Uploading to storage

2. **Wait 30-40 seconds:**
   - [ ] Status updates automatically (polling every 3 seconds)
   - [ ] Green success alert appears
   - [ ] "PDF Ready!" message shows

3. **Expected result:**
   - [ ] "Download PDF" button appears
   - [ ] "Open in Google Drive" button appears (if configured)
   - [ ] "Regenerate" button appears

4. **Verify in database:**
   ```sql
   SELECT
     contract_number,
     pdf_status,
     pdf_url,
     google_drive_url,
     pdf_generated_at
   FROM contracts
   WHERE contract_number = 'TEST-SDG-2025-001';
   ```

   - [ ] `pdf_status` = 'generated'
   - [ ] `pdf_url` has value
   - [ ] `pdf_generated_at` is set

### ❌ If PDF generation fails:

**Check Make.com execution:**

1. Go to Make.com dashboard
2. Click "History"
3. Find your scenario execution
4. Check each module for errors

**Check webhook logs:**

```sql
SELECT * FROM webhook_logs
WHERE contract_id = (
  SELECT id FROM contracts
  WHERE contract_number = 'TEST-SDG-2025-001'
)
ORDER BY received_at DESC;
```

**Common issues:**

- Make.com webhook URL wrong
- Template ID incorrect
- Images not accessible (check URLs are public)
- Webhook secret mismatch

---

## 🧪 Test 7: PDF Download & Quality (3 min)

### Steps:

1. **Click "Download PDF":**
   - [ ] PDF opens in new tab
   - [ ] File downloads to computer

2. **Check PDF content:**
   - [ ] All text fields filled correctly
   - [ ] Both parties' logos visible (if provided)
   - [ ] Arabic text displays right-to-left
   - [ ] English text displays left-to-right
   - [ ] Promoter name (Arabic) correct
   - [ ] ID card image embedded correctly
   - [ ] Passport image embedded correctly
   - [ ] Dates formatted as DD-MM-YYYY
   - [ ] Contract number appears
   - [ ] CRN numbers visible
   - [ ] No {{placeholder}} text remaining

3. **Click "Open in Google Drive":**
   - [ ] Opens Google Doc in new tab
   - [ ] Document is editable
   - [ ] All content matches PDF

### ❌ If PDF has issues:

**Missing placeholders:**

- Template has typo in placeholder name
- Make.com mapping incorrect
- Data not sent in webhook payload

**Images not showing:**

- URLs not publicly accessible
- Alt text in template incorrect (must be exactly `ID_CARD_IMAGE` and `PASSPORT_IMAGE`)
- Image format not supported

**Arabic not RTL:**

- Template formatting issue
- Need to set text direction in Google Doc

---

## 🧪 Test 8: Regeneration (2 min)

### Steps:

1. **Click "Regenerate" button**
   - [ ] Confirmation dialog appears
   - [ ] Shows warning message

2. **Click "Yes, Regenerate":**
   - [ ] Status changes to "Generating..."
   - [ ] New PDF generated (overwrites old one)
   - [ ] Download link updates

3. **Verify overwrite:**
   ```sql
   SELECT
     pdf_url,
     pdf_generated_at,
     pdf_status
   FROM contracts
   WHERE contract_number = 'TEST-SDG-2025-001';
   ```

   - [ ] `pdf_generated_at` is newer timestamp
   - [ ] `pdf_url` might be same or different

---

## 🧪 Test 9: Error Handling (3 min)

### Test Scenario 1: Missing Promoter Images

1. Select promoter WITHOUT images
2. Try to create contract
3. [ ] Should show error about missing images

### Test Scenario 2: Invalid Date Range

1. Set end date BEFORE start date
2. Try to create contract
3. [ ] Should validate and reject

### Test Scenario 3: Webhook Failure

1. Temporarily set wrong webhook URL in `.env.local`
2. Try to generate PDF
3. [ ] Should show error after timeout
4. [ ] "Retry" button appears
5. Fix webhook URL and retry
6. [ ] Should succeed

---

## ✅ Complete Test Results Template

Copy this and fill it out as you test:

```
═══════════════════════════════════════════════════
SHARAF DG DEPLOYMENT FORM - TEST RESULTS
Date: _______________
Tester: _______________
Environment: □ Local  □ Staging  □ Production
═══════════════════════════════════════════════════

TEST 1: ROUTE ACCESSIBILITY
□ Direct URL works (/en/contracts/sharaf-dg)
□ No 404 errors
□ Page loads completely
Notes: _______________________________________

TEST 2: SIDEBAR NAVIGATION
□ "Sharaf DG Deployment" appears in sidebar
□ Located in Contract Management section
□ Badge shows "PDF"
□ Click navigates correctly
□ Active state highlights properly
Notes: _______________________________________

TEST 3: FORM LOADING
□ Promoters dropdown populates (_____ items)
□ Employers dropdown populates (_____ items)
□ Clients dropdown populates (_____ items)
□ All UI elements render correctly
□ No console errors
Notes: _______________________________________

TEST 4: DATA SELECTION
□ Promoter selection works
□ Preview card shows promoter details
□ Image badges show correctly
□ Employer selection works
□ Client selection works
□ Party preview cards display
Notes: _______________________________________

TEST 5: VALIDATION
□ Empty form shows errors
□ Missing images detected
□ Invalid dates rejected
□ All required fields checked
□ Error messages clear and helpful
Notes: _______________________________________

TEST 6: CONTRACT CREATION
□ Form submits successfully
□ Loading state shows
□ Success toast appears
□ Contract saved to database
□ Contract ID: _________________________
Notes: _______________________________________

TEST 7: PDF GENERATION
□ "Generate PDF" button appears
□ Click triggers generation
□ Status updates in real-time
□ Polling works (updates every 3s)
□ PDF ready notification shows
□ Generation time: _____ seconds
Notes: _______________________________________

TEST 8: PDF QUALITY
□ PDF downloads successfully
□ All text fields filled
□ Images embedded correctly
  □ ID card visible
  □ Passport visible
□ Arabic text is RTL
□ Dates formatted as DD-MM-YYYY
□ No {{placeholders}} remaining
□ Professional appearance
Notes: _______________________________________

TEST 9: LINKS & ACTIONS
□ Download PDF link works
□ Google Drive link works (if configured)
□ Regenerate shows confirmation
□ Regenerate creates new PDF
Notes: _______________________________________

TEST 10: ERROR HANDLING
□ Missing images prevented
□ Invalid data rejected
□ Webhook errors handled gracefully
□ Retry mechanism works
□ Error messages helpful
Notes: _______________________________________

═══════════════════════════════════════════════════
OVERALL RESULT: □ PASS  □ FAIL  □ NEEDS FIXES
═══════════════════════════════════════════════════

Issues Found:
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

Recommendations:
1. _____________________________________________
2. _____________________________________________
3. _____________________________________________

Tester Signature: _______________  Date: ________
═══════════════════════════════════════════════════
```

---

## 🔍 Quick Verification SQL Queries

### Check Contract Was Created

```sql
SELECT
  id,
  contract_number,
  contract_type,
  promoter_id,
  first_party_id,
  second_party_id,
  pdf_status,
  created_at
FROM contracts
WHERE contract_type = 'sharaf-dg-deployment'
ORDER BY created_at DESC
LIMIT 5;
```

### Check PDF Generation Status

```sql
SELECT
  contract_number,
  pdf_status,
  pdf_generated_at,
  pdf_url,
  pdf_error_message
FROM contracts
WHERE pdf_status IS NOT NULL
ORDER BY pdf_generated_at DESC
LIMIT 5;
```

### Check Webhook Logs

```sql
SELECT
  event_type,
  status,
  make_request_id,
  received_at,
  payload->>'contract_number' as contract_number
FROM webhook_logs
WHERE event_type = 'contract_pdf_ready'
ORDER BY received_at DESC
LIMIT 5;
```

---

## 🎯 Success Criteria

All checkboxes should be ✅:

### Must Have:

- [x] Route accessible
- [x] Appears in sidebar
- [x] Form loads
- [x] Dropdowns populate
- [x] Validation works
- [x] Contract creates
- [x] PDF generates
- [x] Download works

### Should Have:

- [ ] Google Drive link works
- [ ] Regeneration works
- [ ] Error handling graceful
- [ ] Mobile responsive
- [ ] Fast loading (<2s)

### Nice to Have:

- [ ] Tooltips helpful
- [ ] Animations smooth
- [ ] Keyboard navigation
- [ ] Accessibility compliant

---

## 🚨 Common Issues & Solutions

### Issue 1: "Page Not Found"

**Solution:**

```bash
# Restart dev server
npm run dev

# Or clear cache
rm -rf .next
npm run dev
```

### Issue 2: Dropdowns Empty

**Solution:**

```sql
-- Check data exists
SELECT COUNT(*) FROM promoters WHERE status_enum IN ('available', 'active');
SELECT COUNT(*) FROM parties WHERE status = 'Active';

-- If zero, add test data
-- (See Test 3 section above)
```

### Issue 3: PDF Generation Timeout

**Solution:**

1. Check Make.com is running
2. Verify webhook URL is correct
3. Check Make.com execution logs
4. Ensure template ID is correct

### Issue 4: Images Not Embedding

**Solution:**

1. Check image URLs are publicly accessible:
   ```bash
   curl -I https://your-storage-url/image.jpg
   # Should return 200 OK
   ```
2. Verify template has correct alt text: `ID_CARD_IMAGE` and `PASSPORT_IMAGE`
3. Check images are not too large (< 5MB)

---

## 📊 Performance Benchmarks

| Metric         | Target  | Acceptable | Poor  |
| -------------- | ------- | ---------- | ----- |
| Page Load      | < 1s    | < 2s       | > 3s  |
| Form Submit    | < 500ms | < 1s       | > 2s  |
| PDF Generation | < 35s   | < 50s      | > 60s |
| Download Speed | Instant | < 2s       | > 5s  |

---

## 🎓 Testing Tips

### Use Browser DevTools

```bash
1. Press F12 to open DevTools
2. Go to Network tab
3. Filter: XHR
4. Watch API calls in real-time
5. Check Console for errors
```

### Test in Multiple Browsers

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari (if on Mac)

### Test Responsive Design

- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

---

## ✅ Post-Test Checklist

After successful testing:

- [ ] Document any issues found
- [ ] Fix critical bugs
- [ ] Train users on how to use form
- [ ] Create user documentation
- [ ] Set up monitoring/alerts
- [ ] Schedule regular tests

---

## 📞 Need Help?

### Quick Diagnostics

```bash
# Check if page file exists
ls -la app/[locale]/contracts/sharaf-dg/

# Check if component exists
ls -la components/SharafDGDeploymentForm.tsx

# Check environment variables
cat .env.local | grep -i "make\|pdf\|webhook"

# Check database migration
psql $DATABASE_URL -c "SELECT column_name FROM information_schema.columns WHERE table_name = 'contracts' AND column_name LIKE 'pdf%';"
```

### Where to Look for Errors

1. **Browser Console** - JavaScript/React errors
2. **Network Tab** - API call failures
3. **Terminal** - Next.js server errors
4. **Make.com** - Workflow execution logs
5. **Supabase Dashboard** - Database errors, logs

---

## 🎯 Expected Flow (Happy Path)

```
1. User navigates via sidebar → /contracts/sharaf-dg
                ↓
2. Form loads, dropdowns populate with data
                ↓
3. User selects promoter (with images)
                ↓
4. Preview shows promoter details + image badges
                ↓
5. User selects Falcon Eye Group (employer)
                ↓
6. User selects Sharaf DG (client)
                ↓
7. Party preview cards show both companies
                ↓
8. User fills contract details (number, dates, job, location)
                ↓
9. User clicks "Create Contract"
                ↓
10. Success! PDF generation section appears
                ↓
11. User clicks "Generate Deployment Letter PDF"
                ↓
12. Status: Generating... (30-40 seconds)
                ↓
13. Status: PDF Ready!
                ↓
14. User clicks "Download PDF"
                ↓
15. PDF opens → User verifies content → Success! ✅
```

---

**Start testing now!** Follow the steps above and check off each item. 🚀

**If you encounter any issues, share the test results template and I'll help debug!**
