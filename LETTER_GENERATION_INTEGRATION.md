# 📝 Letter Generation Integration with Contract Templates

## Overview

The letter generation system has been integrated with your existing **contract generation infrastructure** to leverage the same Google Docs templates and Make.com workflows.

---

## 🔗 Integration Architecture

### **Shared Infrastructure**

Letters use the same systems as contracts:

1. **Google Docs Templates** - Store letter templates in Google Drive
2. **Make.com Integration** - Optional PDF generation workflow
3. **Supabase Storage** - Document storage
4. **Database Tables** - `hr_letters` table stores letter records

### **Key Differences: Contracts vs Letters**

| Aspect | Contracts | Letters |
|--------|-----------|---------|
| **Purpose** | Legal agreements between parties | Official documents/certificates |
| **Complexity** | High (multiple clauses, terms) | Low (simple format) |
| **Templates** | 3 specialized templates (eXtra, General, Sharaf DG) | Multiple letter type templates |
| **PDF Generation** | Via Make.com (automated) | Can use same system |
| **Approval** | May require approval workflow | Usually simple approval |

---

## 📋 Letter Types Supported

1. **Salary Certificate** - Employee salary confirmation
2. **Official Letter** - General official correspondence
3. **Leave Approval Letter** - Leave request approval
4. **Employment Certificate** - Employment confirmation
5. **Experience Certificate** - Work experience proof
6. **No Objection Certificate (NOC)** - For various purposes
7. **Transfer Letter** - Employee transfer documentation
8. **Termination Letter** - Employment termination
9. **Warning Letter** - Disciplinary action
10. **Appreciation Letter** - Recognition/acknowledgment

---

## 🔄 Integration Options

### **Option 1: Use Existing Contract Templates** (Recommended for now)

Letters can be generated as simplified contracts using your existing templates:

- Use **General Contract** template for official letters
- Use **eXtra Contract** template for simple certificates
- Modify content programmatically

### **Option 2: Create Letter-Specific Google Docs Templates** (Future enhancement)

Create dedicated Google Docs templates for each letter type, similar to how you have:
- `Promoter Contract1` template
- `Promoter Contract-general` template
- Sharaf DG deployment template

**Letter templates would be:**
- `Salary Certificate Template`
- `Official Letter Template`
- `Leave Approval Letter Template`
- etc.

### **Option 3: Hybrid Approach** (Current implementation)

- Store letter content in database (`hr_letters` table)
- Generate simple text-based letters
- Optionally generate PDFs using the same Make.com workflow
- Can be upgraded to use Google Docs templates later

---

## 🛠️ Implementation Status

### ✅ **Completed**

1. ✅ Database schema (`hr_letters`, `letter_templates` tables)
2. ✅ Letter generation API (`/api/hr/letters/generate`)
3. ✅ Letter generator UI component
4. ✅ Basic content generation (auto-generated from employee data)

### 🔄 **Can Be Enhanced** (Using existing contract infrastructure)

1. **Google Docs Template Integration**
   - Create letter templates in Google Drive
   - Use `GoogleDocsService` to generate from templates
   - Replace placeholders (like contract generation does)

2. **Make.com PDF Generation**
   - Create Make.com scenario for letter PDF generation
   - Reuse the PDF generation webhook (`/api/webhook/contract-pdf-ready`)
   - Store PDF URLs in `hr_letters.pdf_url`

3. **Template Management**
   - Use same template management system as contracts
   - Store template IDs in `letter_templates` table
   - Map letter types to Google Docs template IDs

---

## 📝 How to Add Google Docs Template Support

### Step 1: Create Letter Templates in Google Drive

Create Google Docs templates for each letter type, similar to your contract templates:

```
📁 Letter Templates/
  ├── Salary Certificate Template
  ├── Official Letter Template
  ├── Leave Approval Letter Template
  ├── Employment Certificate Template
  └── ... (other letter types)
```

### Step 2: Update Letter Generation API

Modify `/api/hr/letters/generate` to use Google Docs service:

```typescript
// Use existing GoogleDocsService
import { GoogleDocsService } from '@/lib/google-docs-service';

// Get template ID for letter type
const templateId = getLetterTemplateId(letter_type);

// Generate from template (like contracts do)
const googleDocsService = new GoogleDocsService();
const result = await googleDocsService.generateContract({
  ...letterData,
  templateId,
});
```

### Step 3: Use Make.com for PDF (Optional)

If you want automated PDF generation:

1. Create Make.com scenario for letter PDF generation
2. Use same webhook pattern as contracts
3. Update `hr_letters` table with PDF URL

---

## 🎯 Current vs Enhanced Implementation

### **Current (Basic)**

```
Letter Generation → Database Storage → Text Content
```

### **Enhanced (With Templates - Future)**

```
Letter Generation → Google Docs Template → PDF Generation (Make.com) → Storage
```

(Similar to contract generation flow)

---

## 🔧 Quick Integration Example

To integrate with existing contract template system, update the letter generation API:

```typescript
// app/api/hr/letters/generate/route.ts

import { GoogleDocsService } from '@/lib/google-docs-service';

// Map letter types to template IDs
const LETTER_TEMPLATE_IDS: Record<string, string> = {
  salary_certificate: 'GOOGLE_DOCS_TEMPLATE_ID_HERE',
  official: 'GOOGLE_DOCS_TEMPLATE_ID_HERE',
  // ... other types
};

// In POST handler:
if (template_id || LETTER_TEMPLATE_IDS[letter_type]) {
  const templateId = template_id || LETTER_TEMPLATE_IDS[letter_type];
  const googleDocsService = new GoogleDocsService();
  
  // Generate from template (reuse contract generation logic)
  const docResult = await googleDocsService.generateContract({
    contract_number: `LTR-${Date.now()}`, // Letter number
    ...letterData,
    templateId,
  });
  
  // Update letter with document URL
  updateData.document_url = docResult.documentUrl;
  updateData.pdf_url = docResult.pdfUrl;
}
```

---

## 📊 Recommendation

**For now:** Keep letters simple (current implementation) since they're less complex than contracts.

**Future enhancement:** When you need:
- Consistent branding
- Complex formatting
- Automated PDFs
- Template management

Then integrate with Google Docs templates using the same pattern as contracts.

---

## ✅ Summary

- ✅ Letter system is **separate but compatible** with contract system
- ✅ Can **easily integrate** with existing Google Docs templates
- ✅ Can **reuse Make.com** workflow for PDF generation
- ✅ **Database structure** supports both simple and template-based letters
- ✅ **Current implementation** works independently
- ✅ **Future enhancement** path is clear and aligned with contract system

The letter generation system complements your contract generation system and can leverage the same infrastructure when needed!

