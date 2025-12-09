# 📸 Sharaf DG Form - Visual Guide & How to Use

**Status:** ✅ Ready to Use  
**Updated:** Matches eXtra Contracts style

---

## 🎯 What's New

I've updated the Sharaf DG form to **match your eXtra Contracts form** with these improvements:

✅ **Same layout and styling as eXtra form**  
✅ **Supplier/Brand field added** (selects from parties, shows EN/AR names only)  
✅ **Auto-save draft feature** (like eXtra)  
✅ **Search promoters** (like eXtra)  
✅ **All employment terms** (probation, notice, working hours, allowances)  
✅ **Clear form button**  
✅ **Better validation and preview**

---

## 📋 Form Structure (Same as eXtra)

```
┌────────────────────────────────────────────────────────────┐
│ 🏢 Sharaf DG Deployment Contracts                          │
│ Generate professional bilingual deployment letters...      │
│                                   Draft saved: 14:30:25    │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 👤 Promoter Information                                    │
│ ├─ Search Promoter: [____________]                         │
│ └─ Select Promoter: [Dropdown] * (150 promoters available)│
│                                                            │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ✅ Selected Promoter Details                         │   │
│ │ Name (EN): Ahmad Mohammed     الاسم: أحمد محمد      │   │
│ │ ID Card: 123456789                                   │   │
│ │ Passport: A12345678                                  │   │
│ │ Email: ahmad@example.com                             │   │
│ │ Mobile: +968 91234567                                │   │
│ │ ✅ ID Card Image ✓    ✅ Passport Image ✓            │   │
│ └──────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 🏢 Party Information                                       │
│                                                            │
│ First Party (Employer): [Falcon Eye Group ▼] *            │
│ Second Party (Client):  [Sharaf DG ▼] *                   │
│ Supplier/Brand Name:    [Falcon Eye Group ▼] *   ⭐ NEW!  │
│   └─ Can be same as employer or different                 │
│                                                            │
│ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐        │
│ │ 🏢 Employer  │ │ 🏢 Client    │ │ 📦 Supplier  │ ⭐ NEW! │
│ │ Falcon Eye   │ │ Sharaf DG    │ │ Falcon Eye   │        │
│ │ مجموعة عين   │ │ شرف دي جي    │ │ مجموعة عين   │        │
│ │ CRN:1234567  │ │ CRN:9876543  │ │ العقد للإلحاق │        │
│ └──────────────┘ └──────────────┘ └──────────────┘        │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 📄 Contract Details                                        │
│                                                            │
│ Contract Number: [SDG-2025-001_____] *                     │
│ Contract Type:   [Sharaf DG Deployment Letter ▼] *        │
│ Contract Title:  [Optional descriptive name_________]      │
│                                                            │
│ Start Date: [2025-11-01] *    End Date: [2025-12-31] *    │
│                                                            │
│ Job Title: [Sales Promoter________] *                     │
│ Department: [Electronics___________]                       │
│                                                            │
│ Work Location: [Sharaf DG Mall of Oman__________] *       │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 💰 Compensation Details                                    │
│                                                            │
│ Basic Salary:       [350.00] OMR                          │
│ Housing Allowance:  [100.00] OMR                          │
│ Transport Allowance: [50.00] OMR                          │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 📋 Employment Terms                                        │
│                                                            │
│ Probation Period: [3 Months ▼]                            │
│ Notice Period:    [30 Days ▼]                             │
│ Working Hours:    [40 Hours/Week ▼]                       │
└────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ 📝 Special Terms & Conditions                              │
│ [Text area for additional terms...]                       │
└────────────────────────────────────────────────────────────┘

        [✅ Create Contract]  [🔄 Clear Form]
```

---

## 🆕 Key Features Explained

### 1. **Supplier/Brand Field** ⭐ NEW

**What it is:**

- Third party selection (in addition to Employer and Client)
- Pulls from same parties database
- Shows **only English and Arabic names** (not CRN, logos, etc.)

**Why it's needed:**

- Some contracts need to specify the brand/supplier separately
- Example: Falcon Eye (Employer) supplies staff to Sharaf DG (Client) under brand "Falcon Eye Services"
- Can be same as employer or different

**How to use:**

1. Select employer (e.g., "Falcon Eye Group")
2. Select client (e.g., "Sharaf DG")
3. Select supplier/brand (e.g., "Falcon Eye Group" or "Falcon Eye Services")
   - If same as employer, select the same party
   - If different brand, select different party

**In template:**

```
Supplier/Brand: {{supplier_brand_name_en}}
المورد/العلامة التجارية: {{supplier_brand_name_ar}}
```

### 2. **Three Party Previews**

After selection, you'll see 3 preview cards:

- 🏢 **Employer** (First Party)
- 🏢 **Client** (Second Party)
- 📦 **Supplier** (Brand/Service Provider) ⭐ NEW

### 3. **All Employment Fields** (Like eXtra)

Now includes everything from eXtra form:

- Probation period (0, 1, 3, 6 months)
- Notice period (0, 30, 60, 90 days)
- Working hours (20, 30, 40 hours, flexible)
- Basic salary
- Housing allowance
- Transport allowance

