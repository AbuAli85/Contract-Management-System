# Make.com Configuration - For Your Actual Template

## Template ID: 1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0

---

## **🎯 Your Template Uses Exactly 12 Placeholders**

Based on your template, here are ALL the text replacements needed:

---

## **Module Configuration: Google Docs → Replace Text in a Document**

### **Basic Settings:**

```yaml
Connection: My Google connection
Choose a Drive: My Drive
Document ID: 1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0
```

⚠️ **CRITICAL:** Turn OFF the "Map" toggle next to "Replace a Text"

---

## **Replace a Text: Add Exactly 12 Items**

Click "Add item" for each entry below:

---

### **Item 1: Reference Number**

```
Find: {{ref_number}}
Replace with: {{1.ref_number}}
```

**How to do it:**

- In "Find" field: Type `{{ref_number}}`
- In "Replace with" field: Click inside, select from dropdown `1. ref_number`

---

### **Item 2: First Party Name (Arabic)**

```
Find: {{first_party_name_ar}}
Replace with: {{1.first_party_name_ar}}
```

---

### **Item 3: First Party CRN**

```
Find: {{first_party_crn}}
Replace with: {{1.first_party_crn}}
```

---

### **Item 4: Second Party Name (Arabic)**

```
Find: {{second_party_name_ar}}
Replace with: {{1.second_party_name_ar}}
```

---

### **Item 5: Second Party CRN**

```
Find: {{second_party_crn}}
Replace with: {{1.second_party_crn}}
```

---

### **Item 6: Promoter Name (Arabic)**

```
Find: {{promoter_name_ar}}
Replace with: {{1.promoter_name_ar}}
```

---

### **Item 7: ID Card Number**

```
Find: {{id_card_number}}
Replace with: {{1.id_card_number}}
```

---

### **Item 8: Contract Start Date**

```
Find: {{contract_start_date}}
Replace with: {{1.contract_start_date}}
```

---

### **Item 9: Contract End Date**

```
Find: {{contract_end_date}}
Replace with: {{1.contract_end_date}}
```

---

### **Item 10: First Party Name (English)**

```
Find: {{first_party_name_en}}
Replace with: {{1.first_party_name_en}}
```

---

### **Item 11: Second Party Name (English)**

```
Find: {{second_party_name_en}}
Replace with: {{1.second_party_name_en}}
```

---

### **Item 12: Promoter Name (English)**

```
Find: {{promoter_name_en}}
Replace with: {{1.promoter_name_en}}
```

---

## **✅ Complete Configuration Summary**

Your "Replace a Text" section should have exactly **12 items**:

```yaml
Item 1: {{ref_number}} → {{1.ref_number}}
Item 2: {{first_party_name_ar}} → {{1.first_party_name_ar}}
Item 3: {{first_party_crn}} → {{1.first_party_crn}}
Item 4: {{second_party_name_ar}} → {{1.second_party_name_ar}}
Item 5: {{second_party_crn}} → {{1.second_party_crn}}
Item 6: {{promoter_name_ar}} → {{1.promoter_name_ar}}
Item 7: {{id_card_number}} → {{1.id_card_number}}
Item 8: {{contract_start_date}} → {{1.contract_start_date}}
Item 9: {{contract_end_date}} → {{1.contract_end_date}}
Item 10: {{first_party_name_en}} → {{1.first_party_name_en}}
Item 11: {{second_party_name_en}} → {{1.second_party_name_en}}
Item 12: {{promoter_name_en}} → {{1.promoter_name_en}}
```

---

## **📋 Quick Copy Reference**

For the "Find" fields, copy these exactly (with curly braces):

```
{{ref_number}}
{{first_party_name_ar}}
{{first_party_crn}}
{{second_party_name_ar}}
{{second_party_crn}}
{{promoter_name_ar}}
{{id_card_number}}
{{contract_start_date}}
{{contract_end_date}}
{{first_party_name_en}}
{{second_party_name_en}}
{{promoter_name_en}}
```

For the "Replace with" fields, use the variable picker to select:

