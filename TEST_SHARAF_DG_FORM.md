# 🧪 Test Sharaf DG Form - Quick Guide

## ⚡ **Quick Test (Right Now):**

### **1. Open the Form**

Go to: https://portal.thesmartpro.io/en/contracts/sharaf-dg

### **2. Open Console**

Press **F12** → Click **Console** tab

### **3. Check What You See**

#### **✅ Good Signs:**

```
✅ Loaded X promoters, Y clients, Z employers
✅ Contract number auto-generated
Form shows all dropdowns
```

#### **❌ Bad Signs:**

```
❌ Failed to load data
❌ Supabase client not available
❌ Any red error messages
```

---

## 📝 **Fill Form in This Order:**

### **Step 1: Select Second Party (Employer) FIRST!**

```
Second Party (Employer) *
↓ Choose your company
↓ Toast: "Employer selected! Promoters filtered"
```

### **Step 2: Select Promoter**

```
Select Promoter *
↓ Dropdown now shows only YOUR company's promoters
↓ Choose one with images
```

### **Step 3: Select First Party (Client)**

```
First Party (Client) *
↓ Choose Sharaf DG
```

### **Step 4: Select Supplier/Brand**

```
Supplier/Brand Name *
↓ Choose brand (Samsung, LG, etc.)
```

### **Step 5: Fill Contract Details**

```
Contract Number: SDG-20250126-XXX (auto-filled)
Start Date: [select date]
End Date: [select date]
Job Title: Sales Promoter
Work Location: Sharaf DG Mall of Oman
```

### **Step 6: Click "Create Contract"**

Watch console for:

```
📝 Form submitted, validating...
✅ Validation passed, creating contract...
📤 Inserting contract: {...}
✅ Contract created successfully!
```

---

## 🐛 **If Button Doesn't Work:**

### **Check Console for Error Messages:**

#### **Error Type 1: Validation Failed**

```
❌ Validation failed
Missing Required Fields: Promoter, First Party (Client)
```

**Solution**: Fill in all missing fields

#### **Error Type 2: Database Error**

```
❌ Database error: {...}
code: "PGRST204"
```

**Solution**: Wait for deployment (fixes are being deployed)

#### **Error Type 3: Supabase Error**

```
❌ Supabase client not available
```

**Solution**: Check your internet connection and Supabase status

#### **Error Type 4: Silent Failure**

```
(No console messages at all)
```

**Solution**:

1. Hard refresh: `Ctrl + Shift + R`
2. Clear cache
3. Try incognito mode

---

## 🔍 **Manual Debug in Console:**

### **Test 1: Check Form State**

```javascript
// Copy and paste in console:
console.log('Form data:', localStorage.getItem('sharaf-dg-form-draft'));
```

### **Test 2: Check if Button is Clickable**

```javascript
// In console:
const btn = document.querySelector('button[type="submit"]');
console.log('Button:', btn);
console.log('Disabled:', btn?.disabled);
console.log('Loading:', btn?.textContent);
```

### **Test 3: Manually Trigger Validation**

```javascript
// In console - this will show what's missing:
const form = document.querySelector('form');
if (form) {
  form.reportValidity();
}
```

---

## ✅ **Required Field Checklist:**

Use this to verify all fields are filled:

```
Promoter Information:
[ ] Second Party (Employer) selected
[ ] Promoter selected (with ID card image)
[ ] Promoter has passport image

Party Information:
[ ] First Party (Client) selected
[ ] Supplier/Brand selected

Contract Details:
[ ] Contract Number filled
[ ] Start Date selected
[ ] End Date selected
[ ] Job Title entered
[ ] Work Location entered

Party Data Complete:
[ ] Client has Arabic name
[ ] Client has CRN
[ ] Employer has Arabic name
[ ] Employer has CRN
[ ] Supplier has Arabic name
```

---

## 🚀 **Expected Behavior:**

### **When Everything Works:**

1. **Fill form** → All fields valid
2. **Click button** → Shows "Creating Contract..."
3. **Wait 1-2 seconds** → Processing
4. **Success!** → Green alert appears
5. **PDF Section** → Shows "Generate PDF" button

### **Visual Flow:**

```
[Create Contract] button clicked
        ↓
⏳ "Creating Contract..."
        ↓
✅ "Contract Created Successfully"
        ↓
📄 PDF Generation section appears
        ↓
[Generate Deployment Letter PDF] button
```

---

## 🔧 **Quick Fixes to Try:**

### **Fix 1: Hard Refresh**

```bash
Ctrl + Shift + R (Windows)
Cmd + Shift + R (Mac)
```

### **Fix 2: Clear Form and Retry**

```
Click "Clear Form" button
Reload page
Fill form again
```

### **Fix 3: Incognito Mode**

```
Ctrl + Shift + N (Windows)
Cmd + Shift + N (Mac)
Login and try form
```

### **Fix 4: Check Promoter Images**

```sql
-- Run in Supabase SQL Editor:
SELECT
  name_en,
  id_card_url,
  passport_url,
  employer_id
FROM promoters
WHERE status_enum IN ('available', 'active')
ORDER BY name_en;

-- Verify:
-- ✅ id_card_url is NOT NULL
-- ✅ passport_url is NOT NULL
-- ✅ employer_id matches your company ID
```

---

## 📊 **What Console Should Show (Success):**

```
📝 Form submitted, validating...
{
  promoter_id: "uuid-here",
  first_party_id: "client-uuid",
  second_party_id: "employer-uuid",
  supplier_brand_id: "brand-uuid",
  contract_number: "SDG-20250126-547",
  job_title: "Sales Promoter",
  work_location: "Sharaf DG Mall",
  // ... all fields
}

✅ Validation passed, creating contract...

📤 Inserting contract:
{
  contract_number: "SDG-20250126-547",
  title: "Sharaf DG Deployment - Ahmed Al-Balushi",
  contract_type: "employment",
  employer_id: "employer-uuid",
  client_id: "client-uuid",
  promoter_id: "promoter-uuid",
  terms: "{...json...}"
}

✅ Contract created successfully:
{
  id: "new-uuid",
  contract_number: "SDG-20250126-547",
  status: "draft"
}

🎉 Contract Created Successfully
Contract SDG-20250126-547 has been saved. Now generate the PDF.
```

---

## 🆘 **Still Not Working?**

### **Share These Details:**

1. **Screenshot of console** (with errors in red)
2. **Network tab** → POST request details
3. **Form data** → Which fields are filled
4. **Promoter details** → Does it have images?

**I'll help debug further with this information!**

---

## ⏰ **Wait for Deployment**

Current fixes are deploying to production:

- ✅ Database compatibility
- ✅ Enhanced error logging
- ✅ Better validation messages
- ✅ Detailed console output

**After deployment (~2-3 min from last push):**

1. Hard refresh
2. Try creating contract
3. Console will show detailed logs
4. You'll see exactly what's failing!

---

**The enhanced logging is now live - you'll see exactly what's happening when you click the button!** 🔍