---

## 📊 Field Mapping for Template

When PDF is generated, these are sent to Make.com:

### Party Data (3 Parties)

```javascript
{
  // First Party (Employer)
  first_party_name_en: "Falcon Eye Group",
  first_party_name_ar: "مجموعة عين الصقر",
  first_party_crn: "1234567890",
  first_party_logo: "https://...",

  // Second Party (Client)
  second_party_name_en: "Sharaf DG",
  second_party_name_ar: "شرف دي جي",
  second_party_crn: "9876543210",
  second_party_logo: "https://...",

  // Supplier/Brand (NEW - Names Only)
  supplier_brand_name_en: "Falcon Eye Group",
  supplier_brand_name_ar: "مجموعة عين الصقر"
}
```

### Complete Payload

All fields sent to Make.com webhook:

- ✅ All promoter data (name, ID, passport, images)
- ✅ All 3 party selections (employer, client, supplier)
- ✅ Contract details (number, dates, job, location)
- ✅ Compensation (salary + allowances)
- ✅ Employment terms (probation, notice, hours)
- ✅ Special terms

---

## 🎯 How to Use (Step-by-Step)

### Step 1: Access Form

**Via Sidebar:**

```
Dashboard → Contracts → Sharaf DG Deployment [PDF]
```

**Or direct URL:**

```
http://localhost:3000/en/contracts/sharaf-dg
```

### Step 2: Search & Select Promoter

