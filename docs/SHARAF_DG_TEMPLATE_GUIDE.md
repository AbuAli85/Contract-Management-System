# 📝 Sharaf DG Deployment Letter - Template Creation Guide

**Document Type:** Bilingual Deployment Letter (English/Arabic)  
**Client:** Sharaf DG  
**Purpose:** Formal deployment letter for promoters

---

## 🎨 Template Structure

### Page Setup
- **Size:** A4 (210mm × 297mm)
- **Margins:** 
  - Top: 2.5cm
  - Bottom: 2.5cm
  - Left: 2.5cm
  - Right: 2.5cm
- **Orientation:** Portrait
- **Font (English):** Arial, 11pt
- **Font (Arabic):** Arial, 12pt (slightly larger for readability)

---

## 📄 Complete Template Layout

### Header Section

```
┌────────────────────────────────────────────────────────────┐
│  [FIRST_PARTY_LOGO]              [SECOND_PARTY_LOGO]       │
│  (100x50px)                            (100x50px)          │
│                                                            │
│            EMPLOYEE DEPLOYMENT LETTER                      │
│              خطاب إلحاق موظف                              │
└────────────────────────────────────────────────────────────┘
```

### Document Information (Arabic Section)

```
─────────────────────────────────────────────────────────────

التاريخ: {{contract_start_date}}
رقم المرجع: {{contract_number}}

السادة/ {{second_party_name_ar}}
المحترمين،

الموضوع: خطاب إلحاق موظف

تحية طيبة وبعد،

نشير إلى العقد المبرم بين شركتنا {{first_party_name_ar}}
(سجل تجاري رقم: {{first_party_crn}})
وشركتكم الموقرة {{second_party_name_ar}}
(سجل تجاري رقم: {{second_party_crn}})

يسرنا أن نفيدكم بأنه تم إلحاق الموظف التالي للعمل لديكم:

───────────────────────────────────────────────────────────

معلومات الموظف / Employee Information:

الاسم بالعربي: {{promoter_name_ar}}
Name in English: {{promoter_name_en}}

رقم الهوية الوطنية: {{id_card_number}}
National ID Number

رقم الجواز: {{passport_number}}
Passport Number

───────────────────────────────────────────────────────────

صورة الهوية الوطنية / National ID Card:
[ID_CARD_IMAGE]
(Insert image here - will be replaced by actual ID card)

───────────────────────────────────────────────────────────

صورة الجواز / Passport Copy:
[PASSPORT_IMAGE]
(Insert image here - will be replaced by actual passport)

───────────────────────────────────────────────────────────

تفاصيل العقد / Contract Details:

تاريخ البدء / Start Date: {{contract_start_date}}
تاريخ الانتهاء / End Date: {{contract_end_date}}

───────────────────────────────────────────────────────────

ملاحظات / Notes:

1. الموظف المذكور أعلاه يعمل تحت إشرافنا المباشر
   The above-mentioned employee works under our direct supervision

2. نحن مسؤولون عن كافة المستحقات المالية والقانونية للموظف
   We are responsible for all financial and legal obligations

3. يلتزم الموظف بكافة القوانين واللوائح المعمول بها
   Employee must comply with all applicable laws and regulations

───────────────────────────────────────────────────────────

وتفضلوا بقبول فائق الاحترام والتقدير
Please accept our highest regards

{{first_party_name_ar}}
{{first_party_name_en}}

_______________________
التوقيع / Signature

_______________________
الختم / Stamp

_______________________
التاريخ / Date

─────────────────────────────────────────────────────────────
```

---

## 🔧 How to Create in Google Docs

### Step 1: Create New Document

1. Go to Google Drive → `contracts/templates/`
2. Click **New** → **Google Docs**
3. Name: `Promoters deployment letter-Sharaf DG`

### Step 2: Add Header Logos

1. **Insert First Party Logo:**
   - Click where you want logo
   - Insert → Image → Upload (or URL)
   - Resize to 100×50px
   - Align left
   - Add alt text: "FIRST_PARTY_LOGO"

2. **Insert Second Party Logo:**
   - Same row as first logo
   - Align right
   - Add alt text: "SECOND_PARTY_LOGO"

### Step 3: Add Title

```
Center align
Font: Arial Bold, 14pt
───────────────────────────
EMPLOYEE DEPLOYMENT LETTER
خطاب إلحاق موظف
───────────────────────────
```

### Step 4: Add Placeholders

**Important:** Type placeholders EXACTLY as shown (including double braces):

```
{{first_party_name_ar}}
{{first_party_name_en}}
{{second_party_name_ar}}
{{second_party_name_en}}
{{promoter_name_ar}}
{{promoter_name_en}}
{{id_card_number}}
{{passport_number}}
{{contract_start_date}}
{{contract_end_date}}
{{contract_number}}
{{first_party_crn}}
{{second_party_crn}}
```

### Step 5: Add Image Placeholders

1. **ID Card Image:**
   - Insert → Image → Upload a placeholder image (e.g., 400×250px rectangle)
   - Right-click → Alt text → Add: `ID_CARD_IMAGE`
   - This text will be used by Make.com to replace the image

2. **Passport Image:**
   - Same process
   - Alt text: `PASSPORT_IMAGE`

### Step 6: Format Arabic Text

1. Select all Arabic text
2. Format → Paragraph styles → Normal text
3. Text direction: Right-to-left (RTL)
4. Font: Arial, 12pt
5. Line spacing: 1.15

### Step 7: Add Borders/Lines

