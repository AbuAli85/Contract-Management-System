# Make.com Google Docs - Replace Text Configuration

## Detailed Step-by-Step Guide

---

## Current Module: Google Docs → Replace Text in a Document

### **Configuration Fields:**

#### **1. Connection**

```
✅ Already set: "My Google connection"
Leave as is.
```

#### **2. Choose a Drive**

```
✅ Already set: "My Drive"
Leave as is.
```

#### **3. Document ID** ⚠️ FIX THIS

```
❌ Current (WRONG): /1WoJfPb62lLAKaM1TjEiXH3zwifkXmq3a/1dzYQ_MDstiErG9O1yP8Z_bVXvDPQbe8V/...

✅ Should be ONE of these:

Option A - If this is the first module using the template:
1dzYQ_MDstiErG9O1yP87_bVXvDPQbe8V

Option B - If a previous module created a copy (Module 2):
{{2.id}}

Option C - If Module 6 created the copy:
{{6.id}}
```

**How to fix:**

1. Click in the "Document ID" field
2. Clear everything
3. Type: `1dzYQ_MDstiErG9O1yP87_bVXvDPQbe8V`
4. OR click and select from previous module output

---

#### **4. Replace a Text** ⚠️ FIX THIS

**Current Problem:** Shows `[object Object]` - this is broken!

**Solution:**

1. **Look for the "Map" toggle** (it should be ON - shown in blue)
2. **Click "Map" to turn it OFF** - the toggle will turn gray
3. **The interface will change** to show an "Add item" button
4. **Now click "Add item"** repeatedly and fill in the fields below

---

### **Text Replacement Items (Add 15 items minimum):**

After clicking "Add item", you'll see TWO fields for each item:

- **Find:** What text to find in the document
- **Replace with:** What to replace it with

---

#### **Item 1: Contract Number**

```
Find: {{contract_number}}
Replace with: [Click inside, then select] 1. contract_number
  → This will insert: {{1.contract_number}}
```

#### **Item 2: Contract Type**

```
Find: {{contract_type}}
Replace with: [Click inside, then select] 1. contract_type
  → This will insert: {{1.contract_type}}
```

#### **Item 3: Start Date**

```
Find: {{contract_start_date}}
Replace with: [Click inside, then select] 1. contract_start_date
  → This will insert: {{1.contract_start_date}}
```

#### **Item 4: End Date**

```
Find: {{contract_end_date}}
Replace with: [Click inside, then select] 1. contract_end_date
  → This will insert: {{1.contract_end_date}}
```

#### **Item 5: Job Title**

```
Find: {{job_title}}
Replace with: [Click inside, then select] 1. job_title
  → This will insert: {{1.job_title}}
```

#### **Item 6: Department**

```
Find: {{department}}
Replace with: [Click inside, then select] 1. department
  → This will insert: {{1.department}}
```

#### **Item 7: Work Location**

```
Find: {{work_location}}
Replace with: [Click inside, then select] 1. work_location
  → This will insert: {{1.work_location}}
```

#### **Item 8: Working Hours**

```
Find: {{working_hours_numeric}}
Replace with: [Click inside, then select] 1. working_hours_numeric
  → This will insert: {{1.working_hours_numeric}}
```

#### **Item 9: Basic Salary**

```
Find: {{basic_salary}}
Replace with: [Click inside, then select] 1. basic_salary
  → This will insert: {{1.basic_salary}}
```

#### **Item 10: Currency**

```
Find: {{currency}}
Replace with: [Click inside, then select] 1. currency
  → This will insert: {{1.currency}}
```

#### **Item 11: Probation Period**

```
Find: {{probation_period_numeric}}
Replace with: [Click inside, then select] 1. probation_period_numeric
  → This will insert: {{1.probation_period_numeric}}
```

#### **Item 12: Notice Period**

```
Find: {{notice_period_numeric}}
Replace with: [Click inside, then select] 1. notice_period_numeric
  → This will insert: {{1.notice_period_numeric}}
```

#### **Item 13: Promoter Name (English)**

```
Find: {{promoter_name_en}}
Replace with: [Click inside, then select] 1. promoter_name_en
  → This will insert: {{1.promoter_name_en}}
```

#### **Item 14: Promoter ID Card Number**

```
Find: {{promoter_id_card_number}}
Replace with: [Click inside, then select] 1. promoter_id_card_number
  → This will insert: {{1.promoter_id_card_number}}
```

#### **Item 15: First Party Name (English)**