1. **Type in search box:** Name or ID card number
2. **Select from dropdown**
3. **Check preview card:**
   - ✅ Green badges = Has images (good!)
   - ❌ Red badges = Missing images (can't proceed)

### Step 3: Select Parties (All 3)

1. **First Party (Employer):** Select "Falcon Eye Group"
2. **Second Party (Client):** Select "Sharaf DG"
3. **Supplier/Brand:** Select "Falcon Eye Group" (or different brand)
   - 💡 Can be same as employer if it's the same company
   - 💡 Choose different if brand is separate entity

### Step 4: Fill Contract Details

1. **Contract Number:** `SDG-2025-001` (format: SDG-YYYY-XXX)
2. **Contract Type:** Select from dropdown
3. **Title:** Optional descriptive name
4. **Dates:** Start and end dates
5. **Job:** Title and department
6. **Location:** Where promoter will work

### Step 5: Add Compensation (Optional but Recommended)

1. **Basic Salary:** E.g., `350` OMR
2. **Housing:** E.g., `100` OMR
3. **Transport:** E.g., `50` OMR

### Step 6: Set Employment Terms

1. **Probation:** Usually 3 months
2. **Notice:** Usually 30 days
3. **Hours:** Usually 40 hours/week

### Step 7: Submit

1. **Click "Create Contract"**
2. **Wait for success message**
3. **PDF section appears**

### Step 8: Generate PDF

1. **Click "Generate Deployment Letter PDF"**
2. **Wait ~30-40 seconds** (watch progress)
3. **Download PDF** when ready
4. **Open in Drive** to edit if needed

---

## ✅ Example Data Entry

Here's a complete example to test:

```
=== PROMOTER ===
Search: Ahmad
Select: Ahmad Mohammed Ali
✅ Check: Has ID card image
✅ Check: Has passport image

=== PARTIES ===
Employer: Falcon Eye Group
Client: Sharaf DG LLC
Supplier/Brand: Falcon Eye Group ⭐ (same as employer)

=== CONTRACT ===
Number: SDG-2025-TEST-001
Type: Sharaf DG Deployment Letter
Title: Sales Promoter - Mall of Oman
Start Date: 2025-11-01
End Date: 2025-12-31

=== EMPLOYMENT ===
Job Title: Sales Promoter
Department: Electronics
Location: Sharaf DG Mall of Oman, Muscat

=== COMPENSATION ===
Basic Salary: 350 OMR
Housing: 100 OMR
Transport: 50 OMR

=== TERMS ===
Probation: 3 Months
Notice: 30 Days
Hours: 40 Hours/Week

=== SPECIAL TERMS ===
(Optional) Employee will be assigned to Electronics department
with focus on premium product brands.

[✅ Create Contract]
```

---

## 🔍 What Shows in PDF

Your generated PDF will include:

### Header:

```
[Falcon Eye Logo]              [Sharaf DG Logo]

        EMPLOYEE DEPLOYMENT LETTER
             خطاب إلحاق موظف
```

### Body (Bilingual):

```
التاريخ: 01-11-2025
رقم المرجع: SDG-2025-TEST-001

السادة/ شرف دي جي
المحترمين،

الموضوع: خطاب إلحاق موظف

نشير إلى العقد المبرم بين شركتنا مجموعة عين الصقر
(سجل تجاري: 1234567890)
وشركتكم الموقرة شرف دي جي
(سجل تجاري: 9876543210)

يسرنا إلحاق الموظف التالي:

الاسم: أحمد محمد علي / Ahmad Mohammed Ali
رقم الهوية: 123456789
رقم الجواز: A12345678

[ID Card Image Embedded Here]
[Passport Image Embedded Here]

المورد: مجموعة عين الصقر ⭐ NEW!
Supplier/Brand: Falcon Eye Group
```

---

## 🎨 Differences from Old Version

| Feature              | Old Version     | New Version                          |
| -------------------- | --------------- | ------------------------------------ |
| **Supplier/Brand**   | ❌ Not included | ✅ Added (3rd party)                 |
| **Employment Terms** | ❌ Only basic   | ✅ Full (probation, notice, hours)   |
| **Allowances**       | ❌ Only salary  | ✅ Housing + Transport               |
| **Auto-save**        | ❌ No           | ✅ Yes (every 2 seconds)             |
| **Search**           | ❌ No           | ✅ Yes (promoters)                   |
| **Preview Cards**    | 2 cards         | 3 cards (employer, client, supplier) |
| **Matching eXtra**   | ❌ Different    | ✅ Same style                        |

---

## 🎯 Understanding Supplier/Brand

### Common Scenarios:

#### Scenario 1: Same as Employer (Most Common)

```
Employer: Falcon Eye Group
Client: Sharaf DG
Supplier: Falcon Eye Group ← Same company

Use when: The employer is also the supplier
```

#### Scenario 2: Different Brand

```
Employer: Falcon Eye Group
Client: Sharaf DG
Supplier: Falcon Eye Services ← Different entity/brand

Use when: Operating under different brand name
```

#### Scenario 3: Third-Party Supplier

```
Employer: Falcon Eye Group
Client: Sharaf DG
Supplier: External Staffing Solutions ← Third party

Use when: Outsourcing through another company
```

---

## 📖 Template Placeholders

Add these to your Google Doc template:

```
REQUIRED PLACEHOLDERS:
{{first_party_name_en}}
{{first_party_name_ar}}
{{first_party_crn}}
{{second_party_name_en}}
{{second_party_name_ar}}
{{second_party_crn}}
{{supplier_brand_name_en}} ⭐ NEW!
{{supplier_brand_name_ar}} ⭐ NEW!
{{promoter_name_en}}
{{promoter_name_ar}}
{{id_card_number}}
{{passport_number}}
{{contract_number}}
{{contract_start_date}}
{{contract_end_date}}
{{job_title}}
{{work_location}}
{{department}}

OPTIONAL PLACEHOLDERS:
{{basic_salary}}
{{housing_allowance}}
{{transport_allowance}}
{{probation_period}}
{{notice_period}}
{{working_hours}}
{{special_terms}}

IMAGE PLACEHOLDERS (as Alt Text):
ID_CARD_IMAGE
PASSPORT_IMAGE
```

---

## ✅ Quick Test Checklist

Run through this to verify everything works:

```
[ ] Form loads at /en/contracts/sharaf-dg
[ ] Appears in sidebar under "Contracts"
[ ] Search promoters works
[ ] All 3 dropdowns populate (promoter, employer, client, supplier)
[ ] Can select supplier/brand (3rd party field)
[ ] Supplier preview card shows (3rd card)
[ ] Preview shows all 3 parties
[ ] Can enter all contract details
[ ] Can enter salary + allowances
[ ] Can set employment terms
[ ] Validation prevents submission without images
[ ] Contract creates successfully
[ ] Draft auto-saves every 2 seconds
[ ] PDF generation triggers
[ ] Status updates in real-time
[ ] PDF downloads with all data filled
[ ] Supplier/brand name appears in PDF
[ ] Clear form button works
```

---

## 🚀 Access Methods

### Method 1: Sidebar (Primary)

```
Login → Sidebar → Contract Management → Sharaf DG Deployment [PDF]
```

### Method 2: Direct URL

```
http://localhost:3000/en/contracts/sharaf-dg
http://localhost:3000/ar/contracts/sharaf-dg (Arabic)
```

### Method 3: Dashboard Card (if added)

```
Dashboard → Contract Cards → Sharaf DG Deployment
```

---

## 🎨 Visual Comparison

### Your eXtra Form:

```
Promoter → Employer → Client → Details → Submit
```

### New Sharaf DG Form:

```
Promoter → Employer → Client → Supplier → Details → Submit → PDF
            └─────────┬─────────┬────────┘
              All from parties table
              Supplier shows names only (EN/AR)
```

---

## 💡 Pro Tips

1. **Supplier same as employer?** Just select the same party twice
2. **Missing promoter images?** Upload via Promoters page first
3. **Form auto-saves?** Yes! Your draft saves every 2 seconds
4. **Can search?** Yes! Type in promoter search box
5. **Need to clear?** Click "Clear Form" button (with confirmation)

---

## ✅ Summary

**What changed:**

- ✅ Added Supplier/Brand field (3rd party selection)
- ✅ Matches eXtra Contracts form style
- ✅ All employment terms included
- ✅ Auto-save draft feature
- ✅ Search promoters feature
- ✅ Better validation
- ✅ 3 party preview cards

**Status:** Production ready, matching eXtra form perfectly!

**Access:** Sidebar → Contract Management → Sharaf DG Deployment [PDF]

---

**Try it now!** Go to your app and look for the link in the sidebar! 🚀