Use horizontal lines to separate sections:
- Insert → Horizontal line
- Or use underscores: `_______________________`

### Step 8: Final Formatting

```
Alignment:
- Title: Center
- Arabic paragraphs: Right align (RTL)
- English paragraphs: Left align
- Bilingual: Center or as appropriate

Spacing:
- Between sections: 1 blank line
- Between paragraphs: 0.5 lines
- Before headings: 1 line

Colors:
- Headers: Black or company color
- Body text: Black
- Borders: Light gray (#CCCCCC)
```

---

## 🎯 Placeholder Reference Table

| Placeholder | Data Type | Example | Format |
|-------------|-----------|---------|--------|
| `{{first_party_name_ar}}` | Text (RTL) | مجموعة عين الصقر | Arabic |
| `{{first_party_name_en}}` | Text | Falcon Eye Group | English |
| `{{second_party_name_ar}}` | Text (RTL) | شرف دي جي | Arabic |
| `{{second_party_name_en}}` | Text | Sharaf DG | English |
| `{{promoter_name_ar}}` | Text (RTL) | أحمد محمد | Arabic |
| `{{promoter_name_en}}` | Text | Ahmad Mohammed | English |
| `{{id_card_number}}` | Number | 123456789 | As-is |
| `{{passport_number}}` | Text | A12345678 | As-is |
| `{{contract_start_date}}` | Date | 01-11-2025 | DD-MM-YYYY |
| `{{contract_end_date}}` | Date | 31-12-2025 | DD-MM-YYYY |
| `{{contract_number}}` | Text | SDG-2025-001 | As-is |
| `{{first_party_crn}}` | Number | 1234567890 | As-is |
| `{{second_party_crn}}` | Number | 9876543210 | As-is |

---

## 📐 Design Guidelines

### Colors

```css
Primary:   #1E40AF (Blue - for headers)
Secondary: #059669 (Green - for highlights)
Text:      #1F2937 (Dark gray)
Border:    #E5E7EB (Light gray)
Background: #FFFFFF (White)
```

### Typography Scale

```
H1 (Main Title):     18pt, Bold
H2 (Section):        14pt, Bold
H3 (Subsection):     12pt, Bold
Body (English):      11pt, Regular
Body (Arabic):       12pt, Regular
Small print:         9pt, Regular
```

### Spacing

```
Section gap:         24pt
Paragraph gap:       12pt
Line height:         1.15
Margin left/right:   2.5cm
Margin top/bottom:   2.5cm
```

---

## ✅ Validation Checklist

Before saving template:

- [ ] All placeholders use `{{double_braces}}`
- [ ] Spelling checked for both languages
- [ ] Image placeholders have correct alt text
- [ ] Arabic text is RTL
- [ ] Logos are properly sized
- [ ] All sections are present
- [ ] Formatting is consistent
- [ ] No hard-coded data (everything is placeholder)
- [ ] Page breaks in appropriate places
- [ ] Footer on every page

---

## 🔍 Testing the Template

### Test Data

```json
{
  "first_party_name_ar": "مجموعة عين الصقر",
  "first_party_name_en": "Falcon Eye Group",
  "first_party_crn": "1234567890",
  "second_party_name_ar": "شرف دي جي",
  "second_party_name_en": "Sharaf DG",
  "second_party_crn": "9876543210",
  "promoter_name_ar": "أحمد محمد علي",
  "promoter_name_en": "Ahmad Mohammed Ali",
  "id_card_number": "123456789",
  "passport_number": "A12345678",
  "contract_start_date": "01-11-2025",
  "contract_end_date": "31-12-2025",
  "contract_number": "SDG-2025-001"
}
```

### Manual Test

1. Make a copy of template
2. Find & Replace each placeholder with test data
3. Check:
   - All text replaced
   - Formatting preserved
   - Arabic RTL working
   - Images in correct position
   - No formatting breaks

---

## 📤 Publishing Template

### Get Template ID

1. Open your template in Google Docs
2. Look at URL: `https://docs.google.com/document/d/[TEMPLATE_ID]/edit`
3. Copy the `TEMPLATE_ID`
4. Update Make.com scenario with this ID

### Share Settings

1. Right-click template → Share
2. Change to: "Anyone with the link can view"
3. This allows Make.com to access it

### Folder Structure

```
Google Drive
└── contracts/
    └── templates/
        ├── Promoters deployment letter-Sharaf DG (this template)
        ├── Other templates...
    └── generated/
        ├── SDG-2025-001-Ahmad.pdf
        ├── SDG-2025-002-Mohammed.pdf
        └── ...
```

---

## 🛠️ Troubleshooting

### Issue: Placeholders not replacing

**Cause:** Typo in placeholder  
**Fix:** Ensure exact match (case-sensitive, with braces)

### Issue: Images not embedding

**Cause:** Alt text not set correctly  
**Fix:** Right-click image → Alt text → Add exact text: `ID_CARD_IMAGE`

### Issue: Arabic text showing left-to-right

**Cause:** Text direction not set  
**Fix:** Select text → Format → Text direction → Right-to-left

### Issue: Formatting breaks after replacement

**Cause:** Placeholder spans multiple formatting blocks  
**Fix:** Keep each placeholder in single formatting block

---

## 📚 Additional Resources

- [Google Docs API](https://developers.google.com/docs/api)
- [Make.com Google Docs Integration](https://www.make.com/en/integrations/google-docs)
- [Arabic Typography Best Practices](https://www.w3.org/TR/alreq/)

---

**Next:** Implement UI components (`CONTRACT_PDF_UI_COMPONENTS.md`)

