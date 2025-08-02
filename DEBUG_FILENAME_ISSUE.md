# 🚨 DEBUG GUIDE: Filename Issue Resolution

## Problem
You're seeing filenames like: `Unknown_Promoter_NO_ID_2023.jpg`

This indicates:
- ❌ **Unknown_Promoter** = promoterName is empty/not passed
- ❌ **NO_ID** = idCardNumber is empty/not passed  
- ❌ **2023** = Old timestamp system (shouldn't happen with new code)

## Debug Steps

### Step 1: Clear Browser Cache
The `2023` timestamp suggests old code might be cached.

```bash
# In Chrome/Edge:
1. Press Ctrl+Shift+Delete
2. Select "All time" 
3. Check "Cached images and files"
4. Click "Clear data"

# Or force refresh:
Ctrl+F5 or Ctrl+Shift+R
```

### Step 2: Test Filename Generation
Visit the test page to isolate the issue:

```
http://localhost:3000/test-filename
```

1. **Fill in test data**:
   - Promoter Name: `Ahmed Ali Hassan`
   - ID Card Number: `1234567890`
   - Passport Number: `P987654321`

2. **Open DevTools** (F12) → Console tab

3. **Try uploading** a test file

4. **Check console logs** - you should see:
   ```
   🔍 DocumentUpload Debug - Values for filename:
   - promoterName: Ahmed Ali Hassan
   - idCardNumber: 1234567890
   - passportNumber: P987654321
   - documentType: id_card
   ```

### Step 3: Check Main Form
If test page works but main form doesn't:

1. **Open promoter form** in your app
2. **Fill in promoter details FIRST**:
   - Full Name: `Ahmed Ali Hassan`
   - ID Number: `1234567890`
   - Passport Number: `P987654321` (optional)
3. **Then click "Upload Documents"**
4. **Check console logs** for the same debug info

### Step 4: Restart Dev Server
Sometimes code changes need a server restart:

```bash
# Stop the dev server (Ctrl+C)
# Then restart:
npm run dev
```

## Expected vs Actual

### ✅ Expected Filename:
```
Ahmed_Ali_Hassan_1234567890.jpg
```

### ❌ Current Issue:
```
Unknown_Promoter_NO_ID_2023.jpg
```

## Common Causes & Solutions

### Cause 1: Empty Form Fields
**Problem**: Uploading documents before filling promoter details
**Solution**: Fill in promoter name and ID number BEFORE uploading

### Cause 2: Browser Cache
**Problem**: Old JavaScript code cached in browser
**Solution**: Hard refresh (Ctrl+F5) or clear cache

### Cause 3: Form Data Not Passed
**Problem**: DocumentUpload component not receiving props
**Solution**: Check console logs for prop values

### Cause 4: Dev Server Cache
**Problem**: Next.js cached old version
**Solution**: Restart dev server

## Console Debug Output

When working correctly, you should see:
```javascript
🔍 DocumentUpload Debug - Values for filename:
- promoterName: Ahmed Ali Hassan
- idCardNumber: 1234567890
- passportNumber: P987654321
- documentType: id_card
- promoterId: new

🔍 Value types and checks:
- promoterName type: string isEmpty: false
- idCardNumber type: string isEmpty: false

🔍 Generated filename: Ahmed_Ali_Hassan_1234567890.jpg
🔍 File extension from: test.jpg extracted: jpg
```

## If Still Not Working

1. **Check Network Tab** in DevTools
2. **Look for API call** to `/api/upload`
3. **Check request payload** - should include:
   - promoterName: "Ahmed Ali Hassan"
   - idCardNumber: "1234567890"
   - documentType: "id_card"

## Quick Fix Test

Try this in browser console on the promoter form page:
```javascript
// Check if form data exists
console.log('Form data check:');
console.log('promoterName:', document.querySelector('input[id="full_name"]')?.value);
console.log('idNumber:', document.querySelector('input[id="id_number"]')?.value);
```

## Files Modified for Debugging
- ✅ `components/document-upload.tsx` - Added debug logs
- ✅ `app/api/upload/route.ts` - Has debug logs  
- ✅ `app/test-filename/page.tsx` - New test page

## Next Steps
1. Try the test page first: `http://localhost:3000/test-filename`
2. Clear browser cache if needed
3. Check console logs for debug info
4. Report what you see in the console logs