```
1. ref_number
1. first_party_name_ar
1. first_party_crn
1. second_party_name_ar
1. second_party_crn
1. promoter_name_ar
1. id_card_number
1. contract_start_date
1. contract_end_date
1. first_party_name_en
1. second_party_name_en
1. promoter_name_en
```

---

## **🎬 Step-by-Step Visual Guide**

### **Step 1: Open Your Module**

You should see:

```
┌─────────────────────────────────────────┐
│ Google Docs                             │
├─────────────────────────────────────────┤
│ Connection: My Google connection        │
│ Choose a Drive: My Drive                │
│ Document ID: [paste template ID here]   │
│ Replace a Text: [Map toggle] [Add item] │
└─────────────────────────────────────────┘
```

### **Step 2: Turn OFF Map Toggle**

The toggle should be GRAY (OFF), not blue.

### **Step 3: Click "Add item" 12 Times**

For each item:

1. Type the "Find" text with curly braces
2. Click in "Replace with" and select from dropdown

### **Step 4: Your Module Should Look Like This**

```
Document ID: 1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0

Replace a Text: [12 items]
  ┌─────────────────────────────────────┐
  │ Item 1                              │
  │ Find: {{ref_number}}                │
  │ Replace: {{1.ref_number}}           │
  └─────────────────────────────────────┘
  ┌─────────────────────────────────────┐
  │ Item 2                              │
  │ Find: {{first_party_name_ar}}       │
  │ Replace: {{1.first_party_name_ar}}  │
  └─────────────────────────────────────┘
  ... (10 more items)
```

---

## **🧪 Testing**

After configuration:

1. **Save** the module
2. **Click "Run once"** in Make.com
3. **Generate a contract** in your app with these details:
   - Promoter: One with ID card URL
   - First Party: eXtra (United Electronics Company)
   - Second Party: A vendor company
   - Dates: Start and end dates

4. **Check the output:**
   - Module 1 should show ✓ (webhook received)
   - Module 6 should show ✓ (text replaced)
   - A new Google Doc should appear in your Drive

5. **Open the generated document:**
   - All {{placeholders}} should be replaced with real data
   - Arabic and English names should appear correctly
   - Dates should be formatted properly

---

## **✅ Success Checklist**

- ☐ Document ID is correct
- ☐ "Map" toggle is OFF (gray)
- ☐ All 12 text items added
- ☐ Each "Find" has {{curly_braces}}
- ☐ Each "Replace with" shows {{1.field_name}}
- ☐ Module saved
- ☐ Tested with "Run once"
- ☐ Contract generated successfully
- ☐ All placeholders replaced in document

---

## **🚨 Common Issues**

### **Issue: "Variable not found"**

- Module 1 hasn't run yet
- Run scenario once to populate variables

### **Issue: Text not replaced**

- Spelling mismatch between template and Find field
- Double-check: `{{first_party_name_ar}}` vs `{{firstPartyNameAr}}`

### **Issue: [object Object] error**

- "Map" toggle is still ON
- Turn it OFF and use "Add item" instead

### **Issue: Empty values in document**

- Data not sent from webhook
- Check Module 1 output to verify field exists

---

## **📸 What Good Configuration Looks Like**

When properly configured, clicking on your module should show:

```
Module: Google Docs → Replace Text in a Document
Status: ✓ Success (if tested)

Configuration:
  - Document ID: 1dG719K4jYFrEh8O9VChyMYWblflxW2tdFp2n4gpVhs0
  - Text Replacements: 12 items
  - All items mapped to Module 1 fields
```

---

## **🎯 Next Steps After Text Works**

Once text replacement is working:

1. ✅ Text contracts generate successfully
2. 🔜 Add images (ID card, passport) in a separate module
3. 🔜 Export to PDF
4. 🔜 Upload to specific Google Drive folder
5. 🔜 Send back PDF URL to your app

But for now, focus on getting these 12 text replacements working perfectly!

---

**This is the EXACT configuration for YOUR template. No extra fields, no guessing!** 🎯