```
Find: {{first_party_name_en}}
Replace with: [Click inside, then select] 1. first_party_name_en
  → This will insert: {{1.first_party_name_en}}
```

#### **Item 16: First Party CRN**

```
Find: {{first_party_crn}}
Replace with: [Click inside, then select] 1. first_party_crn
  → This will insert: {{1.first_party_crn}}
```

#### **Item 17: Second Party Name (English)**

```
Find: {{second_party_name_en}}
Replace with: [Click inside, then select] 1. second_party_name_en
  → This will insert: {{1.second_party_name_en}}
```

#### **Item 18: Second Party CRN**

```
Find: {{second_party_crn}}
Replace with: [Click inside, then select] 1. second_party_crn
  → This will insert: {{1.second_party_crn}}
```

---

### **Visual Guide for Each Item:**

When you click "Add item", you'll see this:

```
┌─────────────────────────────────────────┐
│ Item 1                                  │
├─────────────────────────────────────────┤
│ Find                                    │
│ ┌─────────────────────────────────────┐ │
│ │ {{contract_number}}                 │ │  ← Type this manually (with curly braces)
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Replace with                            │
│ ┌─────────────────────────────────────┐ │
│ │ [Click here to map]                 │ │  ← Click, then select from dropdown
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

After mapping, it should look like:

```
┌─────────────────────────────────────────┐
│ Item 1                                  │
├─────────────────────────────────────────┤
│ Find                                    │
│ ┌─────────────────────────────────────┐ │
│ │ {{contract_number}}                 │ │
│ └─────────────────────────────────────┘ │
├─────────────────────────────────────────┤
│ Replace with                            │
│ ┌─────────────────────────────────────┐ │
│ │ {{1.contract_number}}               │ │  ← Notice the "1." prefix
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

---

## **Final Configuration Summary:**

```yaml
Module: Google Docs → Replace Text in a Document

Connection: My Google connection
Choose a Drive: My Drive
Document ID: 1dzYQ_MDstiErG9O1yP87_bVXvDPQbe8V

Replace a Text: [18 items]
  1. {{contract_number}} → {{1.contract_number}}
  2. {{contract_type}} → {{1.contract_type}}
  3. {{contract_start_date}} → {{1.contract_start_date}}
  4. {{contract_end_date}} → {{1.contract_end_date}}
  5. {{job_title}} → {{1.job_title}}
  6. {{department}} → {{1.department}}
  7. {{work_location}} → {{1.work_location}}
  8. {{working_hours_numeric}} → {{1.working_hours_numeric}}
  9. {{basic_salary}} → {{1.basic_salary}}
  10. {{currency}} → {{1.currency}}
  11. {{probation_period_numeric}} → {{1.probation_period_numeric}}
  12. {{notice_period_numeric}} → {{1.notice_period_numeric}}
  13. {{promoter_name_en}} → {{1.promoter_name_en}}
  14. {{promoter_id_card_number}} → {{1.promoter_id_card_number}}
  15. {{first_party_name_en}} → {{1.first_party_name_en}}
  16. {{first_party_crn}} → {{1.first_party_crn}}
  17. {{second_party_name_en}} → {{1.second_party_name_en}}
  18. {{second_party_crn}} → {{1.second_party_crn}}
```

---

## **Common Mistakes to Avoid:**

❌ **Wrong:** Leaving "Map" toggle ON and trying to paste JSON
✅ **Right:** Turn "Map" toggle OFF, then use "Add item" button

❌ **Wrong:** Document ID with slashes like `/1Wo.../1dz.../1dG...`
✅ **Right:** Single clean ID: `1dzYQ_MDstiErG9O1yP87_bVXvDPQbe8V`

❌ **Wrong:** "Replace with" field shows `[object Object]`
✅ **Right:** "Replace with" field shows `{{1.contract_number}}`

❌ **Wrong:** Mapping to Module 2 when it doesn't exist
✅ **Right:** Mapping to Module 1 (the webhook) `{{1.field_name}}`

---

## **Testing:**

After configuration:

1. Click "Save" (bottom right)
2. Click "Run once" (bottom of screen)
3. Generate a contract in your app
4. Check if Google Doc is created/updated
5. Verify text replacements worked

---

## **Troubleshooting:**

### **If variables don't appear in dropdown:**

- Module 1 hasn't run yet
- Run scenario once first to populate data

### **If you get "Variable not found":**

- The "Find" text doesn't match your template
- Check your Google Doc template has `{{contract_number}}` etc.

### **If nothing gets replaced:**

- Module is working but template doesn't have matching placeholders
- Open template and verify placeholder names match exactly
